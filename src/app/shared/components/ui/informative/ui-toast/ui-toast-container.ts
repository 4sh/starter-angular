import { isPlatformBrowser } from '@angular/common';
import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  numberAttribute,
  PLATFORM_ID,
  TemplateRef,
} from '@angular/core';
import { UiMotion, UiMotionPreset } from '@app/shared/motion/ui-motion';
import { UiToast } from './ui-toast';
import { UiToastService } from './ui-toast.service';
import { UiToastId, UiToastMessage, UiToastPosition } from './ui-toast.types';

/** Enter/leave motion preset that best fits each anchor edge. */
const MOTION_BY_POSITION: Record<UiToastPosition, UiMotionPreset> = {
  'top-left': 'slide-down',
  'top-center': 'slide-down',
  'top-right': 'slide-down',
  'bottom-left': 'slide-up',
  'bottom-center': 'slide-up',
  'bottom-right': 'slide-up',
  center: 'zoom',
};

/** Base stacking level — mirrors `$toast-z-index` in the SCSS. */
const TOAST_BASE_Z_INDEX = 1100;

/** Process-wide sequence so `autoZIndex` layers later stacks above earlier ones. */
let zIndexSeq = 0;

/**
 * ui-toast-container — the viewport-pinned stack that renders {@link UiToastService}
 * messages as {@link UiToast} cards.
 *
 * Drop one near the app root (e.g. in `app.html`). It reads the service store
 * reactively, shows the slice matching its `key`, animates insert/remove through
 * the shared motion system (`animate.enter` / `animate.leave`), and auto-dismisses
 * non-sticky toasts after `life` ms — pausing the countdown while hovered.
 *
 * Positioning is `fixed` by default (relative to the viewport); set `contained`
 * to switch to `absolute` so the stack stays inside the nearest positioned
 * ancestor (used by the Storybook demos).
 *
 * @example
 * ```html
 * <ui-toast-container position="top-right" [life]="4000" />
 * ```
 */
@Component({
  selector: 'ui-toast-container',
  imports: [UiToast, UiMotion, NgTemplateOutlet],
  templateUrl: './ui-toast-container.html',
  styleUrl: './ui-toast-container.scss',
})
export class UiToastContainer {
  /** Only render messages whose `key` matches (omit to render key-less messages). */
  key = input<string>();
  /** Where the stack is pinned in the viewport. */
  position = input<UiToastPosition>('top-right');
  /** Default auto-dismiss delay (ms) for non-sticky toasts. Per-message `life` wins. */
  life = input(4000, { transform: numberAttribute });
  /** Render toasts as full-width banners (fill the region width). */
  expanded = input(false, { transform: booleanAttribute });
  /** Motion preset override. Defaults to a per-position choice. */
  motion = input<UiMotionPreset>();
  /** Disable enter/leave animation for this stack. */
  motionDisabled = input(false, { transform: booleanAttribute });
  /** Use `position: absolute` (scoped to a positioned ancestor) instead of `fixed`. */
  contained = input(false, { transform: booleanAttribute });
  /**
   * Custom content template rendered inside each card in place of `title`/`text`.
   * Context: `{ $implicit: message, closeFn }`.
   */
  template = input<TemplateRef<unknown>>();
  /** Extra class(es) merged onto the region root. */
  styleClass = input<string>();
  /** Show only the N most recent toasts; older ones wait their turn (`0` = no limit). */
  stackVisibleLimit = input(0, { transform: numberAttribute });
  /** Gap between stacked cards in px (overrides the `--units-sm` token default). */
  stackGap = input<number>();
  /** Skip a new toast whose content (level + title + text) matches a live one. */
  preventDuplicates = input(false, { transform: booleanAttribute });
  /** Automatically layer this stack above earlier ones (later container wins). */
  autoZIndex = input(true, { transform: booleanAttribute });
  /** Floor z-index for the stack (added to the auto value, or used as-is when `autoZIndex=false`). */
  baseZIndex = input(0, { transform: numberAttribute });

  /** @ignore */
  private readonly service = inject(UiToastService);
  /** @ignore Per-instance layering rank for `autoZIndex`. */
  private readonly zSeq = ++zIndexSeq;
  /** @ignore */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** @ignore All live messages routed to this container (drives timers/dedup). */
  private readonly keyed = computed(() =>
    this.service.messages().filter((m) => m.key === this.key()),
  );

  /** @ignore Rendered slice — the most recent `stackVisibleLimit` toasts. */
  protected readonly items = computed(() => {
    const all = this.keyed();
    const limit = this.stackVisibleLimit();
    return limit > 0 ? all.slice(-limit) : all;
  });

  /** @ignore Effective stacking level. */
  protected readonly zIndex = computed(() => {
    const base = this.baseZIndex();
    if (this.autoZIndex()) return TOAST_BASE_Z_INDEX + base + this.zSeq;
    return base > 0 ? base : TOAST_BASE_Z_INDEX;
  });

  /** @ignore Resolved enter/leave preset. */
  protected readonly motionPreset = computed<UiMotionPreset>(
    () => this.motion() ?? MOTION_BY_POSITION[this.position()],
  );

  /** @ignore */
  protected readonly regionClass = computed(() => {
    const c = ['ui-toast-region', `_${this.position()}`];
    if (this.contained()) c.push('_contained');
    if (this.expanded()) c.push('_expanded');
    // Anchor at the bottom edge → newest toast nearest the edge (column-reverse in SCSS).
    if (this.position().startsWith('bottom')) c.push('_reverse');
    const sc = this.styleClass();
    if (sc) c.push(sc);
    return c.join(' ');
  });

  // --- Life timers (auto-dismiss, hover-pausable) ----------------------

  /** @ignore Active timeout handles, keyed by message id. */
  private readonly timers = new Map<UiToastId, ReturnType<typeof setTimeout>>();
  /** @ignore Remaining ms per message (survives hover pause). */
  private readonly remaining = new Map<UiToastId, number>();
  /** @ignore Wall-clock start of the running countdown, per message. */
  private readonly startedAt = new Map<UiToastId, number>();

  constructor() {
    // Reconcile dedup + life timers whenever this container's message set changes.
    effect(() => {
      const keyed = this.keyed();

      // preventDuplicates: drop later toasts whose content matches an earlier one.
      if (this.preventDuplicates()) {
        const seen = new Set<string>();
        const dupes: UiToastId[] = [];
        for (const m of keyed) {
          const sig = `${m.level ?? 'default'}|${m.title ?? ''}|${m.text ?? ''}`;
          if (seen.has(sig)) dupes.push(m.id!);
          else seen.add(sig);
        }
        if (dupes.length) {
          // Store mutation re-runs this effect on the deduplicated set.
          dupes.forEach((id) => this.service.remove(id));
          return;
        }
      }

      const liveIds = new Set(keyed.map((m) => m.id));

      // Drop timer bookkeeping for messages that are gone.
      for (const id of [...this.timers.keys()]) {
        if (!liveIds.has(id)) this.forget(id);
      }
      for (const id of [...this.remaining.keys()]) {
        if (!liveIds.has(id)) this.remaining.delete(id);
      }

      if (!this.isBrowser) return;

      // Arm a countdown for each new, non-sticky message (even ones beyond the
      // visible limit, so a queued toast still expires on schedule).
      for (const message of keyed) {
        const id = message.id!;
        if (message.sticky) continue;
        if (this.timers.has(id) || this.remaining.has(id)) continue;
        const life = message.life ?? this.life();
        if (life > 0) this.arm(id, life);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      for (const id of [...this.timers.keys()]) this.forget(id);
    });
  }

  /** @ignore Start (or restart) a countdown of `ms` for a message. */
  private arm(id: UiToastId, ms: number): void {
    this.remaining.set(id, ms);
    this.startedAt.set(id, Date.now());
    this.timers.set(
      id,
      setTimeout(() => {
        this.timers.delete(id);
        this.service.remove(id);
      }, ms),
    );
  }

  /** @ignore Cancel and drop all timer bookkeeping for a message. */
  private forget(id: UiToastId): void {
    const handle = this.timers.get(id);
    if (handle) clearTimeout(handle);
    this.timers.delete(id);
    this.startedAt.delete(id);
  }

  /** @ignore Pause the countdown on hover/focus (banks the remaining time). */
  protected pause(id: UiToastId | undefined): void {
    if (id == null) return;
    const handle = this.timers.get(id);
    if (!handle) return;
    clearTimeout(handle);
    this.timers.delete(id);
    const banked = this.remaining.get(id) ?? 0;
    const elapsed = Date.now() - (this.startedAt.get(id) ?? Date.now());
    this.remaining.set(id, Math.max(banked - elapsed, 0));
  }

  /** @ignore Resume a paused countdown when the pointer/focus leaves. */
  protected resume(id: UiToastId | undefined): void {
    if (id == null || !this.isBrowser) return;
    if (this.timers.has(id)) return;
    const left = this.remaining.get(id);
    if (left == null || left <= 0) return;
    this.arm(id, left);
  }

  /** @ignore Dismiss a toast (close button or a custom template's `closeFn`). */
  protected dismiss(message: UiToastMessage): void {
    if (message.id != null) this.service.remove(message.id);
  }

  /** @ignore Template-context factory: a bound close handler for one message. */
  protected closeFn(message: UiToastMessage): () => void {
    return () => this.dismiss(message);
  }
}
