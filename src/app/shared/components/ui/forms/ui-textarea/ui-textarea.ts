import {
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField } from '@app/shared/components/ui/forms/base-form-field';
import { UiField } from '@app/shared/components/ui/forms/ui-field/ui-field';

/** Which axes the user can manually resize (ignored when `autoResize` is on). */
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

/**
 * ui-textarea — headless multiline text field, built on the `ui-field` shell
 * (label + box + helper) in **multiline** mode + a native `<textarea>`.
 *
 * The native `<textarea>` provides the resize grip (`resize: vertical`, the
 * Figma "resizer" affordance). `autoResize` grows the box with the content and
 * disables the manual grip.
 *
 * Standalone, `[(ngModel)]` or reactive forms (ControlValueAccessor via BaseFormField).
 */
@Component({
  selector: 'ui-textarea',
  imports: [UiField],
  templateUrl: './ui-textarea.html',
  styleUrl: './ui-textarea.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiTextarea), multi: true }],
})
export class UiTextarea extends BaseFormField<string> {
  /** Native placeholder. */
  placeholder = input<string>();
  /** Initial number of visible text rows. */
  rows = input<number>(3);
  /** Native maxlength (caps the character count). */
  maxlength = input<number>();
  /** Grows the box height with the content (disables the manual resize grip). */
  autoResize = input(false, { transform: booleanAttribute });
  /** Manual resize axis (`vertical` by default; ignored when `autoResize`). */
  resize = input<TextareaResize>('vertical');
  /** Shows a character counter under the field (`count` or `count / maxlength`). */
  showCount = input(false, { transform: booleanAttribute });

  /** Emitted on each input with the new value. */
  valueChange = output<string>();
  /** Emitted when the textarea receives focus. */
  textareaFocus = output<FocusEvent>();
  /** Emitted when the textarea loses focus. */
  textareaBlur = output<FocusEvent>();

  /** @ignore */
  private readonly textareaEl = viewChild<ElementRef<HTMLTextAreaElement>>('textareaEl');

  /** @ignore Effective resize axis (`none` while auto-resizing). */
  protected readonly effectiveResize = computed<TextareaResize>(() => (this.autoResize() ? 'none' : this.resize()));
  /** @ignore Current character count. */
  protected readonly charCount = computed(() => (this.modelValue() ?? '').length);
  /** @ignore Over the maxlength (only reachable programmatically). */
  protected readonly overLimit = computed(() => {
    const max = this.maxlength();
    return max != null && this.charCount() > max;
  });

  constructor() {
    super();
    // Keep the height in sync when the value changes programmatically (forms).
    effect(() => {
      this.modelValue();
      if (this.autoResize()) this.resizeToContent();
    });
  }

  /** Focuses the textarea. */
  focus(options?: FocusOptions): void {
    this.textareaEl()?.nativeElement.focus(options);
  }

  /** @ignore Input: single source of the value (view → form). */
  protected onInput(): void {
    const el = this.textareaEl()?.nativeElement;
    if (!el) return;
    const value = el.value;
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);
    if (this.autoResize()) this.resizeToContent();
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.textareaBlur.emit(event);
  }

  /** @ignore Recomputes the height to fit the content. */
  private resizeToContent(): void {
    const el = this.textareaEl()?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
}
