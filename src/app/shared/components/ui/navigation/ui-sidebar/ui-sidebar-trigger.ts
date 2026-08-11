import { afterRenderEffect, Directive, ElementRef, inject, input } from '@angular/core';
import { UiSidebar } from './ui-sidebar';

/**
 * uiSidebarTrigger — toggles a `ui-sidebar` from any element.
 *
 * Wires the accessibility contract between a control (button, menu item, rail…)
 * and the sidebar it operates: reflects `aria-controls` (the panel id) and
 * `aria-expanded` (the resolved open/collapsed state), and toggles on
 * activation. Enter / Space come for free on a native `<button>`.
 *
 * The directive is often placed on a `ui-button` host (a component, not a native
 * `<button>`): the ARIA attributes are applied to the actual interactive
 * descendant (native `<button>`/`<a>`/`[role=button]`), never to the wrapper
 * custom element, so assistive tech reads them off the real accessible node —
 * same convention as `ui-popover`'s trigger handling.
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
    '(click)': 'onToggle()',
  },
})
export class UiSidebarTrigger {
  /** The sidebar this control toggles (e.g. `[uiSidebarTrigger]="sb"`). */
  sidebar = input.required<UiSidebar>({ alias: 'uiSidebarTrigger' });

  /** @ignore */
  private readonly hostEl: HTMLElement = inject(ElementRef).nativeElement;

  constructor() {
    // `afterRenderEffect`, not `effect`: the interactive descendant (e.g. a
    // `ui-button`'s inner `<button>`) only exists once the host component's own
    // view has rendered, which happens after this directive's construction.
    afterRenderEffect(() => {
      const sidebar = this.sidebar();
      const el = this.resolveInteractiveEl();
      el.setAttribute('aria-controls', sidebar.controlsId);
      el.setAttribute('aria-expanded', String(sidebar.expanded()));
    });
  }

  /** @ignore */
  protected onToggle(): void {
    this.sidebar().toggle();
  }

  /** @ignore The real interactive node when hosted on a component wrapper (e.g. `ui-button`). */
  private resolveInteractiveEl(): HTMLElement {
    return this.hostEl.querySelector<HTMLElement>('button, a[href], [role="button"]') ?? this.hostEl;
  }
}
