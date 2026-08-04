import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { FieldSize } from '@app/shared/components/ui/forms/base-form-field';

/**
 * ui-input-group — glues a control and its add-ons into a single visual field.
 *
 * Purely presentational: each child keeps its own API and states; the group
 * only lays them out on one row, squares the inner corners and collapses the
 * shared borders. The children are **projected**, so that shaping is applied
 * on the DOM (custom properties + flex), not through scoped selectors which
 * cannot reach projected content.
 *
 * Add-ons (text, icon, checkbox…) go through `ui-input-group-addon`; controls
 * (`ui-input`, `ui-select`, `ui-button`…) are placed directly in the group.
 */
@Component({
  selector: 'ui-input-group',
  templateUrl: './ui-input-group.html',
  styleUrl: './ui-input-group.scss',
  host: {
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut()',
  },
})
export class UiInputGroup {
  /** Size shared with the projected `ui-input-group-addon` (controls keep their own `size`). */
  size = input<FieldSize>('default');

  /** @ignore */
  private readonly destroyRef = inject(DestroyRef);
  /** @ignore */
  private readonly row = viewChild.required<ElementRef<HTMLElement>>('row');

  constructor() {
    afterNextRender(() => {
      this.shape();
      // Items are projected: follow the `@if`/`@for` of the consumer template.
      const observer = new MutationObserver(() => this.shape());
      observer.observe(this.row().nativeElement, { childList: true });
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** @ignore Direct items of the row. */
  private items(): HTMLElement[] {
    return Array.from(this.row().nativeElement.children) as HTMLElement[];
  }

  /** @ignore Only the edges keep a rounded corner, and shared borders overlap instead of doubling. */
  private shape(): void {
    const items = this.items();
    const last = items.length - 1;
    items.forEach((el, index) => {
      const start = index === 0 ? 'var(--ui-input-group-radius)' : '0';
      const end = index === last ? 'var(--ui-input-group-radius)' : '0';
      const radius = `${start} ${end} ${end} ${start}`;
      // Radius hooks exposed by the children (custom properties inherit
      // across the component boundary — no ::ng-deep).
      el.style.setProperty('--ui-field-radius', radius);
      el.style.setProperty('--ui-button-radius', radius);
      el.style.setProperty('--ui-input-group-item-radius', radius);
      el.style.position = 'relative'; // lets the focused item paint above its neighbours
      el.style.marginInlineStart = index === 0 ? '' : 'var(--ui-input-group-overlap)';
      // Add-ons and buttons keep their natural width; the controls take the rest.
      const fixed = el.matches('ui-input-group-addon, ui-button');
      el.style.flex = fixed ? '0 0 auto' : '1 1 0';
      el.style.minWidth = fixed ? '' : '0';
    });
  }

  /** @ignore Raises the focused item so its focus ring is not covered by the overlap. */
  protected onFocusIn(event: FocusEvent): void {
    for (const el of this.items()) {
      el.style.zIndex = el.contains(event.target as Node) ? '1' : '';
    }
  }

  /** @ignore */
  protected onFocusOut(): void {
    for (const el of this.items()) el.style.zIndex = '';
  }
}
