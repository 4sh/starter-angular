import { Component, computed, inject, input } from '@angular/core';
import { FieldSize } from '@4sh/ui-kit/forms';
import { UiInputGroup } from './ui-input-group';

/**
 * ui-input-group-addon — non-interactive cell of a `ui-input-group`
 * (text, icon, checkbox, radio…).
 *
 * Projects its content in a box aligned on the field height. `size` falls back
 * to the parent group's when it is not set.
 */
@Component({
  selector: 'ui-input-group-addon',
  templateUrl: './ui-input-group-addon.html',
  styleUrl: './ui-input-group-addon.scss',
})
export class UiInputGroupAddon {
  /** Size (defaults to the parent `ui-input-group` size). */
  size = input<FieldSize>();

  /** @ignore */
  private readonly group = inject(UiInputGroup, { optional: true });

  /** @ignore */
  protected readonly classes = computed(() => {
    const size = this.size() ?? this.group?.size() ?? 'default';
    return size === 'default' ? 'ui-input-group-addon' : `ui-input-group-addon _${size}`;
  });
}
