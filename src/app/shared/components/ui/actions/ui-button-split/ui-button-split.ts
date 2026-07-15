import { booleanAttribute, Component, computed, input, output, signal, viewChild } from '@angular/core';
import { UiLevel } from '@app/shared/types/ui-level';
import {
  ButtonIconPos,
  ButtonNativeProps,
  ButtonSize,
  UiButton,
} from '@app/shared/components/ui/actions/ui-button/ui-button';
import {
  MenuSize,
  UiMenu,
  UiMenuItem,
  UiMenuItemCommandEvent,
} from '@app/shared/components/ui/navigation/ui-menu/ui-menu';

/** Size of the split button — forwarded to both inner buttons and the menu. */
export type ButtonSplitSize = ButtonSize;

/**
 * ui-button-split — a default action button glued to a dropdown trigger that
 * reveals a collection of additional options.
 *
 * The main button fires the default action (`buttonClick`); the caret trigger
 * toggles a {@link UiMenu} popup fed by the declarative `model`
 * ({@link UiMenuItem}: leaves with `command` / `routerLink` / `url`, nested
 * submenus, separators, icons…). Colors come from the `actions.*` tokens (via
 * the composed `ui-button`), the panel from the `navigation.*` tokens (via
 * `ui-menu`).
 *
 * The two buttons can be disabled independently: `buttonDisabled` for the
 * action, `menuButtonDisabled` for the trigger, or `disabled` for both.
 */
@Component({
  selector: 'ui-button-split',
  imports: [UiButton, UiMenu],
  templateUrl: './ui-button-split.html',
  styleUrl: './ui-button-split.scss',
})
export class UiButtonSplit {
  /** Additional options revealed by the dropdown (see {@link UiMenuItem}). */
  model = input<UiMenuItem[]>([]);
  /** Label of the default action button. */
  label = input<string>();
  /** Leading/trailing FontAwesome icon of the action button. */
  icon = input<string>();
  /** Position of the action button icon relative to its label. */
  iconPos = input<ButtonIconPos>('left');
  /** Icon of the dropdown trigger (the caret). */
  dropdownIcon = input<string>('chevron-down');
  /** Semantic level applied to both buttons. */
  level = input<UiLevel>('high');
  /** Size of the whole control (buttons + menu density). */
  size = input<ButtonSplitSize>('default');

  /** Disable both the action and the dropdown trigger. */
  disabled = input(false, { transform: booleanAttribute });
  /** Disable only the default action button. */
  buttonDisabled = input(false, { transform: booleanAttribute });
  /** Disable only the dropdown trigger button. */
  menuButtonDisabled = input(false, { transform: booleanAttribute });

  /** Accessible name of the action button (required when it is icon-only). */
  ariaLabel = input<string>();
  /** Accessible name of the dropdown trigger (icon-only button). */
  menuButtonAriaLabel = input<string>("Plus d'options");
  /** Accessible name of the options list. */
  menuAriaLabel = input<string>();
  /** Color family of the menu panel: `high` (default) or `low`. */
  menuLevel = input<'high' | 'low'>('high');
  /** Extra class(es) applied to the menu panel (scoped custom styling). */
  menuStyleClass = input<string>();
  /** Auto-flip the popup above the trigger when space is lacking below. */
  autoFlip = input(true, { transform: booleanAttribute });
  /** Animate the popup entrance (reduced-motion always wins). */
  motion = input(true, { transform: booleanAttribute });
  /** Native tabindex of the action button. */
  tabindex = input<number>();
  /** Extra native attributes forwarded onto the action `<button>`. */
  buttonProps = input<ButtonNativeProps>();

  /** Fired when the default action button is clicked (never when disabled). */
  buttonClick = output<MouseEvent>();
  /** Fired when the dropdown trigger is clicked (never when disabled). */
  dropdownClick = output<MouseEvent>();
  /** Fired when the options popup opens. */
  menuShow = output<void>();
  /** Fired when the options popup closes. */
  menuHide = output<void>();
  /** Fired when an option is activated (click / keyboard). */
  itemClick = output<UiMenuItemCommandEvent>();

  /** @ignore Action button (programmatic focus). */
  private readonly actionButton = viewChild<UiButton>('action');
  /** @ignore Embedded options menu (programmatic close). */
  private readonly menu = viewChild<UiMenu>('menu');

  /** @ignore Popup open state (drives the trigger's `aria-expanded`). */
  protected readonly menuOpen = signal(false);

  /** @ignore Menu density mirrors the control size. */
  protected readonly menuSize = computed<MenuSize>(() => this.size());
  /** @ignore The action button is disabled by its own flag or the global one. */
  protected readonly actionDisabled = computed(() => this.disabled() || this.buttonDisabled());
  /** @ignore The trigger is disabled by its own flag or the global one. */
  protected readonly triggerDisabled = computed(() => this.disabled() || this.menuButtonDisabled());

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-button-split', `_${this.level()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    return c.join(' ');
  });

  /** Sets focus on the default action button. */
  focus(options?: FocusOptions): void {
    this.actionButton()?.focus(options);
  }

  /** Closes the options popup. */
  hide(): void {
    this.menu()?.hide();
  }

  /** @ignore */
  protected onButtonClick(event: MouseEvent): void {
    this.buttonClick.emit(event);
  }

  /** @ignore Trigger click: re-emit, then toggle the popup anchored to it. */
  protected onDropdownClick(event: MouseEvent): void {
    this.dropdownClick.emit(event);
    this.menu()?.toggle(event);
  }
}
