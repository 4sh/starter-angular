import { Directive, input } from '@angular/core';
import { UiSidebar } from './ui-sidebar';

/**
 * uiSidebarTrigger — toggles a `ui-sidebar` from any element.
 *
 * Wires the accessibility contract between a control (button, menu item, rail…)
 * and the sidebar it operates: reflects `aria-controls` (the panel id) and
 * `aria-expanded` (the resolved open/collapsed state), and toggles on
 * activation. Enter / Space come for free on a native `<button>`.
 *
 * @example
 * ```html
 * <button [uiSidebarTrigger]="sb" aria-label="Basculer le menu">☰</button>
 * <ui-sidebar #sb>…</ui-sidebar>
 * ```
 */
@Directive({
  selector: '[uiSidebarTrigger]',
  host: {
    '[attr.aria-controls]': 'sidebar().controlsId',
    '[attr.aria-expanded]': 'sidebar().expanded()',
    '(click)': 'onToggle()',
  },
})
export class UiSidebarTrigger {
  /** The sidebar this control toggles (e.g. `[uiSidebarTrigger]="sb"`). */
  sidebar = input.required<UiSidebar>({ alias: 'uiSidebarTrigger' });

  /** @ignore */
  protected onToggle(): void {
    this.sidebar().toggle();
  }
}
