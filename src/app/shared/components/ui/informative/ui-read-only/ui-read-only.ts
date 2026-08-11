import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  input,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiLabel } from '@4sh/ui-kit/ui-label';

export type ReadOnlySize = 'default' | 'small';
export type ReadOnlyLayout = 'vertical' | 'horizontal' | 'grid';
export type ReadOnlyAlign = 'left' | 'right';

/**
 * ui-read-only — displays a labelled value in read-only mode.
 */
@Component({
  selector: 'ui-read-only',
  imports: [NgTemplateOutlet, UiLabel],
  templateUrl: './ui-read-only.html',
  styleUrl: './ui-read-only.scss',
  host: {
    '[style.display]': "inline() ? 'inline-block' : 'block'",
  },
})
export class UiReadOnly {
  /** Field label (plain string — i18n is the caller's responsibility). Rendered via `ui-label`. */
  label = input<string>();
  /** Shows the required marker (*) on the label — for parity with a required field. */
  required = input(false, { transform: booleanAttribute });
  /** Fully custom label markup, replacing the default `ui-label` (escape hatch). */
  labelTemplate = input<TemplateRef<unknown>>();
  /** Displayed value. Ignored when content is projected. */
  value = input<string | number | null | undefined>();
  /** Shown (muted) when the value is null / undefined / empty. */
  fallback = input<string>('—');
  /**
   * Accessible text announced in place of the `fallback` symbol when the value
   * is empty (e.g. "Non renseigné"). The visual `fallback` stays decorative.
   */
  emptyLabel = input<string>();
  /** Stacked (`vertical`), side-by-side (`horizontal`), or grid-driven (`grid`). */
  layout = input<ReadOnlyLayout>('vertical');
  /** Text/label size. */
  size = input<ReadOnlySize>('default');
  /** Label text alignment (horizontal layout only). */
  labelAlign = input<ReadOnlyAlign>('left');
  /** Label column width in horizontal layout (any CSS length, e.g. `160px`, `30%`). Unset = hug content. */
  labelWidth = input<string>();
  /** Preserve line breaks in the value (`white-space: pre-line`). */
  multiline = input(false, { transform: booleanAttribute });
  /** Hug content and flow inline instead of filling the container. */
  inline = input(false, { transform: booleanAttribute });
  /**
   * Adapt the layout to sit alongside form fields
   */
  matchField = input(false, { transform: booleanAttribute });

  // --- Layout passthrough (grid / utility systems) ---------------------
  // Classes forwarded verbatim onto the row / label cell / value cell, so any
  // grid or utility system drives the layout (e.g. Gridaflex `flex-x` on the
  // row + `cell phone-24 desktop-auto` on the cells). Additive in every layout.
  /** Extra classes on the row (`<dl>`), e.g. a grid row class like `flex-x`. */
  rowClass = input<string>();
  /** Extra classes on the label cell (`<dt>`), e.g. `cell phone-24 desktop-auto`. */
  labelClass = input<string>();
  /** Extra classes on the value cell (`<dd>`), e.g. `cell phone-24 desktop-auto`. */
  valueClass = input<string>();

  /** @ignore Wrapper around <ng-content>, used to detect projected content. */
  private readonly projectedWrap = viewChild<ElementRef<HTMLElement>>('projectedWrap');
  /** @ignore Rich value was projected via <ng-content>. */
  protected readonly hasProjectedContent = signal(false);

  constructor() {
    // Detect projected content once (SSR-safe, browser only) — mirrors ui-button.
    afterNextRender(() => {
      const el = this.projectedWrap()?.nativeElement;
      const has =
        !!el &&
        Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && !!n.textContent?.trim()),
        );
      this.hasProjectedContent.set(has);
    });
  }

  /** @ignore A label is provided (drives the <dl>/<dt>/<dd> vs plain markup). */
  protected readonly hasLabel = computed(() => !!this.label() || !!this.labelTemplate());

  /** @ignore Displayed value, or the fallback when empty. */
  protected readonly displayValue = computed(() => {
    const v = this.value();
    if (v === null || v === undefined || v === '') return this.fallback();
    return String(v);
  });

  /** @ignore The displayed value is the fallback placeholder (styled muted). */
  protected readonly isFallback = computed(() => {
    const v = this.value();
    return v === null || v === undefined || v === '';
  });

  /** @ignore Root (row) classes: base + modifiers + passthrough `rowClass`. */
  protected readonly rootClasses = computed(() => {
    const c = ['ui-read-only'];
    const layout = this.layout();
    if (layout === 'horizontal') c.push('_horizontal');
    else if (layout === 'grid') c.push('_grid');
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.labelAlign() === 'right') c.push('_label-right');
    if (this.matchField()) c.push('_match-field');
    const extra = this.rowClass();
    if (extra) c.push(extra);
    return c.join(' ');
  });

  /** @ignore Label-cell classes: base + passthrough `labelClass`. */
  protected readonly labelClasses = computed(() => {
    const extra = this.labelClass();
    return extra ? `ui-read-only-label ${extra}` : 'ui-read-only-label';
  });

  /** @ignore Value-cell classes: base + passthrough `valueClass`. */
  protected readonly valueCellClasses = computed(() => {
    const extra = this.valueClass();
    return extra ? `ui-read-only-value-cell ${extra}` : 'ui-read-only-value-cell';
  });
}
