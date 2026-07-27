import { booleanAttribute, Component, computed, input } from '@angular/core';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiFeedbackLevel } from '@app/shared/types/ui-level';

export type HelperSize = 'default' | 'small';
export type HelperAriaLive = 'off' | 'polite' | 'assertive';

/** Icône FontAwesome par défaut associée à chaque niveau. */
const LEVEL_ICONS: Record<UiFeedbackLevel, string> = {
  default: 'question-circle',
  highlight: 'info-circle',
  success: 'check-circle',
  warning: 'exclamation-circle',
  error: 'times-circle',
};

/**
 * ui-helper — contextual help/feedback text.
 *
 * Displays a message preceded by an icon whose meaning depends on the `level`
 * (question, info, success, alert, error). Used below a form field
 * (linked via `aria-describedby` on the input) or as a standalone hint.
 *
 * A11y: The text message conveys the information; the icon is decorative
 * (`aria-hidden`). For feedback that appears or changes dynamically (field validation
 *), set `ariaLive=“polite”` (or `“assertive”` for an error) so
 * that screen readers announce the change.
 */

@Component({
  selector: 'ui-helper',
  imports: [UiIcon],
  templateUrl: './ui-helper.html',
  styleUrl: './ui-helper.scss',
})
export class UiHelper {
  /** Help message displayed. */
  message = input.required<string>();
  /** Feedback level (controls the default color and icon). */
  level = input<UiFeedbackLevel>('default');
  /** Text and icon size. */
  size = input<HelperSize>('default');
  /** Displays the level icon. */
  showIcon = input(true, { transform: booleanAttribute });
  /** Overrides the icon name derived from `level`. */
  icon = input<string>();
  /** Live region for dynamic feedback (default: `off`). */
  ariaLive = input<HelperAriaLive>('off');

  /** @ignore Actual icon: explicit overlay, otherwise the icon for that level. */
  protected readonly resolvedIcon = computed(() => this.icon() ?? LEVEL_ICONS[this.level()]);

  /** @ignore An icon is displayed. */
  protected readonly hasIcon = computed(() => this.showIcon() && !!this.resolvedIcon());

  /** @ignore Icon size aligned with text size. */
  protected readonly iconSize = computed(() => (this.size() === 'small' ? 'sm' : 'default'));

  /** @ignore native aria-live (null when `off` to avoid polluting the DOM). */
  protected readonly liveRegion = computed(() => {
    const live = this.ariaLive();
    return live === 'off' ? null : live;
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-helper', `_${this.level()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    return c.join(' ');
  });
}
