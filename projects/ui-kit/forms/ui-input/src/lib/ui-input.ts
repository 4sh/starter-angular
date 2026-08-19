import {
  Component,
  computed,
  contentChild,
  ElementRef,
  forwardRef,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField } from '@4sh/ui-kit/forms';
import { UiField } from '@4sh/ui-kit/forms/ui-field';
import { UiIcon, UiIconSize } from '@4sh/ui-kit/base/ui-icon';

/** Supported text types (numeric has its dedicated `ui-input-number` component). */
export type InputType = 'text' | 'password' | 'email' | 'tel' | 'url' | 'search';

/** Context handed to the `#iconLeft` / `#iconRight` templates. */
export interface UiInputIconContext {
  /** Icon name configured on that side (`iconLeft` / `iconRight`), if any. */
  $implicit: string | undefined;
  /** Icon size matching the field size. */
  size: UiIconSize;
  /** Whether the field is disabled. */
  disabled: boolean;
}

/**
 * ui-input — headless composed text field, built on the `ui-field` shell
 * (label + box + helper) + a native `<input>`.
 *
 * Covers all text types (text/email/tel/url/search/**password**). Password
 * reveal, search clearing, etc. are handled via the **right action zone**
 * (`iconRightAriaLabel` + `iconRightClick`).
 *
 * Both icon zones accept a `<ng-template #iconLeft>` / `#iconRight` to replace the
 * rendered markup (another icon family, an inline SVG, a brand logo). To retarget
 * the family of every icon at once — this field's and the ones its neighbours
 * render internally — use the `uiIconFamily` directive instead.
 *
 * Standalone, `[(ngModel)]` or reactive forms (ControlValueAccessor via BaseFormField).
 * For numbers → `ui-input-number`, for masks → `ui-input-mask`.
 */
@Component({
  selector: 'ui-input',
  imports: [UiField, UiIcon, NgTemplateOutlet],
  templateUrl: './ui-input.html',
  styleUrl: './ui-input.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInput), multi: true }],
})
export class UiInput extends BaseFormField<string> {
  /** Native input type. */
  type = input<InputType>('text');
  /**
   * Display-only value (bypasses the CVA model). For composite hosts
   * (e.g. `ui-datepicker`) that own the visible text and read it back via
   * `valueChange` — leave unset when using `[(ngModel)]`/reactive forms.
   */
  value = input<string>();
  /** `aria-haspopup` forwarded to the native input (popup trigger hosts). */
  ariaHasPopup = input<'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'>();
  /** `aria-expanded` forwarded to the native input (popup trigger hosts). */
  ariaExpanded = input<boolean>();
  /** `aria-controls` forwarded to the native input (popup trigger hosts). */
  ariaControls = input<string>();
  /** Native placeholder. */
  placeholder = input<string>();
  /** Suffix unit (e.g. "%", "@domain"). Shown when provided. */
  unit = input<string>();
  /** Left FontAwesome icon name (decorative). */
  iconLeft = input<string>();
  /** Right FontAwesome icon name. */
  iconRight = input<string>();
  /**
   * Accessible name of the right icon. **When provided, the right icon becomes a
   * clickable action zone** (square, full-height button) that emits `iconRightClick`.
   */
  iconRightAriaLabel = input<string>();
  /** Native autocomplete. */
  autocomplete = input<string>();
  /** Native maxlength. */
  maxlength = input<number>();

  /** Left-icon template, provided programmatically (composite hosts like `ui-datepicker`). */
  iconLeftTemplate = input<TemplateRef<UiInputIconContext>>();
  /** Right-icon template, provided programmatically (composite hosts like `ui-datepicker`). */
  iconRightTemplate = input<TemplateRef<UiInputIconContext>>();

  /** Custom left icon: `<ng-template #iconLeft let-name let-size="size">`. */
  private readonly iconLeftTemplateContent =
    contentChild<TemplateRef<UiInputIconContext>>('iconLeft');
  /** Custom right icon: `<ng-template #iconRight let-name let-size="size">`. */
  private readonly iconRightTemplateContent =
    contentChild<TemplateRef<UiInputIconContext>>('iconRight');

  /** Emitted on each input with the new value. */
  valueChange = output<string>();
  /** Emitted on click of the right action zone (active when `iconRightAriaLabel` is set). */
  iconRightClick = output<MouseEvent>();
  /** Emitted when the input receives focus. */
  inputFocus = output<FocusEvent>();
  /** Emitted when the input loses focus. */
  inputBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  /** @ignore Icon size aligned with the field size. */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));
  /** @ignore Input wins over the projected `#iconLeft` template. */
  protected readonly resolvedIconLeftTemplate = computed(
    () => this.iconLeftTemplate() ?? this.iconLeftTemplateContent(),
  );
  /** @ignore Input wins over the projected `#iconRight` template. */
  protected readonly resolvedIconRightTemplate = computed(
    () => this.iconRightTemplate() ?? this.iconRightTemplateContent(),
  );
  /** @ignore */
  protected readonly leftIconContext = computed<UiInputIconContext>(() => ({
    $implicit: this.iconLeft(),
    size: this.iconSize(),
    disabled: this.isDisabled(),
  }));
  /** @ignore */
  protected readonly rightIconContext = computed<UiInputIconContext>(() => ({
    $implicit: this.iconRight(),
    size: this.iconSize(),
    disabled: this.isDisabled(),
  }));
  /** @ignore The right icon is an action zone (has an accessible name). */
  protected readonly hasRightAction = computed(
    () => (!!this.iconRight() || !!this.resolvedIconRightTemplate()) && !!this.iconRightAriaLabel(),
  );

  /** Focuses the input. */
  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  /** Native `<input>` element — composite hosts that own `value` (e.g. `ui-datepicker`)
   *  need direct DOM access to control the caret while reformatting text as typed. */
  nativeInputElement(): HTMLInputElement {
    return this.inputEl().nativeElement;
  }

  /** @ignore Input: single source of the value (view → form). */
  protected onInput(): void {
    const value = this.inputEl().nativeElement.value;
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.inputBlur.emit(event);
  }
}
