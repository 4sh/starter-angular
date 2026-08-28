import {
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  isDevMode,
  output,
  TemplateRef,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  BaseFieldControl,
  createOptionResolver,
  warnMissingAccessibleName,
} from '@4sh/ui-kit/forms';
import { UiIcon, UiIconSize } from '@4sh/ui-kit/base/ui-icon';
import { UiLevel } from '@4sh/ui-kit/types';

export type ToggleButtonSize = 'default' | 'small' | 'large';
/** Habillage de l'état **non** sélectionné (l'état sélectionné est toujours plein). */
export type ToggleButtonVariant = 'outlined' | 'filled' | 'ghost';
export type ToggleButtonIconPos = 'left' | 'right';
export type ToggleButtonOrientation = 'horizontal' | 'vertical';

/** Model value: one of the `trueValue`/`falseValue` pair (single), or the array of pressed option values (group). */
export type ToggleButtonValue<T> = T | T[] | null;

/**
 * Rich option shape for the group mode. Options may also be primitives
 * (`string`/`number`) or any object, in which case `optionLabel` /
 * `optionValue` / `optionDisabled` / `optionIcon` tell the control how to read
 * them.
 */
export interface ToggleButtonOption<T = unknown> {
  /** Text shown inside the button. */
  label?: string;
  /** Value carried into the model when the button is pressed. */
  value: T;
  /** Icon name (design-system icon). */
  icon?: string;
  /** Icon substituted while the button is pressed. */
  selectedIcon?: string;
  /** Disables just this button. */
  disabled?: boolean;
  /** Accessible name (required for an icon-only button). */
  ariaLabel?: string;
}

/** Context handed to the `icon` / `content` templates (single mode). */
export interface ToggleButtonStateContext {
  /** Whether the button is currently pressed (default `$implicit`). */
  $implicit: boolean;
  /** Same as `$implicit`, named for readability. */
  checked: boolean;
}

/** Context handed to the `item` template (group mode). */
export interface ToggleButtonItemContext<T = unknown> {
  /** The original option (default `$implicit`). */
  $implicit: T;
  /** Same as `$implicit`, named for readability. */
  option: T;
  /** Whether this button is currently pressed. */
  selected: boolean;
  /** Index of the option in the list. */
  index: number;
}

/** Payload emitted when a group button is clicked. */
export interface ToggleButtonOptionClickEvent<T = unknown> {
  /** The original option (as passed in `options`). */
  option: T;
  /** The resolved value of that option. */
  value: T;
  /** Index of the option in the list. */
  index: number;
  /** Pressed state after the click. */
  selected: boolean;
  /** Originating DOM event. */
  originalEvent: Event;
}

/** @ignore Internal, normalized view of a group option. */
interface NormalizedToggle {
  key: string;
  index: number;
  value: unknown;
  label: string | null;
  icon: string | null;
  ariaLabel: string | null;
  disabled: boolean;
  selected: boolean;
  iconOnly: boolean;
  original: unknown;
}

/** @ignore */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * ui-toggle-button — a button that holds a pressed state.
 *
 * Two modes, one component:
 * - **single** (default): one native `<button aria-pressed>` backing a boolean
 *   (or the `trueValue`/`falseValue` pair). Labels and icons may differ per
 *   state (`onLabel`/`offLabel`, `onIcon`/`offIcon`).
 * - **group** (`options` set): one button per option, `role="group"` on the
 *   host, model = the array of pressed values. Deliberately always
 *   multi-select: an exclusive choice is `ui-segment-control`'s job, which says
 *   it with `radiogroup` semantics instead of `aria-pressed`.
 *
 * `level` colours the pressed state, `variant` draws the released one, both
 * from the `actions.*` token sets. Interactive states (hover/focus/pressed/
 * disabled) are pure CSS.
 *
 * Works standalone, with `[(ngModel)]`, reactive forms, or signal forms
 * (`[formField]`) — it is a `ControlValueAccessor`.
 *
 * @example
 * ```html
 * <ui-toggle-button [(ngModel)]="bold" label="Gras" icon="bold" />
 * <ui-toggle-button [(ngModel)]="days" [options]="dayOptions" ariaLabel="Jours ouvrés" />
 * ```
 */
@Component({
  selector: 'ui-toggle-button',
  imports: [UiIcon, NgTemplateOutlet],
  templateUrl: './ui-toggle-button.html',
  styleUrl: './ui-toggle-button.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiToggleButton), multi: true },
  ],
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': "isGroup() ? 'group' : null",
    '[attr.aria-label]': 'groupAriaLabel()',
    '[attr.aria-labelledby]': 'groupAriaLabelledBy()',
  },
})
export class UiToggleButton<T = boolean> extends BaseFieldControl<ToggleButtonValue<T>> {
  // --- Single mode ------------------------------------------------------
  /** Label shown in both states (fallback of `onLabel` / `offLabel`). */
  label = input<string>();
  /** Label shown while pressed. */
  onLabel = input<string>();
  /** Label shown while released. */
  offLabel = input<string>();
  /** Icon shown in both states (fallback of `onIcon` / `offIcon`). */
  icon = input<string>();
  /** Icon shown while pressed. */
  onIcon = input<string>();
  /** Icon shown while released. */
  offIcon = input<string>();
  /** Side of the label the icon sits on. */
  iconPos = input<ToggleButtonIconPos>('left');
  /** Model value emitted when pressed. */
  trueValue = input<T>(true as T);
  /** Model value emitted when released. */
  falseValue = input<T>(false as T);

  // --- Group mode -------------------------------------------------------
  /** Options to display, one button each. Presence switches the host to group mode. */
  options = input<readonly (T | ToggleButtonOption<T>)[]>();
  /** Field name to read a label from, when options are objects. */
  optionLabel = input<string>();
  /** Field name to read the value from, when options are objects. */
  optionValue = input<string>();
  /** Field name to read the disabled flag from, when options are objects. */
  optionDisabled = input<string>();
  /** Field name to read an icon name from, when options are objects. */
  optionIcon = input<string>();
  /** Property used to compare object values for equality (selection matching). */
  dataKey = input<string>();
  /** Layout axis of the group. */
  orientation = input<ToggleButtonOrientation>('horizontal');

  // --- Shared -----------------------------------------------------------
  /** Colour family of the pressed state. */
  level = input<UiLevel>('high');
  /** How the released state is drawn. */
  variant = input<ToggleButtonVariant>('outlined');
  /** Size. */
  size = input<ToggleButtonSize>('default');
  /** Span the full width of the parent (group buttons share the width evenly). */
  fluid = input(false, { transform: booleanAttribute });
  /** Ripple Effect */
  ripple = input(true, { transform: booleanAttribute });
  /** Pill shape. */
  rounded = input(false, { transform: booleanAttribute });
  /** Whether the last pressed button can be released (single), or the group emptied. */
  allowEmpty = input(true, { transform: booleanAttribute });

  // --- Templates --------------------------------------------------------
  /** Replaces the icon, single mode (receives `{ $implicit, checked }`). */
  iconTemplate = input<TemplateRef<ToggleButtonStateContext>>();
  /** Replaces the whole button content, single mode (receives `{ $implicit, checked }`). */
  contentTemplate = input<TemplateRef<ToggleButtonStateContext>>();
  /** Replaces a group button's content (receives `{ $implicit, option, selected, index }`). */
  itemTemplate = input<TemplateRef<ToggleButtonItemContext<T>>>();

  /** Emitted on user interaction with the new model value. */
  toggleChange = output<ToggleButtonValue<T>>();
  /** Emitted when a group button is clicked (even if it does not change the value). */
  optionClick = output<ToggleButtonOptionClickEvent<T>>();
  /** Emitted when a button receives focus. */
  toggleFocus = output<FocusEvent>();
  /** Emitted when a button loses focus. */
  toggleBlur = output<FocusEvent>();

  /** @ignore */
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('itemEl');

  /** @ignore */
  private readonly resolver = createOptionResolver({
    optionValue: this.optionValue,
    optionLabel: this.optionLabel,
    optionDisabled: this.optionDisabled,
    dataKey: this.dataKey,
  });

  constructor() {
    super();

    if (isDevMode()) {
      effect(() => {
        if (this.isGroup()) {
          if (!this.ariaLabel() && !this.ariaLabelledBy()) {
            warnMissingAccessibleName(
              'ui-toggle-button',
              'Group has no accessible name: provide `ariaLabel` (or `ariaLabelledBy`).',
            );
          }
          if (this.normalizedOptions().some((o) => o.iconOnly && !o.ariaLabel)) {
            warnMissingAccessibleName(
              'ui-toggle-button',
              'Icon-only option has no accessible name: add `ariaLabel` on the option.',
            );
          }
          return;
        }
        if (this.isIconOnly() && !this.ariaLabel()) {
          warnMissingAccessibleName(
            'ui-toggle-button',
            'Icon-only button has no accessible name: provide `ariaLabel`.',
          );
        }
        // A name that changes with the state is re-announced on focus, so the
        // control sounds like a different button depending on its value.
        if (this.hasStateLabels() && !this.ariaLabel() && !this.ariaLabelledBy()) {
          warnMissingAccessibleName(
            'ui-toggle-button',
            '`onLabel`/`offLabel` differ: provide a state-independent `ariaLabel` (or `ariaLabelledBy`).',
          );
        }
      });
    }
  }

  /** @ignore Group mode: an `options` list was provided. */
  protected readonly isGroup = computed(() => !!this.options());

  /** @ignore */
  protected readonly iconSize = computed<UiIconSize>(() => {
    const size = this.size();
    if (size === 'small') return 'sm';
    return size === 'large' ? 'lg' : 'default';
  });

  /** @ignore */
  protected readonly hostClasses = computed(() => {
    const c = ['ui-toggle-button', `_${this.level()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.variant() !== 'outlined') c.push(`_${this.variant()}`);
    if (this.rounded()) c.push('_rounded');
    if (this.fluid()) c.push('_fluid');
    if (this.isGroup()) {
      c.push('_group');
      if (this.orientation() === 'vertical') c.push('_vertical');
    }
    if (this.readonly()) c.push('_readonly');
    if (this.isDisabled()) c.push('_disabled');
    if (this.isInvalid()) c.push('_invalid');
    return c.join(' ');
  });

  /** @ignore Only the group carries the group-level ARIA naming. */
  protected readonly groupAriaLabel = computed(() =>
    this.isGroup() ? this.ariaLabel() || null : null,
  );
  /** @ignore */
  protected readonly groupAriaLabelledBy = computed(() =>
    this.isGroup() ? this.ariaLabelledBy() || null : null,
  );

  // --- Single mode ------------------------------------------------------

  /** @ignore */
  protected readonly checked = computed(() => this.modelValue() === this.trueValue());
  /** @ignore */
  protected readonly hasStateLabels = computed(
    () => !!this.onLabel() && !!this.offLabel() && this.onLabel() !== this.offLabel(),
  );
  /** @ignore Label of the current state, falling back to the shared one. */
  protected readonly currentLabel = computed(
    () => (this.checked() ? this.onLabel() : this.offLabel()) ?? this.label() ?? null,
  );
  /** @ignore Icon of the current state, falling back to the shared one. */
  protected readonly currentIcon = computed(
    () => (this.checked() ? this.onIcon() : this.offIcon()) ?? this.icon() ?? null,
  );
  /** @ignore Square button: an icon, no text. */
  protected readonly isIconOnly = computed(
    () => !this.contentTemplate() && !this.currentLabel() && !!this.currentIcon(),
  );
  /** @ignore */
  protected readonly iconBefore = computed(() => this.iconPos() === 'left');
  /** @ignore */
  protected readonly stateContext = computed<ToggleButtonStateContext>(() => ({
    $implicit: this.checked(),
    checked: this.checked(),
  }));
  /** @ignore Accessible name of the single button (never empty-stringed). */
  protected readonly buttonAriaLabel = computed(
    () => this.ariaLabel() || (this.isIconOnly() ? this.currentLabel() : null),
  );

  // --- Group mode -------------------------------------------------------

  /** @ignore Options resolved to a flat, render-ready shape. */
  protected readonly normalizedOptions = computed<NormalizedToggle[]>(() => {
    const raw = this.options() ?? [];
    const model = this.modelValue();
    const groupDisabled = this.isDisabled();
    return raw.map((option, index) => {
      const value = this.resolveValue(option);
      const selected = this.isPressed(value, model);
      const label = this.resolveLabel(option);
      const icon = this.resolveIcon(option, selected);
      return {
        key: `${this.uid}-${index}`,
        index,
        value,
        label,
        icon,
        ariaLabel: isRecord(option) ? this.resolver.asText(option['ariaLabel']) : null,
        disabled: groupDisabled || this.resolver.resolveDisabled(option),
        selected,
        iconOnly: !label && !!icon,
        original: option,
      };
    });
  });

  /** @ignore */
  protected itemContext(item: NormalizedToggle): ToggleButtonItemContext<T> {
    return {
      $implicit: item.original as T,
      option: item.original as T,
      selected: item.selected,
      index: item.index,
    };
  }

  /** @ignore */
  protected override uidPrefix(): string {
    return 'ui-toggle-button';
  }

  /** Focus the button (the first enabled one in group mode). */
  focus(options?: FocusOptions): void {
    const target = this.buttons().find((ref) => !ref.nativeElement.disabled);
    target?.nativeElement.focus(options);
  }

  /** @ignore Single mode: flip the boolean pair. */
  protected toggle(): void {
    if (this.isDisabled() || this.readonly()) return;
    if (this.checked() && !this.allowEmpty()) return;

    const next = this.checked() ? this.falseValue() : this.trueValue();
    this.modelValue.set(next);
    this.emitChange(next);
    this.toggleChange.emit(next);
  }

  /** @ignore Group mode: press / release one option. */
  protected toggleOption(item: NormalizedToggle, event: Event): void {
    if (item.disabled || this.readonly()) return;
    const value = item.value as T;
    const model = this.modelValue();
    const next = Array.isArray(model) ? [...(model as T[])] : [];
    const at = next.findIndex((v) => this.resolver.equals(v, value));
    let selected: boolean;

    if (at !== -1) {
      if (!this.allowEmpty() && next.length === 1) return;
      next.splice(at, 1);
      selected = false;
    } else {
      next.push(value);
      selected = true;
    }

    this.modelValue.set(next);
    this.emitChange(next);
    this.toggleChange.emit(next);
    this.optionClick.emit({
      option: item.original as T,
      value,
      index: item.index,
      selected,
      originalEvent: event,
    });
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.toggleBlur.emit(event);
  }

  /** @ignore Rich option shape (`{ value }`) resolves without a field mapping. */
  private resolveValue(option: unknown): unknown {
    if (!this.optionValue() && isRecord(option) && 'value' in option) return option['value'];
    return this.resolver.resolveValue(option);
  }

  /** @ignore An option object with no label key stays label-less (icon-only button). */
  private resolveLabel(option: unknown): string | null {
    if (!this.optionLabel() && isRecord(option) && !('label' in option)) return null;
    return this.resolver.resolveLabel(option);
  }

  /** @ignore */
  private resolveIcon(option: unknown, selected: boolean): string | null {
    if (selected && isRecord(option)) {
      const swapped = this.resolver.asText(option['selectedIcon']);
      if (swapped) return swapped;
    }
    const field = this.optionIcon();
    if (field) return this.resolver.asText(this.resolver.getField(option, field));
    if (isRecord(option)) return this.resolver.asText(option['icon']);
    return null;
  }

  /** @ignore A group's model is the array of pressed values. */
  private isPressed(value: unknown, model: ToggleButtonValue<T> | undefined): boolean {
    return Array.isArray(model) && model.some((v) => this.resolver.equals(v, value));
  }
}
