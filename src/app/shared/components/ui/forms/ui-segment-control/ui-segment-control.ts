import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  forwardRef,
  inject,
  input,
  isDevMode,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '@app/core/controlValueAccessor/BaseControlValueAccessor';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

export type SegmentControlSize = 'default' | 'small';
export type SegmentControlOrientation = 'horizontal' | 'vertical';

/** Selected value: a single value (single mode) or an array (`multiple`). */
export type SegmentControlValue<T = unknown> = T | T[] | null;

/**
 * Rich option shape. Options may also be primitives (`string`/`number`) or any
 * object, in which case the `optionLabel` / `optionValue` / `optionDisabled` /
 * `optionIcon` field names tell the control how to read them.
 */
export interface SegmentControlOption<T = unknown> {
  /** Text shown inside the segment. */
  label?: string;
  /** Value carried into the model when the segment is selected. */
  value: T;
  /** Leading icon name (design-system icon). */
  icon?: string;
  /** Disables just this segment. */
  disabled?: boolean;
  /** Accessible name (required for an icon-only segment). */
  ariaLabel?: string;
}

/** Payload emitted when a segment is clicked. */
export interface SegmentControlOptionClickEvent<T = unknown> {
  /** The original option (as passed in `options`). */
  option: T;
  /** The resolved value of that option. */
  value: T;
  /** Index of the option in the list. */
  index: number;
  /** Originating DOM event. */
  originalEvent: Event;
}

/** Context handed to a custom item template. */
export interface SegmentControlItemContext<T = unknown> {
  /** The original option (default `$implicit`). */
  $implicit: T;
  /** Same as `$implicit`, named for readability. */
  option: T;
  /** Whether this segment is currently selected. */
  selected: boolean;
  /** Index of the option in the list. */
  index: number;
}

/** @ignore Internal, normalized view of an option (template + logic source). */
interface NormalizedSegment {
  key: string;
  index: number;
  value: unknown;
  label: string | null;
  icon: string | null;
  ariaLabel: string | null;
  disabled: boolean;
  selected: boolean;
  original: unknown;
}

/** @ignore Measured geometry of the sliding selection indicator. */
interface ThumbMetrics {
  x: number;
  y: number;
  w: number;
  h: number;
}

let nextUid = 0;

/**
 * ui-segment-control — headless segmented control for choosing one (or, with
 * `multiple`, several) value(s) from a short list of inline buttons.
 *
 * Each segment is a real native `<button>`; the group carries WAI-ARIA semantics
 * (`radiogroup`/`radio` in single mode with roving arrow-key navigation and
 * select-on-arrow, `group`/`aria-pressed` in `multiple` mode) so keyboard and
 * screen-reader support come for free. Interactive states (hover/focus/pressed/
 * disabled) are pure CSS driven by the `actions.*` design tokens.
 *
 * In single mode a sliding indicator glides under the selected segment, timed by
 * the shared motion system (honours reduced-motion and the `motion` opt-out).
 *
 * Works standalone, with `[(ngModel)]`, reactive forms, or signal forms
 * (`[field]`) — it is a `ControlValueAccessor`.
 *
 * @example
 * ```html
 * <ui-segment-control [(ngModel)]="view" [options]="['Liste', 'Grille']" />
 * ```
 */
@Component({
  selector: 'ui-segment-control',
  imports: [UiIcon, NgTemplateOutlet],
  templateUrl: './ui-segment-control.html',
  styleUrl: './ui-segment-control.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSegmentControl), multi: true },
  ],
  host: {
    class: 'ui-segment-control',
    '[class._small]': "size() === 'small'",
    '[class._vertical]': "orientation() === 'vertical'",
    '[class._fluid]': 'fluid()',
    '[class._multiple]': 'multiple()',
    '[class._disabled]': 'isDisabled()',
    '[class._invalid]': 'isInvalid()',
    '[class._no-motion]': '!motion()',
    '[attr.role]': "multiple() ? 'group' : 'radiogroup'",
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'ariaLabelledBy() || null',
    '[attr.aria-invalid]': "isInvalid() ? 'true' : null",
    '[attr.aria-disabled]': "isDisabled() ? 'true' : null",
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiSegmentControl<T = unknown> extends BaseControlValueAccessor<SegmentControlValue<T>> {
  /** Options to display, one button each. Primitives, objects, or `SegmentControlOption`. */
  options = input<readonly (T | SegmentControlOption<T>)[]>([]);
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
  /** Allow selecting several values at once (the model becomes an array). */
  multiple = input(false, { transform: booleanAttribute });
  /** Whether the selection can be fully cleared (single) / emptied (multiple). */
  allowEmpty = input(true, { transform: booleanAttribute });
  /** Size. */
  size = input<SegmentControlSize>('default');
  /** Layout axis (drives which arrow keys navigate). */
  orientation = input<SegmentControlOrientation>('horizontal');
  /** Span the full width of the parent (segments share the width evenly). */
  fluid = input(false, { transform: booleanAttribute });
  /** Animate the sliding indicator (honours reduced-motion regardless). */
  motion = input(true, { transform: booleanAttribute });
  /** Accessible name for the group (required when there is no visible label). */
  ariaLabel = input<string>();
  /** id of an external element that labels the group. */
  ariaLabelledBy = input<string>();
  /** Disables the whole control. */
  disabled = input(false, { transform: booleanAttribute });
  /** Focusable but not editable. */
  readonly = input(false, { transform: booleanAttribute });
  /** Forces the error styling (automatic when the attached control is invalid and touched/dirty). */
  invalid = input(false, { transform: booleanAttribute });
  /** Custom template for a segment's content (receives `{ $implicit, option, selected, index }`). */
  itemTemplate = input<TemplateRef<SegmentControlItemContext<T>>>();

  /** Emitted on user selection with the new model value. */
  selectionChange = output<SegmentControlValue<T>>();
  /** Emitted when a segment is clicked (even if it does not change the value). */
  optionClick = output<SegmentControlOptionClickEvent<T>>();

  /** @ignore */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** @ignore */
  private readonly hostDestroyRef = inject(DestroyRef);
  /** @ignore Native segment buttons (for roving focus + indicator measurement). */
  private readonly optionEls = viewChildren<ElementRef<HTMLButtonElement>>('optionBtn');
  /** @ignore Current model value (written by the form or by user selection). */
  private readonly modelValue = signal<SegmentControlValue<T>>(null);
  /** @ignore Index the roving focus last landed on. */
  private readonly focusedIndex = signal(0);
  /** @ignore Measured geometry of the sliding indicator (null until first measure). */
  protected readonly thumb = signal<ThumbMetrics | null>(null);
  /** @ignore Bumped by the ResizeObserver to re-measure the indicator. */
  private readonly resizeTick = signal(0);
  /** @ignore */
  private readonly uid = `ui-segment-control-${nextUid++}`;

  constructor() {
    super();

    // Re-measure the sliding indicator whenever the observed geometry changes.
    afterNextRender(() => {
      const ro = new ResizeObserver(() => this.resizeTick.update((v) => v + 1));
      ro.observe(this.host.nativeElement);
      this.hostDestroyRef.onDestroy(() => ro.disconnect());
    });

    // Track the selected segment with the indicator (single mode only).
    afterRenderEffect(() => {
      const index = this.selectedIndex();
      this.resizeTick();
      // Track layout-affecting inputs so the indicator follows re-layouts.
      this.size();
      this.orientation();
      this.fluid();
      this.normalizedOptions();

      if (this.multiple() || index === -1) return;
      const el = this.optionEls()[index]?.nativeElement;
      const track = this.host.nativeElement;
      if (!el) return;

      const next: ThumbMetrics = {
        x: el.offsetLeft - track.clientLeft,
        y: el.offsetTop - track.clientTop,
        w: el.offsetWidth,
        h: el.offsetHeight,
      };
      const cur = untracked(this.thumb);
      if (!cur || cur.x !== next.x || cur.y !== next.y || cur.w !== next.w || cur.h !== next.h) {
        this.thumb.set(next);
      }
    });

    // A11y safeguards (dev only).
    if (isDevMode()) {
      effect(() => {
        if (!this.ariaLabel() && !this.ariaLabelledBy()) {
          console.warn(
            '[ui-segment-control] Groupe sans nom accessible : renseignez `ariaLabel` (ou `ariaLabelledBy`).',
          );
        }
        const iconOnly = this.normalizedOptions().some((o) => o.icon && !o.label && !o.ariaLabel);
        if (iconOnly) {
          console.warn(
            '[ui-segment-control] Segment icon-only sans nom accessible : ajoutez `ariaLabel` sur l’option.',
          );
        }
      });
    }
  }

  /** @ignore Input disabled OR control disabled (form API). */
  protected readonly isDisabled = computed(() => this.disabled() || this.controlDisabled());
  /** @ignore Explicit `invalid` input OR invalid control worth surfacing. */
  protected readonly isInvalid = computed(() => this.invalid() || this.showError());
  /** @ignore Icon size derived from the control size. */
  protected readonly iconSize = computed(() => (this.size() === 'small' ? 'sm' : 'default'));

  /** @ignore Options resolved to a flat, render-ready shape. */
  protected readonly normalizedOptions = computed<NormalizedSegment[]>(() => {
    const raw = this.options() ?? [];
    const model = this.modelValue();
    const groupDisabled = this.isDisabled();
    return raw.map((option, index) => {
      const value = this.resolveValue(option);
      const label = this.resolveLabel(option);
      return {
        key: `${this.uid}-${index}`,
        index,
        value,
        label,
        icon: this.resolveIcon(option),
        ariaLabel: this.resolveAriaLabel(option),
        disabled: groupDisabled || this.resolveDisabled(option),
        selected: this.isValueSelected(value, model),
        original: option,
      };
    });
  });

  /** @ignore Index of the selected segment in single mode (-1 if none / multiple). */
  protected readonly selectedIndex = computed(() =>
    this.multiple() ? -1 : this.normalizedOptions().findIndex((o) => o.selected),
  );

  /** @ignore Whether the sliding indicator should render. */
  protected readonly showThumb = computed(
    () => !this.multiple() && this.selectedIndex() !== -1 && this.thumb() !== null,
  );

  /** @ignore CSS transform positioning the indicator over the selected segment. */
  protected readonly thumbTransform = computed(() => {
    const t = this.thumb();
    return t ? `translate(${t.x}px, ${t.y}px)` : null;
  });

  /** @ignore Segment that owns the group's single tab stop (roving tabindex). */
  protected readonly rovingIndex = computed(() => {
    const opts = this.normalizedOptions();
    if (!opts.length) return -1;
    if (!this.multiple()) {
      const selected = opts.findIndex((o) => o.selected && !o.disabled);
      if (selected !== -1) return selected;
    }
    const focused = this.focusedIndex();
    if (opts[focused] && !opts[focused].disabled) return focused;
    return opts.findIndex((o) => !o.disabled);
  });

  writeValue(value: SegmentControlValue<T>): void {
    this.modelValue.set(value);
  }

  /** Move focus to the group's current tab stop. */
  focus(options?: FocusOptions): void {
    const index = this.rovingIndex();
    if (index !== -1) this.optionEls()[index]?.nativeElement.focus(options);
  }

  /** @ignore The tabindex for a given segment (roving: one 0, the rest -1). */
  protected tabindexFor(index: number): number {
    return index === this.rovingIndex() ? 0 : -1;
  }

  /** @ignore Select (or toggle / clear) a segment on user interaction. */
  protected select(option: NormalizedSegment, event: Event): void {
    if (option.disabled || this.readonly()) return;
    const value = option.value as T;

    let next: SegmentControlValue<T>;
    if (this.multiple()) {
      const current = Array.isArray(this.modelValue()) ? [...(this.modelValue() as T[])] : [];
      const at = current.findIndex((v) => this.equals(v, value));
      if (at !== -1) {
        if (!this.allowEmpty() && current.length === 1) return; // keep at least one
        current.splice(at, 1);
      } else {
        current.push(value);
      }
      next = current;
    } else {
      if (option.selected) {
        if (!this.allowEmpty()) return; // cannot clear the selection
        next = null;
      } else {
        next = value;
      }
    }

    this.focusedIndex.set(option.index);
    this.modelValue.set(next);
    this.emitChange(next);
    this.selectionChange.emit(next);
    this.optionClick.emit({ option: option.original as T, value, index: option.index, originalEvent: event });
  }

  /** @ignore */
  protected onOptionFocus(index: number): void {
    this.focusedIndex.set(index);
  }

  /** @ignore Roving focus (and select-on-arrow in single mode). */
  protected onKeydown(event: KeyboardEvent): void {
    const horizontal = this.orientation() === 'horizontal';
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
    if (![nextKey, prevKey, 'Home', 'End'].includes(event.key)) return;

    const opts = this.normalizedOptions();
    const enabled = opts.filter((o) => !o.disabled);
    if (!enabled.length) return;

    event.preventDefault();
    let pos = enabled.findIndex((o) => o.index === this.focusedIndex());
    if (pos === -1) pos = 0;

    switch (event.key) {
      case nextKey: pos = (pos + 1) % enabled.length; break;
      case prevKey: pos = (pos - 1 + enabled.length) % enabled.length; break;
      case 'Home': pos = 0; break;
      case 'End': pos = enabled.length - 1; break;
    }

    const target = enabled[pos];
    this.focusedIndex.set(target.index);
    this.optionEls()[target.index]?.nativeElement.focus();
    // Single mode follows the radio pattern: arrows move AND select.
    if (!this.multiple()) this.select(target, event);
  }

  /** @ignore Mark touched when focus leaves the whole group. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) this.emitTouch();
  }

  // --- Option resolution -------------------------------------------------

  /** @ignore */
  private isObject(option: unknown): option is Record<string, unknown> {
    return typeof option === 'object' && option !== null;
  }

  /** @ignore */
  private resolveValue(option: unknown): unknown {
    const field = this.optionValue();
    if (field && this.isObject(option)) return option[field];
    if (this.isObject(option) && 'value' in option) return option['value'];
    return option;
  }

  /** @ignore */
  private resolveLabel(option: unknown): string | null {
    const field = this.optionLabel();
    if (field && this.isObject(option)) return this.asText(option[field]);
    if (this.isObject(option)) return 'label' in option ? this.asText(option['label']) : null;
    return this.asText(option);
  }

  /** @ignore */
  private resolveIcon(option: unknown): string | null {
    const field = this.optionIcon();
    if (field && this.isObject(option)) return this.asText(option[field]);
    if (this.isObject(option) && 'icon' in option) return this.asText(option['icon']);
    return null;
  }

  /** @ignore */
  private resolveAriaLabel(option: unknown): string | null {
    if (this.isObject(option) && 'ariaLabel' in option) return this.asText(option['ariaLabel']);
    return null;
  }

  /** @ignore */
  private resolveDisabled(option: unknown): boolean {
    const field = this.optionDisabled();
    if (field && this.isObject(option)) return !!option[field];
    if (this.isObject(option) && 'disabled' in option) return !!option['disabled'];
    return false;
  }

  /** @ignore */
  private asText(value: unknown): string | null {
    return value === null || value === undefined ? null : String(value);
  }

  /** @ignore Whether a resolved value is part of the current model. */
  private isValueSelected(value: unknown, model: SegmentControlValue<T>): boolean {
    if (this.multiple()) {
      return Array.isArray(model) && model.some((v) => this.equals(v, value));
    }
    return this.equals(model, value);
  }

  /** @ignore Value equality — by `dataKey` for objects, strict otherwise. */
  private equals(a: unknown, b: unknown): boolean {
    const key = this.dataKey();
    if (key && this.isObject(a) && this.isObject(b)) return a[key] === b[key];
    return a === b;
  }
}
