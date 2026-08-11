import { Component, ViewEncapsulation } from '@angular/core';

/**
 * ui-avatar-group — stacks a set of `ui-avatar` instances with a slight overlap.
 *
 * Headless layout helper: it only arranges its projected children. Overflow
 * ("+N") is expressed by projecting a trailing label avatar, not computed here.
 *
 * Uses `ViewEncapsulation.None` so the overlap rule can reach the projected
 * `ui-avatar` host elements; all styling stays namespaced under `.ui-avatar-group`.
 */
@Component({
  selector: 'ui-avatar-group',
  template: '<ng-content />',
  styleUrl: './ui-avatar-group.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ui-avatar-group',
    role: 'group',
  },
})
export class UiAvatarGroup {}
