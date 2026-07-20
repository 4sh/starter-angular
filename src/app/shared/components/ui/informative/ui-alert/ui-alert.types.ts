import { UiFeedbackLevel } from '@app/shared/types/ui-level';

/** Rendered scale of an alert. `default` = base, `large` = comfortable. */
export type UiAlertSize = 'default' | 'large';

/**
 * Default leading icon per semantic level (FontAwesome names, from the Figma
 * source). Overridable per instance through the `icon` input.
 */
export const UI_ALERT_DEFAULT_ICONS: Record<UiFeedbackLevel, string> = {
  default: 'info-circle',
  highlight: 'info-circle',
  success: 'check',
  warning: 'warning',
  error: 'times',
};
