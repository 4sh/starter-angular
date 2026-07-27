import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  model,
  numberAttribute,
  output,
  PLATFORM_ID,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgStyle, NgTemplateOutlet } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { UiMotion, UiMotionPreset } from '@app/shared/motion/ui-motion';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

/** Where the dialog is anchored inside the viewport mask. */
export type ModalPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topleft'
  | 'topright'
  | 'bottomleft'
  | 'bottomright';

/** Base stacking level — mirrors `$modal-z-index` in the SCSS. */
const MODAL_BASE_Z_INDEX = 1100;

/** Process-wide sequence so `autoZIndex` layers a later dialog above earlier ones. */
let zIndexSeq = 0;
/** Process-wide unique id source (aria wiring + responsive style scoping). */
let nextUid = 0;

// --- Body scroll lock (ref-counted, shared across nested dialogs) -------
let scrollLockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

/** Freeze background scroll, compensating the scrollbar gutter to avoid a shift. */
function lockBodyScroll(doc: Document): void {
  if (scrollLockCount === 0) {
    const body = doc.body;
    const gap = (doc.defaultView?.innerWidth ?? 0) - doc.documentElement.clientWidth;
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
  }
  scrollLockCount++;
}

/** Release one scroll lock; restore the body when the last dialog closes. */
function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    doc.body.style.overflow = savedOverflow;
    doc.body.style.paddingRight = savedPaddingRight;
  }
}

/**
 * ui-modal — headless dialog / modal window.
 *
 * A token-styled floating surface rendered over a viewport mask, driven by the
 * two-way `visible` model. Enter/leave run through the shared motion system
 * (mask fade + dialog `zoom` by default). Built for accessibility: focus trap
 * with focus restore (`@angular/cdk/a11y`), `aria-modal`, background scroll
 * lock, `Escape` to close, and an optional click-outside dismiss.
 *
 * Composes header / content / footer regions: a plain `header` string (or the
 * `#header` template), the default `<ng-content>` for the body, and a `#footer`
 * template for actions. Supports `draggable`, `maximizable`, nine `position`s,
 * modal / non-modal, and per-breakpoint widths (`breakpoints`).
 *
 * @example
 * ```html
 * <ui-button label="Ouvrir" (buttonClick)="open.set(true)" />
 * <ui-modal [(visible)]="open" header="Titre" [dialogStyle]="{ width: '32rem' }">
 *   <p>Contenu…</p>
 *   <ng-template #footer>
 *     <ui-button label="Fermer" level="low" (buttonClick)="open.set(false)" />
 *   </ng-template>
 * </ui-modal>
 * ```
 */
@Component({
  selector: 'ui-modal',
  imports: [NgTemplateOutlet, NgStyle, A11yModule, UiMotion, UiIcon],
  templateUrl: './ui-modal.html',
  styleUrl: './ui-modal.scss',
})
export class UiModal {
  /** Open state (two-way). Toggling it drives the enter/leave animation. */
  visible = model(false);

  /** Simple header text (ignored when a `#header` template is projected). */
  header = input<string>();
  /** ARIA role of the dialog surface. */
  role = input<string>('dialog');
  /** Accessible name when there is no visible header to reference. */
  ariaLabel = input<string>();
  /** Id of an external element naming the dialog (overrides the header title). */
  ariaLabelledBy = input<string>();

  /** Show the mask (dim + capture) and block background scroll. */
  modal = input(true, { transform: booleanAttribute });
  /** Close when the mask (outside the dialog) is clicked — modal only. */
  dismissableMask = input(false, { transform: booleanAttribute });
  /** Show the close (×) button and allow `Escape` to close. */
  closable = input(true, { transform: booleanAttribute });
  /** Close the dialog when `Escape` is pressed. */
  closeOnEscape = input(true, { transform: booleanAttribute });
  /** Block background scroll even for a non-modal dialog. */
  blockScroll = input(false, { transform: booleanAttribute });
  /** Render the header region (title + actions). */
  showHeader = input(true, { transform: booleanAttribute });

  /** Allow dragging the dialog by its header. */
  draggable = input(false, { transform: booleanAttribute });
  /** Keep the dialog fully inside the viewport while dragging. */
  keepInViewport = input(true, { transform: booleanAttribute });
  /** Minimum left offset kept while dragging (px). */
  minX = input(0, { transform: numberAttribute });
  /** Minimum top offset kept while dragging (px). */
  minY = input(0, { transform: numberAttribute });

  /** Show the maximize / restore toggle in the header. */
  maximizable = input(false, { transform: booleanAttribute });
  /** Allow resizing the dialog from its bottom-right corner (pointer only). */
  resizable = input(false, { transform: booleanAttribute });
  /** Minimum dialog width while resizing (px). */
  minWidth = input(150, { transform: numberAttribute });
  /** Minimum dialog height while resizing (px). */
  minHeight = input(100, { transform: numberAttribute });
  /** Anchor position inside the viewport mask. */
  position = input<ModalPosition>('center');
  /**
   * Scope the dialog to the nearest positioned ancestor (`position: absolute`)
   * instead of the viewport (`position: fixed`), and skip the body scroll lock.
   * Useful to embed a dialog inside a bounded container (docs previews, panels).
   */
  contained = input(false, { transform: booleanAttribute });

  /** Move focus into the dialog when it opens (auto-captured, restored on close). */
  focusOnShow = input(true, { transform: booleanAttribute });
  /** Trap Tab focus inside the dialog while open. */
  focusTrap = input(true, { transform: booleanAttribute });

  /** FontAwesome name of the close button icon. */
  closeIcon = input<string>('xmark');
  /** FontAwesome name of the maximize icon. */
  maximizeIcon = input<string>('expand');
  /** FontAwesome name of the restore (minimize) icon. */
  minimizeIcon = input<string>('compress');
  /** Accessible name of the close button. */
  closeAriaLabel = input<string>('Fermer');
  /** Accessible name of the maximize / restore button. */
  maximizeAriaLabel = input<string>('Agrandir');

  /** Extra class(es) merged onto the dialog surface. */
  styleClass = input<string>();
  /** Extra class(es) merged onto the mask. */
  maskStyleClass = input<string>();
  /** Inline styles applied to the dialog (e.g. `{ width: '32rem' }`). */
  dialogStyle = input<Record<string, string>>();
  /** Per-breakpoint widths, keyed by a `max-width` (e.g. `{ '960px': '75vw' }`). */
  breakpoints = input<Record<string, string>>();

  /** Layer this dialog above earlier overlays automatically. */
  autoZIndex = input(true, { transform: booleanAttribute });
  /** Floor z-index (added to the auto value, or used as-is when `autoZIndex=false`). */
  baseZIndex = input(0, { transform: numberAttribute });

  /** Enter/leave preset for the dialog surface (mask always fades). */
  motion = input<UiMotionPreset>('zoom');
  /** Disable the open/close animation for this dialog. */
  motionDisabled = input(false, { transform: booleanAttribute });

  /** Custom header template (replaces the `header` string). */
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
  /** Footer template (actions row). */
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');
  /** Custom close-icon template (replaces `closeIcon`). */
  protected readonly closeIconTemplate = contentChild<TemplateRef<unknown>>('closeicon');

  /** Emitted after the dialog becomes visible. */
  onShow = output<void>();
  /** Emitted after the dialog is hidden. */
  onHide = output<void>();
  /** Emitted when the maximize state is toggled. */
  onMaximize = output<{ maximized: boolean }>();
  /** Emitted when a drag gesture ends. */
  onDragEnd = output<void>();
  /** Emitted when a resize gesture ends. */
  onResizeEnd = output<{ width: number; height: number }>();

  /** @ignore */
  private readonly dialogRef = viewChild<ElementRef<HTMLElement>>('dialog');
  /** @ignore Scrim host (for imperative `maskStyleClass` — a bound `[class]` would
   *  fight the motion classes and break the leave animation). */
  private readonly scrimRef = viewChild<ElementRef<HTMLElement>>('scrim');
  /** @ignore Classes currently applied to the scrim by `maskStyleClass`. */
  private appliedMaskClasses: string[] = [];

  /** @ignore */
  private readonly document = inject(DOCUMENT);
  /** @ignore */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** @ignore Per-instance layering rank for `autoZIndex`. */
  private readonly zSeq = ++zIndexSeq;

  /** @ignore */
  protected readonly uid = `ui-modal-${nextUid++}`;
  /** @ignore */
  protected readonly titleId = `${this.uid}-title`;

  /** @ignore Maximized (fills the viewport). */
  protected readonly maximized = signal(false);
  /** @ignore Cumulative drag offset applied via the independent `translate` property
   *  (does not clash with the `zoom` animation, which drives `transform`). */
  protected readonly dragOffset = signal<{ x: number; y: number } | null>(null);
  /** @ignore Explicit dialog size while resizing (overrides `dialogStyle` width/height). */
  protected readonly resizeSize = signal<{ w: number; h: number } | null>(null);

  /** @ignore This instance currently holds a body scroll lock. */
  private locked = false;
  /** @ignore Runtime `<style>` element backing `breakpoints`. */
  private styleEl: HTMLStyleElement | null = null;

  /** @ignore Effective stacking level. */
  protected readonly zIndex = computed(() => {
    const base = this.baseZIndex();
    if (this.autoZIndex()) return MODAL_BASE_Z_INDEX + base + this.zSeq;
    return base > 0 ? base : MODAL_BASE_Z_INDEX;
  });

  // NOTE: the scrim and frame carry `animate.enter`/`animate.leave`. They MUST use a
  // static `class` + per-class `[class.x]` toggles (like ui-toast) — a whole-string
  // `[class]="expr()"` binding fights the motion classes Angular adds and restarts the
  // animation every frame (leave never ends → node never removed). Position is applied
  // via `[style]` for the same reason.

  /** @ignore Cross-axis alignment of the dialog inside the frame. */
  protected readonly alignItems = computed(() => {
    const p = this.position();
    if (p.startsWith('top')) return 'flex-start';
    if (p.startsWith('bottom')) return 'flex-end';
    return 'center';
  });
  /** @ignore Main-axis alignment of the dialog inside the frame. */
  protected readonly justifyContent = computed(() => {
    const p = this.position();
    if (p.endsWith('left')) return 'flex-start';
    if (p.endsWith('right')) return 'flex-end';
    return 'center';
  });

  /** @ignore */
  protected readonly dialogClasses = computed(() => {
    const c = ['ui-modal'];
    if (this.maximized()) c.push('_maximized');
    if (this.contained()) c.push('_contained');
    const extra = this.styleClass();
    if (extra) c.push(extra);
    return c.join(' ');
  });

  /** @ignore Header is draggable when enabled and not maximized. */
  protected readonly headerDraggable = computed(() => this.draggable() && !this.maximized());

  /** @ignore Drag offset serialised for the `translate` CSS property. */
  protected readonly dragTranslate = computed(() => {
    if (this.maximized()) return null;
    const o = this.dragOffset();
    return o ? `${o.x}px ${o.y}px` : null;
  });

  /** @ignore Inline styles for the dialog: `dialogStyle` plus the resize size
   *  (which wins), dropped entirely while maximized. */
  protected readonly resolvedDialogStyle = computed(() => {
    if (this.maximized()) return null;
    const base: Record<string, string> = { ...(this.dialogStyle() ?? {}) };
    const size = this.resizeSize();
    if (size) {
      base['width'] = `${size.w}px`;
      base['height'] = `${size.h}px`;
    }
    return Object.keys(base).length ? base : null;
  });

  /** @ignore The resize grip shows when resizable and not maximized. */
  protected readonly showResizeHandle = computed(() => this.resizable() && !this.maximized());

  /** @ignore Id of the element naming the dialog (header title, or an external id). */
  protected readonly labelledBy = computed(
    () => this.ariaLabelledBy() ?? (this.showHeader() && this.header() ? this.titleId : null),
  );
  /** @ignore Fallback accessible name when nothing is referenced. */
  protected readonly resolvedAriaLabel = computed(() => (this.labelledBy() ? null : this.ariaLabel()));

  constructor() {
    const destroyRef = inject(DestroyRef);
    let wasVisible = false;

    // Open/close side effects: scroll lock, lifecycle events, state reset.
    effect(() => {
      const v = this.visible();
      untracked(() => {
        if (v && !wasVisible) {
          wasVisible = true;
          // A contained dialog is embedded, not a real overlay → never lock the body.
          if (this.isBrowser && !this.contained() && (this.modal() || this.blockScroll())) {
            lockBodyScroll(this.document);
            this.locked = true;
          }
          this.onShow.emit();
        } else if (!v && wasVisible) {
          wasVisible = false;
          this.releaseLock();
          this.maximized.set(false);
          this.dragOffset.set(null);
          this.resizeSize.set(null);
          this.onHide.emit();
        }
      });
    });

    // Rebuild the responsive width stylesheet when `breakpoints` changes.
    effect(() => {
      const bps = this.breakpoints();
      untracked(() => this.applyBreakpoints(bps));
    });

    // Apply `maskStyleClass` imperatively (see scrimRef note).
    effect(() => {
      const el = this.scrimRef()?.nativeElement;
      const raw = this.maskStyleClass();
      untracked(() => {
        for (const c of this.appliedMaskClasses) el?.classList.remove(c);
        this.appliedMaskClasses = el && raw ? raw.split(/\s+/).filter(Boolean) : [];
        for (const c of this.appliedMaskClasses) el!.classList.add(c);
      });
    });

    // A11y safeguard: a dialog must have an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this.visible() && !this.labelledBy() && !this.resolvedAriaLabel()) {
          console.warn(
            '[ui-modal] Boîte de dialogue sans nom accessible : renseignez `header`, `ariaLabel` ou `ariaLabelledBy`.',
          );
        }
      });
    }

    destroyRef.onDestroy(() => {
      this.releaseLock();
      this.removeStyleElement();
      this.removeDragListeners();
      this.removeResizeListeners();
    });
  }

  /** Close the dialog. */
  close(): void {
    this.visible.set(false);
  }

  /** Move focus onto the dialog surface. */
  focus(): void {
    this.dialogRef()?.nativeElement.focus();
  }

  /** @ignore Toggle maximized; lock scroll for a non-modal dialog that now fills the screen. */
  protected toggleMaximize(): void {
    const next = !this.maximized();
    this.maximized.set(next);
    if (next) {
      this.dragOffset.set(null);
      this.resizeSize.set(null);
    }
    if (this.isBrowser && !this.contained() && !this.modal() && !this.blockScroll()) {
      if (next) {
        lockBodyScroll(this.document);
        this.locked = true;
      } else {
        this.releaseLock();
      }
    }
    this.onMaximize.emit({ maximized: next });
  }

  /** @ignore Escape-to-close (bubbles from any focused control inside the dialog). */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closeOnEscape() && this.closable()) {
      event.stopPropagation();
      this.close();
    }
  }

  /** @ignore Click-outside dismiss (mask target only, modal + dismissable). */
  protected onMaskPointerdown(event: PointerEvent): void {
    if (!this.modal() || !this.dismissableMask() || !this.closable()) return;
    if (event.target === event.currentTarget) this.close();
  }

  // --- Drag (header handle) -------------------------------------------

  /** @ignore */
  private dragging = false;
  /** @ignore */
  private lastX = 0;
  /** @ignore */
  private lastY = 0;
  /** @ignore */
  private readonly moveHandler = (e: PointerEvent): void => this.onDrag(e);
  /** @ignore */
  private readonly upHandler = (e: PointerEvent): void => this.endDrag(e);

  /** @ignore */
  protected onHeaderPointerdown(event: PointerEvent): void {
    if (!this.headerDraggable() || event.button !== 0) return;
    // Never start a drag from the header action buttons.
    if ((event.target as HTMLElement).closest('button')) return;
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.document.addEventListener('pointermove', this.moveHandler);
    this.document.addEventListener('pointerup', this.upHandler);
    this.document.body.style.userSelect = 'none';
  }

  /** @ignore */
  private onDrag(event: PointerEvent): void {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    const cur = this.dragOffset() ?? { x: 0, y: 0 };
    let nx = cur.x + dx;
    let ny = cur.y + dy;

    const el = this.dialogRef()?.nativeElement;
    if (this.keepInViewport() && el) {
      const rect = el.getBoundingClientRect();
      const view = this.document.defaultView;
      const vw = view?.innerWidth ?? rect.right;
      const vh = view?.innerHeight ?? rect.bottom;
      // Reject a delta that would push the dialog past a viewport edge.
      if (rect.left + dx < this.minX() || rect.right + dx > vw) nx = cur.x;
      if (rect.top + dy < this.minY() || rect.bottom + dy > vh) ny = cur.y;
    }

    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.dragOffset.set({ x: nx, y: ny });
  }

  /** @ignore */
  private endDrag(_event: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.removeDragListeners();
    this.document.body.style.userSelect = '';
    this.onDragEnd.emit();
  }

  /** @ignore */
  private removeDragListeners(): void {
    this.document.removeEventListener('pointermove', this.moveHandler);
    this.document.removeEventListener('pointerup', this.upHandler);
  }

  // --- Resize (bottom-right grip) -------------------------------------

  /** @ignore */
  private resizing = false;
  /** @ignore Pointer + size captured when the resize gesture starts. */
  private resizeStart = { x: 0, y: 0, w: 0, h: 0 };
  /** @ignore */
  private readonly resizeMoveHandler = (e: PointerEvent): void => this.onResize(e);
  /** @ignore */
  private readonly resizeUpHandler = (e: PointerEvent): void => this.endResize(e);

  /** @ignore Start a corner resize (seeds from the current rendered size). */
  protected onResizeStart(event: PointerEvent): void {
    if (!this.showResizeHandle() || event.button !== 0) return;
    // Keep the grip from bubbling to the frame (dismiss) / starting a drag.
    event.preventDefault();
    event.stopPropagation();
    const el = this.dialogRef()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.resizing = true;
    this.resizeStart = { x: event.clientX, y: event.clientY, w: rect.width, h: rect.height };
    this.document.addEventListener('pointermove', this.resizeMoveHandler);
    this.document.addEventListener('pointerup', this.resizeUpHandler);
    this.document.body.style.userSelect = 'none';
  }

  /** @ignore */
  private onResize(event: PointerEvent): void {
    if (!this.resizing) return;
    const view = this.document.defaultView;
    // `|| MAX` (not `??`) so a degenerate 0 viewport never clamps the dialog to nothing.
    const maxW = view?.innerWidth || Number.MAX_SAFE_INTEGER;
    const maxH = view?.innerHeight || Number.MAX_SAFE_INTEGER;
    const w = Math.min(maxW, Math.max(this.minWidth(), this.resizeStart.w + (event.clientX - this.resizeStart.x)));
    const h = Math.min(maxH, Math.max(this.minHeight(), this.resizeStart.h + (event.clientY - this.resizeStart.y)));
    this.resizeSize.set({ w, h });
  }

  /** @ignore */
  private endResize(_event: PointerEvent): void {
    if (!this.resizing) return;
    this.resizing = false;
    this.removeResizeListeners();
    this.document.body.style.userSelect = '';
    const size = this.resizeSize();
    if (size) this.onResizeEnd.emit({ width: size.w, height: size.h });
  }

  /** @ignore */
  private removeResizeListeners(): void {
    this.document.removeEventListener('pointermove', this.resizeMoveHandler);
    this.document.removeEventListener('pointerup', this.resizeUpHandler);
  }

  // --- Internals -------------------------------------------------------

  /** @ignore Release this instance's scroll lock, if held. */
  private releaseLock(): void {
    if (this.locked) {
      unlockBodyScroll(this.document);
      this.locked = false;
    }
  }

  /** @ignore Build the responsive width rules (`max-width` media queries). */
  private applyBreakpoints(bps: Record<string, string> | undefined): void {
    if (!this.isBrowser) return;
    this.removeStyleElement();
    if (!bps || Object.keys(bps).length === 0) return;
    const el = this.document.createElement('style');
    let css = '';
    for (const bp of Object.keys(bps)) {
      css +=
        `@media screen and (max-width: ${bp}) {` +
        ` [data-modal-uid="${this.uid}"]:not(._maximized) { width: ${bps[bp]} !important; } }\n`;
    }
    el.textContent = css;
    this.document.head.appendChild(el);
    this.styleEl = el;
  }

  /** @ignore */
  private removeStyleElement(): void {
    this.styleEl?.remove();
    this.styleEl = null;
  }
}
