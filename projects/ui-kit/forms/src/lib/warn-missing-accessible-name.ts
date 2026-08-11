import { isDevMode } from '@angular/core';

// Dev-only a11y guard shared by form controls that require an accessible name
// (`ariaLabel`/`ariaLabelledBy`/`label`). Centralizes the "how to warn" (console + dev-mode
// gating) so each component only supplies its own trigger condition and message text.
export function warnMissingAccessibleName(componentTag: string, message: string): void {
  if (isDevMode()) {
    console.warn(`[${componentTag}] ${message}`);
  }
}
