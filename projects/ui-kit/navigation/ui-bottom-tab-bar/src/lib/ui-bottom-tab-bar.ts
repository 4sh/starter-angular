import {
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiIcon, UiIconType } from '@4sh/ui-kit/base/ui-icon';
import { UiLevel } from '@4sh/ui-kit/types';

/** Identifier of a bottom tab (matched against the bar `value`). */
export type UiBottomTabValue = string | number;

/** Payload emitted when the active tab changes. */
export interface UiBottomTabBarChangeEvent {
  /** Value of the tab that became active. */
  value: UiBottomTabValue;
  /** Originating DOM event (click / keyboard). */
  originalEvent: Event;
}

/** Focusable controls the bar walks with the arrow keys. */
const CONTROL_SELECTOR = '.ui-bottom-tab, .ui-bottom-tab-action';

/**
 * ui-bottom-tab , a single destination inside a {@link UiBottomTabBar}.
 *
 * Renders a real native `<button>` , or an `<a>` as soon as `href` / `routerLink`
 * is set, so Cmd/Ctrl+click and "open in new tab" keep working. The host is
 * `display: contents`, so the control sits directly inside the bar's `<nav>`.
 *
 * The active state is owned by the bar (`value` comparison) and surfaced to
 * assistive tech as `aria-current="page"`, the pattern for a navigation
 * landmark , not `role="tab"`, which would require an associated tab panel.
 *
 * Declared before {@link UiBottomTabBar} so its `inject()` reference resolves
 * at construction time without a temporal-dead-zone error.
 */
@Component({
  selector: 'ui-bottom-tab',
  imports: [UiIcon, NgTemplateOutlet, RouterLink],
  templateUrl: './ui-bottom-tab.html',
  styleUrl: './ui-bottom-tab.scss',
  host: { class: 'ui-bottom-tab-host' },
})
export class UiBottomTab {
  /** Identifier of this tab (matched against the bar `value`). */
  value = input.required<UiBottomTabValue>();
  /** Visible label under the icon. Omit it for an icon-only tab (then `ariaLabel` names it). */
  label = input<string>();
  /** Icon name in the resting state. */
  icon = input<string>();
  /** Icon name once active (falls back to `icon`). */
  activeIcon = input<string>();
  /**
   * Icon variant in the resting state. Set it to `outline` to get the classic
   * outline → filled swap on activation, `activeIconType` already being `solid`
   * , but check the icon exists in the family's outline set first (FontAwesome
   * Free only ships a handful).
   */
  iconType = input<UiIconType>('solid');
  /** Icon variant once active. */
  activeIconType = input<UiIconType>('solid');
  /** Disable the tab (not activable, skipped by the arrow keys). */
  disabled = input(false, { transform: booleanAttribute });
  /** Accessible name override (mandatory when no label is visible). */
  ariaLabel = input<string>();
  /** Press wave on this tab. `false` opts it out, global activation included. */
  ripple = input(true, { transform: booleanAttribute });

  /** External / plain URL. Presence switches the control to an `<a>`. */
  href = input<string>();
  /** Angular router target. Presence switches the control to an `<a>` (RouterLink). */
  routerLink = input<string | unknown[]>();
  /** Anchor target (e.g. "_blank"). Link mode only. */
  target = input<string>();
  /** Anchor rel. Defaults to "noopener noreferrer" when target="_blank". */
  rel = input<string>();

  /** Fired on activation (click, Enter/Space), even when already active. */
  tabClick = output<MouseEvent>();

  /** @ignore Parent bar (owns the active value + the shared options). */
  protected readonly bar = inject(UiBottomTabBar);

  /** @ignore The native control, for programmatic focus. */
  private readonly controlEl = viewChild.required<ElementRef<HTMLElement>>('control');

  /** @ignore Whether this tab is the active one. */
  readonly active = computed(() => this.bar.isActive(this.value()));

  /** @ignore Label rendered only when provided AND the bar shows labels. */
  protected readonly labelVisible = computed(() => !!this.label() && this.bar.showLabels());

  /** @ignore Icon swapped on activation (filled once selected, outlined otherwise). */
  protected readonly resolvedIcon = computed(() =>
    this.active() ? (this.activeIcon() ?? this.icon()) : this.icon(),
  );

  /** @ignore */
  protected readonly resolvedIconType = computed<UiIconType>(() =>
    this.active() ? this.activeIconType() : this.iconType(),
  );

  /**
   * @ignore Accessible name: explicit, otherwise the hidden label. Left `null`
   * when the label is visible , the control's own text names it.
   */
  protected readonly accessibleLabel = computed(
    () => this.ariaLabel() ?? (this.labelVisible() ? null : (this.label() ?? null)),
  );

  /** @ignore Press wave: opted out on the tab, or on the whole bar. */
  protected readonly rippleOn = computed(() => this.ripple() && this.bar.ripple());

  /** @ignore Control renders an `<a>` (a URL or a router target was provided). */
  protected readonly isLink = computed(() => !!this.href() || this.routerLink() != null);

  /** @ignore */
  protected readonly useRouterLink = computed(() => this.routerLink() != null);

  /** @ignore Anchor rel: explicit, or a safe default for target="_blank". */
  protected readonly computedRel = computed(() => {
    if (this.rel()) return this.rel()!;
    if (this.target() === '_blank') return 'noopener noreferrer';
    return null;
  });

  /** @ignore An `<a>` has no native `disabled`: take it out of the tab order. */
  protected readonly linkTabindex = computed(() => (this.disabled() ? -1 : null));

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-bottom-tab'];
    if (this.active()) c.push('_active');
    if (this.disabled()) c.push('_disabled');
    if (!this.labelVisible()) c.push('_no-label');
    return c.join(' ');
  });

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (!this.labelVisible() && !this.accessibleLabel()) {
          console.warn(
            '[ui-bottom-tab] Tab with no visible label has no accessible name: provide `ariaLabel` (or `label`).',
          );
        }
      });
    }
  }

  /** Move focus to this tab's control. */
  focus(options?: FocusOptions): void {
    this.controlEl().nativeElement.focus(options);
  }

  /** @ignore */
  protected onClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.tabClick.emit(event);
    this.bar.updateValue(this.value(), event);
  }
}

/**
 * ui-bottom-tab-action , the circular action raised above a
 * {@link UiBottomTabBar} (the "float action" slot of the Figma component).
 *
 * A command, not a destination: it never carries the bar's active state. Place
 * it anywhere among the tabs , between the second and the third for the classic
 * centred layout. Always icon-only, so `ariaLabel` is mandatory.
 */
@Component({
  selector: 'ui-bottom-tab-action',
  imports: [UiIcon],
  template: `
    <button
      #control
      type="button"
      [class]="classes()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.data-ripple]="ripple() ? 'on' : 'off'"
      (click)="onClick($event)"
    >
      <ui-icon class="ui-bottom-tab-action-icon" [name]="icon()" size="xl" [type]="iconType()" />
    </button>
  `,
  styleUrl: './ui-bottom-tab-action.scss',
  host: { class: 'ui-bottom-tab-action-host' },
})
export class UiBottomTabAction {
  /** Icon name. */
  icon = input<string>('plus');
  /** Icon variant. */
  iconType = input<UiIconType>('solid');
  /** Colour family, mapped onto the `actions.{level}` tokens. */
  level = input<UiLevel>('high');
  /** Accessible name , mandatory, the button carries no visible text. */
  ariaLabel = input<string>();
  /** Disable the action (native attribute). */
  disabled = input(false, { transform: booleanAttribute });
  /** Press wave on this action. `false` opts it out, global activation included. */
  ripple = input(true, { transform: booleanAttribute });

  /** Fired on click (never when disabled). */
  actionClick = output<MouseEvent>();

  /** @ignore */
  private readonly controlEl = viewChild.required<ElementRef<HTMLButtonElement>>('control');

  /** @ignore */
  protected readonly classes = computed(() =>
    ['ui-bottom-tab-action', `_${this.level()}`].join(' '),
  );

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (!this.ariaLabel()) {
          console.warn(
            '[ui-bottom-tab-action] Icon-only action has no accessible name: provide `ariaLabel`.',
          );
        }
      });
    }
  }

  /** Move focus to the action button. */
  focus(options?: FocusOptions): void {
    this.controlEl().nativeElement.focus(options);
  }

  /** @ignore */
  protected onClick(event: MouseEvent): void {
    if (this.disabled()) return;
    this.actionClick.emit(event);
  }
}

/**
 * ui-bottom-tab-bar , bottom navigation bar for touch devices (mobile, tablet).
 *
 * A `<nav>` landmark pinned to the bottom of the viewport, holding three to five
 * {@link UiBottomTab} destinations and, optionally, a raised
 * {@link UiBottomTabAction}. Every colour and metric comes from the
 * `navigation.*` / `actions.*` design tokens.
 *
 * Built for the constraints of the device it lives on: the bar reserves the
 * system inset (`safeArea`, the iOS home indicator and the Android gesture bar),
 * items never fall under the 44px touch target, the double-tap zoom delay and
 * the native tap flash are off (the kit's ripple owns press feedback), and the
 * bar disappears from print. It positions itself `fixed` , pass `contained` to
 * lay it out inside a positioned ancestor instead (a phone mockup, an embedded
 * shell).
 *
 * @example
 * ```html
 * <ui-bottom-tab-bar [(value)]="route" ariaLabel="Navigation principale">
 *   <ui-bottom-tab value="/home" icon="house" label="Accueil" />
 *   <ui-bottom-tab value="/search" icon="magnifying-glass" label="Recherche" />
 *   <ui-bottom-tab-action ariaLabel="Nouveau message" (actionClick)="compose()" />
 *   <ui-bottom-tab value="/inbox" icon="envelope" label="Messages">
 *     <ui-badge value="3" level="error" />
 *   </ui-bottom-tab>
 *   <ui-bottom-tab value="/settings" icon="gear" label="Réglages" />
 * </ui-bottom-tab-bar>
 * ```
 */
@Component({
  selector: 'ui-bottom-tab-bar',
  template: `
    <nav #nav [class]="classes()" [attr.aria-label]="ariaLabel()">
      <ng-content />
    </nav>
  `,
  styleUrl: './ui-bottom-tab-bar.scss',
  // Keydown is bound on the host, not on the <nav>: the focus lives on the
  // projected controls, and the landmark itself must not become a tab stop.
  host: { '(keydown)': 'onKeydown($event)' },
})
export class UiBottomTabBar {
  /** Value of the active tab (two-way). `undefined` = no active tab. */
  value = model<UiBottomTabValue | undefined>(undefined);
  /** Accessible name of the navigation landmark. */
  ariaLabel = input<string>('Navigation principale');
  /** Show the tabs' labels. `false` renders an icon-only bar. */
  showLabels = input(true, { transform: booleanAttribute });
  /** Reserve the system inset under the bar (iOS home indicator, Android gesture bar). */
  safeArea = input(true, { transform: booleanAttribute });
  /** Lay the bar out inside its positioned ancestor instead of the viewport. */
  contained = input(false, { transform: booleanAttribute });
  /** Press wave on the tabs. `false` cuts it on this bar, global activation included. */
  ripple = input(true, { transform: booleanAttribute });

  /** Fired whenever the active tab changes (click / keyboard). */
  tabChange = output<UiBottomTabBarChangeEvent>();

  /** @ignore The `<nav>` landmark (arrow-key walking happens inside it). */
  private readonly navEl = viewChild.required<ElementRef<HTMLElement>>('nav');

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-bottom-tab-bar'];
    if (this.contained()) c.push('_contained');
    if (!this.safeArea()) c.push('_no-safe-area');
    if (!this.showLabels()) c.push('_no-labels');
    return c.join(' ');
  });

  /** @ignore Whether the given value is the active tab. */
  isActive(value: UiBottomTabValue): boolean {
    return this.value() === value;
  }

  /** @ignore Activate a tab (no-op if already active); emits `tabChange`. */
  updateValue(value: UiBottomTabValue, event: Event): void {
    if (this.value() === value) return;
    this.value.set(value);
    this.tabChange.emit({ value, originalEvent: event });
  }

  /**
   * @ignore Arrow keys / Home / End walk the bar's controls. This is additive:
   * unlike the roving tabindex of the tabs pattern, every control keeps its
   * place in the tab order , which is what a navigation landmark owes its users.
   *
   * The controls are read from the DOM rather than through a content query: the
   * bar mixes two projected component types (tabs and the raised action), and a
   * single query cannot see both.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;

    const controls = Array.from(
      this.navEl().nativeElement.querySelectorAll<HTMLElement>(CONTROL_SELECTOR),
    ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1');
    if (!controls.length) return;

    let pos = controls.indexOf(document.activeElement as HTMLElement);
    if (pos === -1) return; // focus is elsewhere , let the event through.

    event.preventDefault();
    switch (event.key) {
      case 'ArrowRight':
        pos = (pos + 1) % controls.length;
        break;
      case 'ArrowLeft':
        pos = (pos - 1 + controls.length) % controls.length;
        break;
      case 'Home':
        pos = 0;
        break;
      case 'End':
        pos = controls.length - 1;
        break;
    }
    controls[pos].focus();
  }
}
