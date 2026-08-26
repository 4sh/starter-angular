import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiLevel } from '@4sh/ui-kit/types';
import {
  ButtonNativeProps,
  ButtonSize,
  ButtonVariant,
  UiButton,
} from '@4sh/ui-kit/actions/ui-button';
import { UiMenuItem } from '@4sh/ui-kit/navigation/ui-menu';
import { UiTooltip, TooltipPosition } from '@4sh/ui-kit/informative/ui-tooltip';
import { closeOnNavigation } from '@4sh/ui-kit/overlay';
import { UiMotion, UiMotionPreset } from '@4sh/ui-kit/motion';

/** Axis the actions fan out along (linear layout only). */
export type SpeedDialDirection = 'up' | 'down' | 'left' | 'right';

/**
 * `linear` stacks the actions along `direction`; `circle` arranges them on a
 * ring around the trigger (see `radius`).
 */
export type SpeedDialType = 'linear' | 'circle';

/**
 * One action revealed by the dial — the leaf subset of {@link UiMenuItem}
 * `ui-button` can actually render (no groups/separators, and no
 * `queryParams`/`routerLinkActiveExact`: `ui-button`'s link mode does not
 * carry them).
 */
export type UiSpeedDialItem = Pick<
  UiMenuItem,
  'id' | 'label' | 'icon' | 'command' | 'disabled' | 'routerLink' | 'url' | 'target' | 'ariaLabel'
>;

/** Payload of `itemClick` / an item's own `command`. */
export interface UiSpeedDialItemClickEvent {
  originalEvent: Event;
  item: UiSpeedDialItem;
}

/** @ignore Render node: item + its stable key + its index among enabled actions. */
interface UiSpeedDialNode {
  item: UiSpeedDialItem;
  key: string;
  index: number;
}

/** Process-wide unique id source (aria wiring). */
let nextUid = 0;

/** @ignore Rounds away floating point noise CSS `calc()` cannot parse (see `circleTransform`). */
function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/**
 * ui-speed-dial — a floating trigger button that fans a set of actions out
 * around itself.
 *
 * Driven by a declarative `items` list ({@link UiSpeedDialItem}: `command` /
 * `routerLink` / `url`, `icon`, `disabled`) — the same leaf shape as
 * {@link UiMenuItem}, so a menu's entries can feed a dial without reshaping
 * them. Two layouts: `linear` (stacks along `direction`) and `circle`
 * (arranged on a ring, `radius`).
 *
 * Open state is the two-way `visible` model. The action list mounts only
 * while open (`@if`) — closed actions are neither rendered nor reachable by
 * keyboard, so no `aria-hidden`/`inert` bookkeeping is needed. Escape closes
 * and returns focus to the trigger; `hideOnClickOutside` dismisses on an
 * outside click. The actions form **one tab stop** (roving tabindex, same
 * pattern as `ui-menu` / `ui-editor`'s toolbar): arrow keys move between
 * them, `Home`/`End` jump to the ends, disabled entries are skipped.
 *
 * The trigger and every action are `ui-button` instances (`rounded
 * iconOnly`) — colors come from the `actions.*` tokens, nothing is drawn by
 * hand. `mask` dims the page behind the open dial (`--primitives-black-50`,
 * the same token as `ui-modal`'s scrim).
 *
 * Positioning is left to the caller: the component does not assume a fixed
 * corner. Wrap it in a `position: fixed` host (see the MDX "Bouton flottant"
 * recipe) to reproduce the classic floating-action-button placement.
 */
@Component({
  selector: 'ui-speed-dial',
  imports: [UiButton, NgTemplateOutlet, RouterLink, UiTooltip, UiMotion],
  templateUrl: './ui-speed-dial.html',
  styleUrl: './ui-speed-dial.scss',
})
export class UiSpeedDial {
  /** Actions revealed by the dial (see {@link UiSpeedDialItem}). */
  items = input.required<UiSpeedDialItem[]>();
  /** Open state (two-way). */
  visible = model(false);

  /** Layout: `linear` (stacked) or `circle` (ring). */
  type = input<SpeedDialType>('linear');
  /** Axis the actions stack along — `linear` only. */
  direction = input<SpeedDialDirection>('up');
  /** Ring radius in px — `circle` only. Falls back to a size-derived default. */
  radius = input<number>();

  /** Semantic level of the trigger and the actions. */
  level = input<UiLevel>('high');
  /** Apparence of the trigger and the actions. */
  variant = input<ButtonVariant>('filled');
  /** Size of the trigger and the actions. */
  size = input<ButtonSize>('default');

  /** Icon of the trigger while closed. */
  showIcon = input<string>('plus');
  /**
   * Icon of the trigger while open. Left unset, `showIcon` rotates 45° in
   * place instead of being swapped for a second icon.
   */
  hideIcon = input<string>();
  /** Animates the trigger icon's rotation (`hideIcon` unset only). */
  rotateAnimation = input(true, { transform: booleanAttribute });

  /** Dims the page behind the dial while open. */
  mask = input(false, { transform: booleanAttribute });
  /** Closes the dial on an outside click. */
  hideOnClickOutside = input(true, { transform: booleanAttribute });
  /** Disables the trigger and every action. */
  disabled = input(false, { transform: booleanAttribute });

  /** Shows each action's label as a tooltip (icon-only actions). */
  showTooltips = input(false, { transform: booleanAttribute });
  /** Animates the trigger and the actions (reduced-motion always wins). */
  motion = input(true, { transform: booleanAttribute });

  /** Accessible name of the trigger. */
  ariaLabel = input<string>();
  /** id of an external element naming the trigger. */
  ariaLabelledBy = input<string>();
  /** Native tabindex of the trigger. */
  tabindex = input<number>(0, { transform: numberAttribute });

  /** Fired when the trigger is clicked (never when disabled). */
  triggerClick = output<MouseEvent>();
  /** Fired when the dial opens. */
  opened = output<void>();
  /** Fired when the dial closes. */
  closed = output<void>();
  /** Fired when an action is activated (click / keyboard), never when disabled. */
  itemClick = output<UiSpeedDialItemClickEvent>();

  /** @ignore */
  private readonly document = inject(DOCUMENT);
  /** @ignore Host element — outside-click detection. */
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  /** @ignore Trigger button (programmatic focus). */
  private readonly triggerEl = viewChild<UiButton>('trigger');
  /** @ignore Rendered action buttons, in DOM order — the roving tabindex ring.
   *  Matched by their own `#actionBtn` ref so the trigger (`#trigger`) is excluded. */
  private readonly actionEls = viewChildren<UiButton>('actionBtn');

  /** Unique id of the actions list (wired to the trigger's `aria-controls`). */
  readonly uid = `ui-speed-dial-${nextUid++}`;
  /** @ignore Key of the action currently holding the roving tab stop. */
  protected readonly focusedKey = signal<string | null>(null);

  constructor() {
    // A dial declared in an app shell (header, sidebar) outlives the routed
    // view: close it rather than leaving it open over the next page.
    //
    // Deferred one frame (`afterNextRender`, not the constructor directly): a
    // dial that starts open (`[visible]="true"`, e.g. this very Storybook
    // canvas) races the router's OWN initial navigation — that first
    // `NavigationStart` can still fire after this component exists but
    // before `router.url` has settled, which `closeOnNavigation` would then
    // read as "the page changed" and close a dial that never got a chance to
    // be seen open. One frame is enough for that bootstrap navigation to
    // resolve, and `closeOnNavigation`'s own job (dismiss on a LATER, real
    // navigation) is not time-critical to wire up before then.
    afterNextRender(() => closeOnNavigation(() => this.hide()));

    // Outside-click dismissal: attached only while open, torn down on close —
    // a document-wide listener has no reason to exist while nothing is open.
    effect((onCleanup) => {
      if (!this.visible()) return;
      const handler = (event: PointerEvent) => this.onDocumentPointerdown(event);
      this.document.addEventListener('pointerdown', handler, true);
      onCleanup(() => this.document.removeEventListener('pointerdown', handler, true));
    });
  }

  /** @ignore Enabled actions, keyed for the roving tabindex + trigonometry. */
  protected readonly nodes = computed<UiSpeedDialNode[]>(() =>
    this.items().map((item, index) => ({ item, key: item.id ?? `${this.uid}_${index}`, index })),
  );

  /** @ignore Keys of the enabled entries, in order (roving focus path). */
  private readonly focusableKeys = computed<string[]>(() =>
    this.nodes()
      .filter((n) => !n.item.disabled)
      .map((n) => n.key),
  );

  /** @ignore Node owning the tab stop: last focused, else the first enabled one. */
  protected readonly tabStopKey = computed<string | null>(() => {
    const keys = this.focusableKeys();
    const focused = this.focusedKey();
    return focused && keys.includes(focused) ? focused : (keys[0] ?? null);
  });

  /**
   * @ignore Explicit ring radius, in px — set as the `--_radius` override.
   * Left unset (`null`, no inline style), the SCSS default takes over.
   */
  protected readonly radiusOverride = computed(() => {
    const r = this.radius();
    return r != null ? `${r}px` : null;
  });

  /**
   * @ignore Per-item ring position (`circle` only): even angular steps from
   * the top, self-centred on the trigger, `--_radius` out from there (see
   * `radiusOverride` for the explicit/default split).
   */
  protected readonly circleTransform = computed(() => {
    const total = this.nodes().length;
    if (this.type() !== 'circle' || !total) return () => null;
    return (index: number) => {
      const angle = (index / total) * 2 * Math.PI;
      // Floating point noise (e.g. sin(π) ≈ 1.2e-16) prints as exponential
      // notation, which CSS `calc()` cannot parse — round it away.
      const x = round(Math.sin(angle));
      const y = round(-Math.cos(angle));
      return `translate(-50%, -50%) translate(calc(${x} * var(--_radius)), calc(${y} * var(--_radius)))`;
    };
  });

  /**
   * @ignore Enter/leave preset.
   *
   * `circle` items already carry their own `[style.transform]` (angular
   * position on the ring, `circleTransform`) — `zoom`/`slide-*` animate
   * `transform` too, and a CSS animation on a property wins over an inline
   * style for it, wiping the position out for the animation's duration.
   * `fade` (opacity only) is the one preset that cannot collide with it.
   *
   * `linear` items carry no such transform, so they get the more expressive
   * `slide-${direction}` — "enter moving toward `direction`".
   */
  protected readonly itemMotionPreset = computed<UiMotionPreset>(() =>
    this.type() === 'circle' ? 'fade' : (`slide-${this.direction()}` as UiMotionPreset),
  );

  /** @ignore Trigger icon while open: `hideIcon`, or `showIcon` rotated in place. */
  protected readonly triggerIcon = computed(() => this.hideIcon() ?? this.showIcon());
  /** @ignore The trigger icon rotates only when there is no dedicated `hideIcon`. */
  protected readonly triggerIconRotates = computed(
    () => this.visible() && !this.hideIcon() && this.rotateAnimation(),
  );

  /** @ignore Tooltip side: opposite the fan-out direction, so it never overlaps an action. */
  protected readonly tooltipPosition = computed<TooltipPosition>(() => {
    const d = this.direction();
    if (this.type() === 'circle') return 'top';
    if (d === 'up') return 'right';
    if (d === 'down') return 'right';
    if (d === 'left') return 'top';
    return 'top';
  });

  /**
   * @ignore Attributes forwarded onto the trigger's real `<button>`/`<a>`
   * (`ui-button`'s `#host`, not the `<ui-speed-dial>` wrapper): `role`,
   * `ariaLabel` and `tabindex` already have dedicated `ui-button` inputs, the
   * rest goes through `buttonProps` (see `ui-button`'s own forwarding).
   */
  protected readonly triggerProps = computed<ButtonNativeProps>(() => ({
    'aria-haspopup': 'true',
    'aria-expanded': this.visible() ? 'true' : 'false',
    'aria-controls': this.uid,
    'aria-labelledby': this.ariaLabelledBy() ?? null,
  }));

  /** @ignore Static: every action is a `menuitem`, whatever it renders as (button/link). */
  protected readonly itemProps: ButtonNativeProps = { role: 'menuitem' };

  /** @ignore */
  protected readonly hostClasses = computed(() => {
    const c = ['ui-speed-dial', `_${this.type()}`];
    if (this.type() === 'linear') c.push(`_${this.direction()}`);
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.visible()) c.push('_open');
    return c.join(' ');
  });

  /** Opens the dial. */
  show(): void {
    if (this.disabled() || this.visible()) return;
    this.visible.set(true);
    this.opened.emit();
  }

  /** Closes the dial. */
  hide(focusTrigger = false): void {
    if (!this.visible()) return;
    this.visible.set(false);
    this.focusedKey.set(null);
    this.closed.emit();
    if (focusTrigger) this.triggerEl()?.focus();
  }

  /** Toggles the dial open/closed. */
  toggle(): void {
    this.visible() ? this.hide() : this.show();
  }

  /** Moves focus onto the trigger. */
  focus(options?: FocusOptions): void {
    this.triggerEl()?.focus(options);
  }

  /** @ignore */
  protected onTriggerClick(event: MouseEvent): void {
    if (this.disabled()) return;
    this.triggerClick.emit(event);
    this.toggle();
  }

  /** @ignore Arrow key on the (closed) trigger opens the dial onto its first action. */
  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.visible()) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    this.show();
    this.queueFocusTabStop();
  }

  /** @ignore Activation: command + itemClick, then close (never on a disabled entry). */
  protected onItemClick(event: Event, node: UiSpeedDialNode): void {
    const item = node.item;
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    if (!item.url && !item.routerLink) event.preventDefault();
    this.focusedKey.set(node.key);
    item.command?.({ originalEvent: event, item });
    this.itemClick.emit({ originalEvent: event, item });
    this.hide(true);
  }

  /**
   * @ignore Roving keyboard navigation among the open actions.
   *
   * Both arrow pairs move the same way regardless of `direction`/`type`: it
   * keeps the mapping simple and predictable rather than re-deriving which
   * pair means "forward" for eight possible linear/circular layouts.
   */
  protected onListKeydown(event: KeyboardEvent): void {
    const keys = this.focusableKeys();
    if (!keys.length) return;
    const current = this.focusedKey();
    const index = current ? keys.indexOf(current) : -1;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        event.preventDefault();
        this.focusByKey(keys[(index + 1) % keys.length]);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        event.preventDefault();
        this.focusByKey(keys[(index - 1 + keys.length) % keys.length]);
        break;
      case 'Home':
        event.preventDefault();
        this.focusByKey(keys[0]);
        break;
      case 'End':
        event.preventDefault();
        this.focusByKey(keys[keys.length - 1]);
        break;
      case 'Escape':
        event.preventDefault();
        this.hide(true);
        break;
    }
  }

  /** @ignore */
  protected onEntryFocus(key: string): void {
    this.focusedKey.set(key);
  }

  /** @ignore Outside pointerdown closes the dial (mousedown mirrors ui-menu's own outside-click). */
  protected onDocumentPointerdown(event: PointerEvent): void {
    if (!this.visible() || !this.hideOnClickOutside()) return;
    if (event.target instanceof Node && this.hostEl.nativeElement.contains(event.target)) return;
    this.hide();
  }

  /** @ignore Clicking the mask itself closes the dial. */
  protected onMaskClick(): void {
    this.hide();
  }

  /** @ignore */
  private focusByKey(key: string | undefined): void {
    if (!key) return;
    this.focusedKey.set(key);
    const target = this.nodes().find((n) => n.key === key);
    if (!target) return;
    this.actionEls()[target.index]?.focus();
  }

  /** @ignore Focus the roving tab stop once the actions are rendered (macrotask: rAF
   *  never fires in throttled/background tabs). */
  private queueFocusTabStop(): void {
    setTimeout(() => this.focusByKey(this.tabStopKey() ?? undefined));
  }
}
