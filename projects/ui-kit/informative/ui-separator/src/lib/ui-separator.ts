import { Component, computed, input } from '@angular/core';

export type SeparatorOrientation = 'horizontal' | 'vertical';
export type SeparatorVariant = 'solid' | 'dashed';
export type SeparatorSize = 'default' | 'small';
export type SeparatorLabelAlign = 'start' | 'center' | 'end';

/**
 * ui-separator — visual + semantic divider between content.
 *
 * Headless: renders a `role="separator"` element whose rule(s) come from CSS/tokens.
 * A `label` (optional) turns it into a labelled divider; `labelAlign` places the text at
 * the start, center or end of the line. The line style is driven by `variant` (solid/dashed)
 * and its thickness by `size` (default 2px / small 1px).
 */
@Component({
  selector: 'ui-separator',
  templateUrl: './ui-separator.html',
  styleUrl: './ui-separator.scss',
})
export class UiSeparator {
  /** Optional text label (turns the rule into a labelled divider). */
  label = input<string>();
  /** Orientation of the rule (maps to the Figma `Axe` property). */
  orientation = input<SeparatorOrientation>('horizontal');
  /** Line style (maps to the Figma `Type`: Default → solid, Dashed → dashed). */
  variant = input<SeparatorVariant>('solid');
  /** Line thickness (default 2px, small 1px). */
  size = input<SeparatorSize>('default');
  /** Label placement along the line (maps to Figma `Label Align`: Default/Middle/End). */
  labelAlign = input<SeparatorLabelAlign>('start');
  /** Accessible name override (defaults to `label` when present). */
  ariaLabel = input<string>();

  /** @ignore A label is provided. */
  protected readonly hasLabel = computed(() => {
    const l = this.label();
    return l !== undefined && l !== null && l.length > 0;
  });

  /** @ignore A line segment precedes the label (center/end alignment). */
  protected readonly lineBeforeLabel = computed(
    () => this.labelAlign() === 'center' || this.labelAlign() === 'end',
  );

  /** @ignore A line segment follows the label (center/start alignment). */
  protected readonly lineAfterLabel = computed(
    () => this.labelAlign() === 'center' || this.labelAlign() === 'start',
  );

  /** @ignore Accessible name: explicit override, else the visible label. */
  protected readonly accessibleName = computed(() => this.ariaLabel() ?? this.label() ?? null);

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-separator', `_${this.orientation()}`];
    if (this.variant() !== 'solid') c.push(`_${this.variant()}`);
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.hasLabel()) c.push('_labelled');
    return c.join(' ');
  });
}
