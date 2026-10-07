import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { UiLabel } from '@4sh/ui-kit/forms/ui-label';
import { UiHelper } from '@4sh/ui-kit/informative/ui-helper';
import { FieldLevel, FieldSize } from '@4sh/ui-kit/forms';

let nextUid = 0;

/**
 * ui-input-group — glues a control and its add-ons into a single visual field.
 *
 * Each child keeps its own API and states; the group lays them out on one row,
 * squares the inner corners and collapses the shared borders. The children are
 * **projected**, so that shaping is applied on the DOM (custom properties +
 * flex), not through scoped selectors which cannot reach projected content.
 *
 * Add-ons (text, icon, checkbox…) go through `ui-input-group-addon`; controls
 * (`ui-input`, `ui-select`, `ui-button`…) are placed directly in the group.
 *
 * `label` / `message` render like `ui-field` and turn the group into a
 * `role="group"`. `level` also tints the projected borders: the validity of a
 * composite value belongs to the group. `merged` draws one box around the row.
 */
@Component({
  selector: 'ui-input-group',
  imports: [UiLabel, UiHelper],
  templateUrl: './ui-input-group.html',
  styleUrl: './ui-input-group.scss',
  host: {
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut()',
  },
})
export class UiInputGroup {
  /** Size shared with the label and the projected `ui-input-group-addon` (controls keep their own `size`). */
  size = input<FieldSize>('default');
  /** Label above the group (rendered via `ui-label`). Names the group, not its controls. */
  label = input<string>();
  /** Required marker (*) on the label. Visual only: the mandatory controls carry `required` themselves. */
  required = input(false, { transform: booleanAttribute });
  /** Message under the group (helper or error, rendered via `ui-helper`). */
  message = input<string>();
  /**
   * Validation status: tints the message and the borders of the projected
   * fields and add-ons. Prevails over a control's own level when set.
   */
  level = input<FieldLevel>('default');
  /** Prefixes the message with a decorative icon (off by default). */
  showMessageIcon = input(false, { transform: booleanAttribute });
  /** Overrides the glyph shown by `showMessageIcon`. Unset = the icon derived from the level. */
  messageIcon = input<string>();
  /** One box around the whole row: no border nor gap between the items, a single focus ring. */
  merged = input(false, { transform: booleanAttribute });

  /** @ignore */
  private readonly destroyRef = inject(DestroyRef);
  /** @ignore */
  private readonly row = viewChild.required<ElementRef<HTMLElement>>('row');

  /** @ignore */
  protected readonly uid = `ui-input-group-${nextUid++}`;
  /** @ignore */
  protected readonly labelId = `${this.uid}-label`;
  /** @ignore */
  protected readonly messageId = `${this.uid}-message`;

  /** @ignore Without label nor message the group stays a plain layout wrapper, with no role. */
  protected readonly isField = computed(() => !!this.label() || !!this.message());

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-input-group', `_${this.level()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.merged()) c.push('_merged');
    return c.join(' ');
  });

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
    // An add-on, a button, or past the end of the row.
    const isCell = (el?: HTMLElement) => !el || el.matches('ui-input-group-addon, ui-button');
    items.forEach((el, index) => {
      const start = index === 0 ? 'var(--_radius)' : '0';
      const end = index === last ? 'var(--_radius)' : '0';
      const radius = `${start} ${end} ${end} ${start}`;
      // Radius hooks exposed by the children (custom properties inherit
      // across the component boundary — no ::ng-deep).
      el.style.setProperty('--ui-field-radius', radius);
      el.style.setProperty('--ui-button-radius', radius);
      el.style.setProperty('--ui-input-group-item-radius', radius);
      el.style.position = 'relative'; // lets the focused item paint above its neighbours
      el.style.marginInlineStart = index === 0 ? '' : 'var(--_overlap)';
      // Add-ons and buttons keep their natural width; the controls take the rest.
      const fixed = isCell(el);
      el.style.flex = `var(--ui-input-group-item-flex, ${fixed ? '0 0 auto' : '1 1 0'})`;
      el.style.minWidth = fixed ? '' : '0';
      // Merged only: `--_group-item-inset` is undefined elsewhere, so the field
      // falls back to its own inset.
      this.setInset(el, 'start', !fixed && !isCell(items[index - 1]));
      this.setInset(el, 'end', !fixed && !isCell(items[index + 1]));
    });
  }

  /** @ignore */
  private setInset(el: HTMLElement, side: 'start' | 'end', tighten: boolean): void {
    const name = `--_field-inset-inline-${side}`;
    if (tighten) el.style.setProperty(name, 'var(--_group-item-inset)');
    else el.style.removeProperty(name);
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
