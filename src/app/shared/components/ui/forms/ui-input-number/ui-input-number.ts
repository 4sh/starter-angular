import {
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField } from '@app/shared/components/ui/forms/base-form-field';
import { UiField } from '@app/shared/components/ui/forms/ui-field/ui-field';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

/**
 * ui-input-number — headless numeric field (`ui-field` shell).
 *
 * Model value = `number | null`. Lenient input: the text is **not** reformatted
 * while typing (no caret jump) — the field shows an editable form on focus, and
 * the **rich format** (thousands grouping, currency, decimals via
 * `Intl.NumberFormat`) is applied **on blur**. `min`/`max`/`step`, ± spinner,
 * ↑/↓ arrow keys, clamp on blur.
 *
 * Formatting is driven by `locale`/`currency`/`useGrouping`/`*FractionDigits`;
 * for a very specific case, override the protected `format()` method.
 */
@Component({
  selector: 'ui-input-number',
  imports: [UiField, UiIcon],
  templateUrl: './ui-input-number.html',
  styleUrl: './ui-input-number.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputNumber), multi: true },
  ],
})
export class UiInputNumber extends BaseFormField<number> {
  /** Native placeholder. */
  placeholder = input<string>();
  /** Minimum value (clamp on blur + disables "−" at the bound). */
  min = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Maximum value (clamp on blur + disables "+" at the bound). */
  max = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Increment step (spinner + arrow keys). */
  step = input<number, unknown>(1, { transform: numberAttribute });
  /** Allow decimals. */
  allowDecimals = input(true, { transform: booleanAttribute });
  /** Suffix unit (e.g. "kg"). Ignored when `currency` is set. */
  unit = input<string>();
  /** Show the ± spinner. */
  showButtons = input(true, { transform: booleanAttribute });

  // --- Formatting (Intl.NumberFormat) --------------------------------
  /** BCP-47 locale (e.g. `fr-FR`). Defaults to the browser locale. */
  locale = input<string>();
  /** ISO currency code (e.g. `EUR`) → currency formatting on blur. */
  currency = input<string>();
  /** Thousands separators on blur. */
  useGrouping = input(true, { transform: booleanAttribute });
  /** Minimum fraction digits shown on blur. */
  minFractionDigits = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Maximum fraction digits shown on blur. */
  maxFractionDigits = input<number, unknown>(undefined, { transform: numberAttribute });

  /** Emitted on each numeric value change. */
  valueChange = output<number | null>();
  /** Emitted when the input receives focus. */
  inputFocus = output<FocusEvent>();
  /** Emitted when the input loses focus. */
  inputBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  /** @ignore Raw displayed text (independent from the model while typing). */
  protected readonly text = signal('');

  /** @ignore */
  protected readonly unitSmall = computed(() => this.size() === 'small');
  /** @ignore Bounds reached (disable the spinner buttons). */
  protected readonly atMax = computed(() => {
    const v = this.modelValue();
    const max = this.max();
    return v != null && max != null && v >= max;
  });
  protected readonly atMin = computed(() => {
    const v = this.modelValue();
    const min = this.min();
    return v != null && min != null && v <= min;
  });

  /** @ignore Group/decimal separators of the current locale. */
  private readonly separators = computed(() => {
    const parts = new Intl.NumberFormat(this.locale()).formatToParts(11111.1);
    return {
      group: parts.find((p) => p.type === 'group')?.value ?? '',
      decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    };
  });

  override writeValue(value: number | null): void {
    this.modelValue.set(value ?? undefined);
    this.text.set(value === null || value === undefined ? '' : this.format(value));
  }

  /** Focuses the input. */
  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  /** @ignore Focus: switch to an editable form (no grouping/currency). */
  protected onFocus(event: FocusEvent): void {
    const v = this.modelValue();
    if (v != null) this.text.set(this.editable(v));
    this.inputFocus.emit(event);
  }

  /** @ignore Input: parse without reformatting the text (caret preserved). */
  protected onInput(): void {
    const raw = this.inputEl().nativeElement.value;
    this.text.set(raw);
    this.commit(this.parse(raw), { reformat: false });
  }

  /** @ignore Blur: clamp + rich reformatting. */
  protected onBlur(event: FocusEvent): void {
    this.commit(this.clamp(this.modelValue() ?? null), { reformat: true });
    this.emitTouch();
    this.inputBlur.emit(event);
  }

  /** @ignore ↑/↓ arrow keys. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.stepBy(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.stepBy(-1);
    }
  }

  /** @ignore ± spinner. */
  protected stepBy(direction: 1 | -1): void {
    if (this.isDisabled() || this.readonly()) return;
    const base = this.modelValue() ?? 0;
    const next = this.clamp(base + direction * this.step());
    this.commit(next, { reformat: !this.isFocused() });
    if (this.isFocused()) this.text.set(next === null ? '' : this.editable(next));
    this.inputEl().nativeElement.focus();
  }

  /** @ignore Does the input currently have focus? */
  private isFocused(): boolean {
    return typeof document !== 'undefined' && document.activeElement === this.inputEl().nativeElement;
  }

  /** @ignore Update model + emit; reformat the text when requested. */
  private commit(value: number | null, opts: { reformat: boolean }): void {
    this.modelValue.set(value ?? undefined);
    if (opts.reformat) this.text.set(value === null ? '' : this.format(value));
    this.emitChange(value as number);
    this.valueChange.emit(value);
  }

  /** @ignore Parse a lenient (locale-aware) input → number or null. */
  private parse(raw: string): number | null {
    const { group, decimal } = this.separators();
    let s = raw.trim();
    if (group) s = s.split(group).join('');
    s = s
      .replace(/\s/g, '') // spaces (incl. U+202F/U+00A0 grouping separators)
      .replace(decimal, '.')
      .replace(/[^0-9.\-]/g, ''); // strip currency/symbols
    if (s === '' || s === '-' || s === '.' || s === '-.') return null;
    const n = Number(s);
    if (Number.isNaN(n)) return null;
    return this.allowDecimals() ? n : Math.trunc(n);
  }

  /** @ignore Clamp the value into [min, max]. */
  private clamp(value: number | null): number | null {
    if (value === null) return null;
    const min = this.min();
    const max = this.max();
    let v = value;
    if (min != null && v < min) v = min;
    if (max != null && v > max) v = max;
    return v;
  }

  /** @ignore Editable form on focus: locale decimals, no grouping or currency. */
  private editable(value: number): string {
    return new Intl.NumberFormat(this.locale(), {
      useGrouping: false,
      maximumFractionDigits: 20,
    }).format(value);
  }

  /**
   * Display formatting on blur (overridable). Defaults to `Intl.NumberFormat`
   * with `locale`/`currency`/`useGrouping`/`*FractionDigits`.
   */
  protected format(value: number): string {
    const options: Intl.NumberFormatOptions = { useGrouping: this.useGrouping() };
    if (this.currency()) {
      options.style = 'currency';
      options.currency = this.currency();
    }
    if (this.minFractionDigits() != null) options.minimumFractionDigits = this.minFractionDigits();
    if (this.maxFractionDigits() != null) options.maximumFractionDigits = this.maxFractionDigits();
    return new Intl.NumberFormat(this.locale(), options).format(value);
  }
}
