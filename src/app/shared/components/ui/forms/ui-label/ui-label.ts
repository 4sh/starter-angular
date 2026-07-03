import { booleanAttribute, Component, computed, input } from '@angular/core';

export type LabelSize = 'default' | 'small';

/**
 * ui-label — form field label (mirrors the Figma `ui-label` component).
 *
 * Renders a native <label> with an optional required marker (*). Used standalone
 * or composed inside form components (ui-checkbox, ui-radio, ui-input…).
 *
 * Theming hook: the text color reads `--ui-label-color` first, so a parent form
 * component can drive the label state (hover, disabled…) without piercing this
 * component's style encapsulation:
 *
 * ```scss
 * .ui-checkbox:hover { --ui-label-color: var(--form-high-content-hover); }
 * ```
 */
@Component({
  selector: 'ui-label',
  templateUrl: './ui-label.html',
  styleUrl: './ui-label.scss',
})
export class UiLabel {
  /** Label text (or project content via <ng-content>). */
  label = input<string>();
  /** Shows the required marker (*). */
  required = input(false, { transform: booleanAttribute });
  /** Text size. */
  size = input<LabelSize>('default');
  /** `for` attribute — id of the labelled form element. */
  for = input<string>();
  /** Disabled styling (cascades from the parent form component). */
  disabled = input(false, { transform: booleanAttribute });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-label'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.disabled()) c.push('_disabled');
    return c.join(' ');
  });
}
