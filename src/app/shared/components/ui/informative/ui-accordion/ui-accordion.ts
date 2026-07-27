import {
  booleanAttribute,
  Component,
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiSeparator } from '@app/shared/components/ui/informative/ui-separator/ui-separator';

/** Identifier of a panel within an accordion (its `value`). */
export type UiAccordionValue = string | number;
/** Active value(s): a single value (single mode) or an array (multiple mode). */
export type UiAccordionActiveValue =
  | UiAccordionValue
  | UiAccordionValue[]
  | null
  | undefined;

/** Payload of the accordion open/close outputs. */
export interface UiAccordionChangeEvent {
  /** Value of the panel that opened or closed. */
  value: UiAccordionValue;
  /** Originating DOM event (click / keyboard / focus). */
  originalEvent: Event;
}

/** Process-wide counter for unique header/content ids (aria wiring). */
let nextUid = 0;

/**
 * Header slot marker — apply it (attribute or element form) on the content that
 * should sit in a panel's header. Optional: the `header` string input is a
 * shorthand for a plain-text title.
 *
 *   <ui-accordion-panel value="0">
 *     <span uiAccordionHeader>Rich <b>title</b></span>
 *     Body content (default slot)…
 *   </ui-accordion-panel>
 */
@Directive({ selector: '[uiAccordionHeader], ui-accordion-header' })
export class UiAccordionHeader {}

/**
 * Content slot marker (optional) — the panel body is the **default** projection,
 * so this is only needed to disambiguate. Kept for symmetry with the header slot.
 */
@Directive({ selector: '[uiAccordionContent], ui-accordion-content' })
export class UiAccordionContent {}

/**
 * ui-accordion-panel — a single collapsible section of a {@link UiAccordion}.
 *
 * The whole header is a native `<button>` (WAI-ARIA accordion pattern): clicking
 * anywhere on it toggles the panel; the chevron is a decorative affordance styled
 * as the Figma control. The body region stays in the DOM but is `inert` and
 * height-collapsed when closed (form state preserved, hidden from AT).
 *
 * Declared before {@link UiAccordion} so the container's content query can
 * reference it without a temporal-dead-zone error at class-definition time.
 */
@Component({
  selector: 'ui-accordion-panel',
  templateUrl: './ui-accordion-panel.html',
  styleUrl: './ui-accordion-panel.scss',
  imports: [UiIcon, UiSeparator],
  host: {
    class: 'ui-accordion-panel',
    '[class._active]': 'active()',
    '[class._disabled]': 'disabled()',
  },
})
export class UiAccordionPanel {
  /** Unique identifier of the panel (matched against the accordion `value`). */
  value = input.required<UiAccordionValue>();
  /** Plain-text header shorthand (use the `uiAccordionHeader` slot for rich content). */
  header = input<string>();
  /** Disable the panel (not toggleable, skipped by keyboard navigation). */
  disabled = input(false, { transform: booleanAttribute });
  /** Per-panel override for the header divider (falls back to the group default). */
  separator = input<boolean | undefined>(undefined);
  /** Per-panel override for the chevron control (falls back to the group default). */
  control = input<boolean | undefined>(undefined);

  /** @ignore Parent accordion (owns the open state + group defaults). */
  protected readonly accordion = inject(UiAccordion);

  /** @ignore */
  readonly headerButton = viewChild.required<ElementRef<HTMLButtonElement>>('headerBtn');

  /** @ignore */
  private readonly uid = ++nextUid;
  /** @ignore */
  protected readonly headerId = `ui-accordion-header-${this.uid}`;
  /** @ignore */
  protected readonly contentId = `ui-accordion-content-${this.uid}`;

  /** @ignore */
  protected readonly active = computed(() => this.accordion.isActive(this.value()));
  /** @ignore */
  protected readonly icon = computed(() =>
    this.active() ? this.accordion.collapseIcon() : this.accordion.expandIcon(),
  );
  /** @ignore */
  protected readonly showSeparator = computed(() => this.separator() ?? this.accordion.separator());
  /** @ignore */
  protected readonly showControl = computed(() => this.control() ?? this.accordion.control());

  /** Move focus to this panel's header. */
  focus(): void {
    this.headerButton().nativeElement.focus();
  }

  /** @ignore */
  protected toggle(event: Event): void {
    if (this.disabled()) return;
    this.accordion.toggle(this.value(), event);
  }

  /** @ignore */
  protected onFocus(event: FocusEvent): void {
    if (this.accordion.selectOnFocus() && !this.disabled()) {
      this.accordion.open(this.value(), event);
    }
  }
}

/**
 * ui-accordion — container grouping a set of collapsible {@link UiAccordionPanel}s.
 *
 * Headless (composition API inspired by PrimeNG `p-accordion`): it owns the open
 * state (`value` two-way model, `single` or `multiple`), roving-focus keyboard
 * navigation across headers (Up/Down/Home/End), and the group-level defaults
 * (`separator`, `control`, expand/collapse icons, `motion`). Every colour/metric
 * comes from the `informative` / `actions` design tokens; the collapse animation
 * is timed by the shared motion system.
 *
 * @example
 * ```html
 * <ui-accordion [(value)]="open" [multiple]="true">
 *   <ui-accordion-panel value="a" header="Section A">Contenu A…</ui-accordion-panel>
 *   <ui-accordion-panel value="b" header="Section B">Contenu B…</ui-accordion-panel>
 * </ui-accordion>
 * ```
 */
@Component({
  selector: 'ui-accordion',
  template: '<ng-content />',
  styleUrl: './ui-accordion.scss',
  host: {
    class: 'ui-accordion',
    '(keydown)': 'onKeydown($event)',
  },
})
export class UiAccordion {
  /** Active panel value(s). Single mode: one value; `multiple`: an array. */
  value = model<UiAccordionActiveValue>();
  /** Allow several panels open at once (value becomes an array). */
  multiple = input(false, { transform: booleanAttribute });
  /** Open a panel as soon as its header receives focus. */
  selectOnFocus = input(false, { transform: booleanAttribute });
  /** Group default: render the divider under each header. Overridable per panel. */
  separator = input(true, { transform: booleanAttribute });
  /** Group default: render the chevron control on each header. Overridable per panel. */
  control = input(true, { transform: booleanAttribute });
  /** Icon shown on a collapsed panel. */
  expandIcon = input<string>('chevron-down');
  /** Icon shown on an expanded panel. */
  collapseIcon = input<string>('chevron-up');
  /** Animate the expand/collapse transition (honours reduced-motion regardless). */
  motion = input(true, { transform: booleanAttribute });

  /** Fired when a panel is expanded. */
  onOpen = output<UiAccordionChangeEvent>();
  /** Fired when a panel is collapsed. */
  onClose = output<UiAccordionChangeEvent>();

  /** @ignore Projected panels (for keyboard roving focus). */
  private readonly panels = contentChildren(UiAccordionPanel);

  /** @ignore Whether the given panel value is currently active. */
  isActive(value: UiAccordionValue): boolean {
    const v = this.value();
    if (this.multiple()) return Array.isArray(v) && v.includes(value);
    return v === value;
  }

  /** @ignore Toggle a panel (single mode allows closing the active one). */
  toggle(value: UiAccordionValue, event: Event): void {
    const wasActive = this.isActive(value);
    this.setActive(value, !wasActive);
    (wasActive ? this.onClose : this.onOpen).emit({ value, originalEvent: event });
  }

  /** @ignore Open a panel if it is not already open (used by `selectOnFocus`). */
  open(value: UiAccordionValue, event: Event): void {
    if (this.isActive(value)) return;
    this.setActive(value, true);
    this.onOpen.emit({ value, originalEvent: event });
  }

  /** @ignore */
  private setActive(value: UiAccordionValue, on: boolean): void {
    if (this.multiple()) {
      const current = Array.isArray(this.value()) ? [...(this.value() as UiAccordionValue[])] : [];
      const index = current.indexOf(value);
      if (on && index === -1) current.push(value);
      else if (!on && index !== -1) current.splice(index, 1);
      this.value.set(current);
    } else {
      this.value.set(on ? value : undefined);
    }
  }

  /** @ignore Roving focus across enabled headers (WAI-ARIA accordion pattern). */
  protected onKeydown(event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = this.panels().filter((p) => !p.disabled());
    if (!items.length) return;
    const current = items.findIndex((p) => p.headerButton().nativeElement === document.activeElement);
    if (current === -1) return; // focus is not on a header — let the event through.

    event.preventDefault();
    let next = current;
    switch (event.key) {
      case 'ArrowDown': next = (current + 1) % items.length; break;
      case 'ArrowUp': next = (current - 1 + items.length) % items.length; break;
      case 'Home': next = 0; break;
      case 'End': next = items.length - 1; break;
    }
    items[next].focus();
  }
}
