import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  isDevMode,
  numberAttribute,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '@app/core/controlValueAccessor/BaseControlValueAccessor';

/** Size of the OTP cells. `default` is the base. */
export type InputOtpSize = 'small' | 'default' | 'large';

/** DOM event handlers handed to a custom `#input` cell template. */
export interface InputOtpCellEvents {
  /** Wire on `(input)`. */
  input: (event: Event) => void;
  /** Wire on `(keydown)`. */
  keydown: (event: KeyboardEvent) => void;
  /** Wire on `(focus)`. */
  focus: (event: FocusEvent) => void;
  /** Wire on `(blur)`. */
  blur: (event: FocusEvent) => void;
  /** Wire on `(paste)`. */
  paste: (event: ClipboardEvent) => void;
}

/** Context handed to the `#input` template (one per cell). */
export interface InputOtpCellContext {
  /** Current value of this cell (default `$implicit`). */
  $implicit: string;
  /** Same as `$implicit`, named for readability. */
  value: string;
  /** Zero-based index of the cell. */
  index: number;
  /** Event handlers to bind on the custom control (keeps the OTP behaviour). */
  events: InputOtpCellEvents;
  /** Roving tabindex for this cell (`0` for the active one, `-1` otherwise). */
  tabindex: number;
}

let nextUid = 0;

/**
 * ui-input-otp — headless one-time-password field: a row of single-character
 * cells backing a single string value.
 *
 * Each cell is a real native `<input maxlength="1">`; the group carries
 * `role="group"` and a **roving tabindex** so `Tab` enters/leaves the field as a
 * whole while `←`/`→` move between cells (`Retour arrière` clears and steps
 * back). Typing auto-advances, and pasting a code distributes it across the
 * cells. Interactive states (hover/focus/disabled) are pure CSS driven by the
 * `form.*` design tokens.
 *
 * - `mask` hides the characters (`type="password"`).
 * - `integerOnly` restricts input to digits (`inputmode="numeric"`).
 * - a `#input` template replaces the default cell with your own control (it
 *   receives the value, index, roving tabindex and the event handlers to bind).
 *
 * Works standalone, with `[(ngModel)]`, reactive forms, or signal forms
 * (`[field]`, Angular 22) — it is a `ControlValueAccessor` (interop handled by
 * `BaseControlValueAccessor`).
 *
 * @example
 * ```html
 * <ui-input-otp [(ngModel)]="code" [length]="6" [integerOnly]="true" ariaLabel="Code de vérification" />
 * ```
 */
@Component({
  selector: 'ui-input-otp',
  imports: [NgTemplateOutlet],
  templateUrl: './ui-input-otp.html',
  styleUrl: './ui-input-otp.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputOtp), multi: true }],
  host: {
    class: 'ui-input-otp',
    role: 'group',
    '[class._small]': "size() === 'small'",
    '[class._large]': "size() === 'large'",
    '[class._disabled]': 'isDisabled()',
    '[class._readonly]': 'readonly()',
    '[class._invalid]': 'isInvalid()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'ariaLabelledBy() || null',
    '[attr.aria-invalid]': "isInvalid() ? 'true' : null",
    '[attr.aria-disabled]': "isDisabled() ? 'true' : null",
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiInputOtp extends BaseControlValueAccessor<string> {
  /** Number of cells (characters) to enter. */
  length = input(4, { transform: numberAttribute });
  /** Hide the characters (renders `type="password"`). */
  mask = input(false, { transform: booleanAttribute });
  /** Restrict input to integers (`inputmode="numeric"`, non-digits rejected). */
  integerOnly = input(false, { transform: booleanAttribute });
  /** Cell size. */
  size = input<InputOtpSize>('default');
  /** Accessible name for the group (required — no visible label). */
  ariaLabel = input<string>();
  /** id of an external element that labels the group. */
  ariaLabelledBy = input<string>();
  /** name forwarded to the native inputs. */
  name = input<string>();
  /** Focus the first cell on init. */
  autofocus = input(false, { transform: booleanAttribute });
  /** Disables the whole control (native attribute on every cell). */
  disabled = input(false, { transform: booleanAttribute });
  /** Read-only cells (focusable, not editable). */
  readonly = input(false, { transform: booleanAttribute });
  /** Forces the error styling (automatic when the attached control is invalid and touched/dirty). */
  invalid = input(false, { transform: booleanAttribute });

  /** Emitted with the joined value on every change. */
  valueChange = output<string>();
  /** Emitted with the value once every cell is filled. */
  completed = output<string>();

  /** Custom cell template (`<ng-template #input let-value let-i="index" let-events="events">`). */
  protected readonly inputTemplate = contentChild<TemplateRef<InputOtpCellContext>>('input');

  /** @ignore */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** @ignore Per-cell characters (source of truth for the view). */
  private readonly tokens = signal<string[]>([]);
  /** @ignore Cell that owns the group's single tab stop (roving tabindex). */
  private readonly focusedIndex = signal(0);
  /** @ignore */
  private readonly uid = `ui-input-otp-${nextUid++}`;

  constructor() {
    super();

    // Optional autofocus on the first cell after the view exists.
    afterNextRender(() => {
      if (this.autofocus() && !this.isDisabled()) this.focusCell(0);
    });

    // A11y safeguard (dev only): the group needs an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (!this.ariaLabel() && !this.ariaLabelledBy()) {
          console.warn(
            '[ui-input-otp] Groupe sans nom accessible : renseignez `ariaLabel` (ou `ariaLabelledBy`).',
          );
        }
      });
    }
  }

  /** @ignore Input disabled OR control disabled (form API). */
  protected readonly isDisabled = computed(() => this.disabled() || this.controlDisabled());
  /** @ignore Explicit `invalid` input OR invalid control worth surfacing. */
  protected readonly isInvalid = computed(() => this.invalid() || this.showError());
  /** @ignore Native input type (masked → password). */
  protected readonly inputType = computed(() => (this.mask() ? 'password' : 'text'));
  /** @ignore Hint for the on-screen keyboard. */
  protected readonly inputMode = computed(() => (this.integerOnly() ? 'numeric' : 'text'));

  /** @ignore Render-ready list of cells (index + current value). */
  protected readonly cells = computed(() => {
    const tokens = this.tokens();
    return Array.from({ length: Math.max(0, this.length()) }, (_, index) => ({
      index,
      id: `${this.uid}-${index}`,
      value: tokens[index] ?? '',
    }));
  });

  writeValue(value: string | number | null): void {
    this.tokens.set(this.toTokens(value));
  }

  /** Move focus to the first cell. */
  focus(options?: FocusOptions): void {
    this.focusCell(0, options);
  }

  /** @ignore Roving tabindex for a given cell (one `0`, the rest `-1`). */
  protected tabindexFor(index: number): number {
    const active = Math.min(this.focusedIndex(), this.length() - 1);
    return index === Math.max(0, active) ? 0 : -1;
  }

  /** @ignore Value shown in a cell. */
  protected cellValue(index: number): string {
    return this.tokens()[index] ?? '';
  }

  /** @ignore Handlers exposed to a custom `#input` template. */
  protected cellEvents(index: number): InputOtpCellEvents {
    return {
      input: (event: Event) => this.onInput(event, index),
      keydown: (event: KeyboardEvent) => this.onKeydown(event, index),
      focus: (event: FocusEvent) => this.onFocus(event, index),
      blur: () => {
        /* touched is emitted on group focusout */
      },
      paste: (event: ClipboardEvent) => this.onPaste(event, index),
    };
  }

  /** @ignore Cell input: single source of the per-cell value (view → form). */
  protected onInput(event: Event, index: number): void {
    if (this.readonly()) return;
    const target = event.target as HTMLInputElement;
    const raw = this.sanitize(target.value);

    // Multi-char (autofill / paste into a cell) → distribute across cells.
    if (raw.length > 1) {
      this.setFromIndex(index, raw);
      return;
    }

    const tokens = [...this.tokens()];
    tokens[index] = raw;
    target.value = raw; // reflect the sanitised value
    this.commit(tokens);

    const inputType = (event as InputEvent).inputType;
    if (raw) this.focusCell(index + 1);
    else if (inputType === 'deleteContentBackward') this.focusCell(index - 1);
  }

  /** @ignore Keyboard navigation + input guards. */
  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLInputElement;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.focusCell(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.focusCell(index + 1);
        return;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        return;
      case 'Backspace':
        // Empty cell → clear + step back (a filled cell clears via native input).
        if (!target.value && !this.readonly()) {
          event.preventDefault();
          const tokens = [...this.tokens()];
          if (tokens[index - 1] !== undefined) tokens[index - 1] = '';
          this.commit(tokens);
          this.focusCell(index - 1);
        }
        return;
      default: {
        if (event.key.length !== 1) return; // let control keys through
        // Reject non-digits when integer-only.
        if (this.integerOnly() && !/^\d$/.test(event.key)) event.preventDefault();
      }
    }
  }

  /** @ignore Select the cell content on focus + track the roving index. */
  protected onFocus(event: FocusEvent, index: number): void {
    this.focusedIndex.set(index);
    (event.target as HTMLInputElement).select?.();
  }

  /** @ignore Distribute a pasted code across the cells from `index`. */
  protected onPaste(event: ClipboardEvent, index: number): void {
    if (this.isDisabled() || this.readonly()) return;
    event.preventDefault();
    const pasted = this.sanitize(event.clipboardData?.getData('text') ?? '');
    if (pasted) this.setFromIndex(index, pasted);
  }

  /** @ignore Mark touched when focus leaves the whole group. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) this.emitTouch();
  }

  /** @ignore Write `chars` into the cells starting at `from`, then commit + focus. */
  private setFromIndex(from: number, chars: string): void {
    const tokens = [...this.tokens()];
    const max = this.length();
    let i = from;
    for (const ch of chars) {
      if (i >= max) break;
      tokens[i++] = ch;
    }
    this.commit(tokens);
    this.focusCell(Math.min(i, max - 1));
  }

  /** @ignore Persist the tokens, emit the joined value (+ `completed` when full). */
  private commit(tokens: string[]): void {
    const trimmed = tokens.slice(0, this.length());
    this.tokens.set(trimmed);
    const value = trimmed.join('');
    this.emitChange(value);
    this.valueChange.emit(value);
    if (value.length === this.length() && trimmed.every((c) => c !== '')) {
      this.completed.emit(value);
    }
  }

  /** @ignore Focus (and select) the cell at `index`, if it exists. */
  private focusCell(index: number, options?: FocusOptions): void {
    if (index < 0 || index >= this.length()) return;
    this.focusedIndex.set(index);
    const el = this.host.nativeElement.querySelectorAll<HTMLInputElement>('input')[index];
    if (el) {
      el.focus(options);
      el.select();
    }
  }

  /** @ignore Split a form value into an array of single characters (bounded). */
  private toTokens(value: string | number | null | undefined): string[] {
    if (value === null || value === undefined || value === '') return [];
    return String(value).split('').slice(0, this.length());
  }

  /** @ignore Drop non-digits when integer-only, otherwise pass through. */
  private sanitize(value: string): string {
    return this.integerOnly() ? value.replace(/\D/g, '') : value;
  }
}
