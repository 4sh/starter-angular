import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

/** Identifier of a step / panel pair (matched against the container `value`). */
export type UiStepValue = string | number;
/** Layout axis of the stepper. */
export type UiStepperOrientation = 'horizontal' | 'vertical';
/** Progression state of a single step, derived from the active step. */
export type UiStepState = 'upcoming' | 'active' | 'completed';

/** Payload emitted when the active step changes. */
export interface UiStepperChangeEvent {
  /** Value of the step that became active. */
  value: UiStepValue;
  /** Originating DOM event (click / keyboard), when triggered by the user. */
  originalEvent?: Event;
}

/** Process-wide counter for unique step/panel ids (aria wiring). */
let nextUid = 0;

/**
 * ui-step , a single step header inside a {@link UiStepList} (horizontal) or a
 * {@link UiStepItem} (vertical).
 *
 * Renders a real native `<button role="tab">` with a numbered marker and its
 * title. Every enabled header is a natural tab stop, so `Tab` walks through the
 * headers and `Enter`/`Space` activate the focused one (native button
 * behaviour , no custom key handling). The progression state (upcoming /
 * active / completed) is derived by the container from the active value; colours
 * come entirely from the `navigation.*` / `informative.*` design tokens.
 *
 * Declared before {@link UiStepper} so the container's content query can
 * reference it without a temporal-dead-zone error at class-definition time.
 */
@Component({
  selector: 'ui-step',
  imports: [UiIcon],
  templateUrl: './ui-step.html',
  styleUrl: './ui-step.scss',
  host: {
    class: 'ui-step',
    '[class._active]': "state() === 'active'",
    '[class._completed]': "state() === 'completed'",
    '[class._vertical]': "stepper.orientation() === 'vertical'",
    '[class._disabled]': 'isDisabled()',
    '[class._last]': 'isLastStep()',
  },
})
export class UiStep {
  /** Identifier of this step (matched against the container `value`). */
  value = model<UiStepValue | undefined>(undefined);
  /** Disable the step (not activatable, skipped by keyboard focus). */
  disabled = input(false, { transform: booleanAttribute });
  /** Icon name overriding the numbered marker (any state). */
  icon = input<string>();
  /** Accessible name override (falls back to the projected title). */
  ariaLabel = input<string>();

  /** @ignore Parent container (owns the active state + progression). */
  protected readonly stepper = inject(UiStepper);

  /** @ignore Progression state of this step. */
  readonly state = computed<UiStepState>(() => this.stepper.stepState(this.value()));

  /** @ignore 1-based position of this step (shown in the marker). */
  protected readonly number = computed(() => this.stepper.stepNumber(this.value()));

  /** @ignore Whether a trailing separator is drawn (horizontal, not the last step). */
  protected readonly showSeparator = computed(
    () => this.stepper.orientation() === 'horizontal' && !this.stepper.isLast(this.value()),
  );

  /** @ignore The separator bridges to the next step once this one is completed. */
  protected readonly separatorCompleted = computed(() => this.state() === 'completed');

  /** @ignore Last step in the sequence (no trailing growth in the horizontal strip). */
  protected readonly isLastStep = computed(() => this.stepper.isLast(this.value()));

  /**
   * @ignore Disabled when explicitly set, or , in `linear` mode , when the step
   * lies ahead of the active one (you cannot skip forward).
   */
  readonly isDisabled = computed(
    () => this.disabled() || (this.stepper.linear() && this.state() === 'upcoming'),
  );

  /** @ignore Glyph shown in the marker: own icon, else the completed icon, else the number. */
  protected readonly markerIcon = computed(() => {
    if (this.icon()) return this.icon()!;
    if (this.state() === 'completed') return this.stepper.completedIcon() ?? null;
    return null;
  });

  /** @ignore */
  protected onClick(event: MouseEvent): void {
    const value = this.value();
    if (this.isDisabled() || value === undefined) return;
    this.stepper.updateValue(value, event);
  }
}

/**
 * ui-step-panel , the content region tied to a {@link UiStep} by shared `value`.
 *
 * The panel stays mounted but is `hidden` (and skipped by assistive tech) when
 * inactive, so its state is preserved. With `lazy` the content is rendered only
 * once the panel is first activated; wrap expensive content in a
 * `<ng-template #content>` so it initialises lazily.
 */
@Component({
  selector: 'ui-step-panel',
  imports: [NgTemplateOutlet],
  template: `
    <ng-template #defaultContent><ng-content /></ng-template>
    <div class="ui-step-panel-collapse" [class._open]="active()" [class._no-motion]="!stepper.motion()">
      <div class="ui-step-panel-inner">
        <div class="ui-step-panel-body">
          @if (shouldRender()) {
            <ng-container [ngTemplateOutlet]="content() ?? defaultContent" />
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './ui-step-panel.scss',
  host: {
    class: 'ui-step-panel',
    role: 'tabpanel',
    '[id]': 'stepper.panelId(value())',
    '[attr.aria-labelledby]': 'stepper.stepId(value())',
    '[attr.tabindex]': 'active() ? 0 : null',
    '[attr.inert]': "active() ? null : ''",
    '[class._active]': 'active()',
  },
})
export class UiStepPanel {
  /** Identifier of this panel (matched against the step of the same `value`). */
  value = model<UiStepValue | undefined>(undefined);
  /** Render this panel's content only once it is first activated. */
  lazy = input(false, { transform: booleanAttribute });

  /** Optional lazy content template (`<ng-template #content>`). */
  protected readonly content = contentChild<TemplateRef<unknown>>('content');

  /** @ignore Parent container (active state + group `lazy` default). */
  protected readonly stepper = inject(UiStepper);

  /** @ignore */
  protected readonly active = computed(() => this.stepper.isActive(this.value()));
  /** @ignore Lazy either per panel or inherited from the group. */
  private readonly isLazy = computed(() => this.stepper.lazy() || this.lazy());
  /** @ignore Sticks once the panel has been activated at least once. */
  private readonly hasRendered = signal(false);

  constructor() {
    effect(() => {
      if (this.active()) this.hasRendered.set(true);
    });
  }

  /** @ignore Eager panels always render; lazy ones only after first activation. */
  protected readonly shouldRender = computed(
    () => !this.isLazy() || this.hasRendered() || this.active(),
  );
}

/**
 * ui-step-list , the horizontal strip of {@link UiStep} headers.
 *
 * Owns the WAI-ARIA `role="tablist"`. Focus moves through the headers with
 * `Tab` (each enabled header is a native tab stop); activation is `Enter` /
 * `Space` (native `<button>`). Use it on its own , without panels , for a plain
 * progress indicator ("steps only").
 */
@Component({
  selector: 'ui-step-list',
  template: '<ng-content />',
  styleUrl: './ui-step-list.scss',
  host: {
    class: 'ui-step-list',
    role: 'tablist',
    'aria-orientation': 'horizontal',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
})
export class UiStepList {
  /** Accessible name for the step list (recommended). */
  ariaLabel = input<string>();
}

/**
 * ui-step-panels , thin wrapper grouping the {@link UiStepPanel}s below the
 * horizontal step list.
 */
@Component({
  selector: 'ui-step-panels',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      width: 100%;
    }
  `,
  host: { class: 'ui-step-panels' },
})
export class UiStepPanels {}

/**
 * ui-step-item , vertical wrapper pairing a {@link UiStep} with its
 * {@link UiStepPanel}. Carries the shared `value` and propagates it to both
 * children, so the vertical markup stays terse. The connector rail is drawn by
 * the item itself, alongside the panel.
 */
@Component({
  selector: 'ui-step-item',
  template: '<ng-content />',
  styleUrl: './ui-step-item.scss',
  host: {
    class: 'ui-step-item',
    '[class._active]': "state() === 'active'",
    '[class._completed]': "state() === 'completed'",
    '[class._last]': 'isLast()',
  },
})
export class UiStepItem {
  /** Identifier shared by the wrapped step and panel. */
  value = input.required<UiStepValue>();

  /** @ignore Parent container. */
  protected readonly stepper = inject(UiStepper);

  /** @ignore Wrapped step (value propagated from this item). */
  private readonly step = contentChild(UiStep);
  /** @ignore Wrapped panel (value propagated from this item). */
  private readonly panel = contentChild(UiStepPanel);

  /** @ignore Progression state (drives the connector colour). */
  protected readonly state = computed<UiStepState>(() => this.stepper.stepState(this.value()));
  /** @ignore Last item hides its connector rail. */
  protected readonly isLast = computed(() => this.stepper.isLast(this.value()));

  constructor() {
    // Propagate the item value down to the wrapped step and panel.
    effect(() => {
      this.step()?.value.set(this.value());
      this.panel()?.value.set(this.value());
    });
  }
}

/**
 * ui-stepper , headless container guiding a user through a numbered, multi-step
 * progression (wizard). Composition API mirroring `ui-tabs`.
 *
 * Two layouts. **Horizontal**: a `ui-step-list` of `ui-step` headers on top and
 * a `ui-step-panels` holding one `ui-step-panel` per step below (each step and
 * its panel paired by `value`). **Vertical**: each `ui-step-item` wraps a
 * `ui-step` and its `ui-step-panel`, so the panel appears directly beneath its
 * header. With `linear`, steps ahead of the active one are disabled , advance by
 * setting `value` (e.g. a "Next" button in the panel). Every colour/metric comes
 * from the `navigation.*` / `informative.*` design tokens; the active panel
 * fades in via the shared motion system (reduced-motion aware).
 *
 * @example
 * ```html
 * <ui-stepper [(value)]="active">
 *   <ui-step-list ariaLabel="Étapes">
 *     <ui-step [value]="1">Compte</ui-step>
 *     <ui-step [value]="2">Profil</ui-step>
 *     <ui-step [value]="3">Confirmation</ui-step>
 *   </ui-step-list>
 *   <ui-step-panels>
 *     <ui-step-panel [value]="1">…</ui-step-panel>
 *     <ui-step-panel [value]="2">…</ui-step-panel>
 *     <ui-step-panel [value]="3">…</ui-step-panel>
 *   </ui-step-panels>
 * </ui-stepper>
 * ```
 */
@Component({
  selector: 'ui-stepper',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      width: 100%;
    }
  `,
  host: {
    class: 'ui-stepper',
    '[class._vertical]': "orientation() === 'vertical'",
    '[attr.role]': "orientation() === 'vertical' ? 'tablist' : null",
    '[attr.aria-orientation]': "orientation() === 'vertical' ? 'vertical' : null",
    '[attr.aria-label]': "orientation() === 'vertical' ? (ariaLabel() || null) : null",
    '[attr.id]': 'id',
  },
})
export class UiStepper {
  /** Value of the active step (two-way). `undefined` = no active step. */
  value = model<UiStepValue | undefined>(undefined);
  /** Layout axis: `horizontal` (list on top, panels below) or `vertical`. */
  orientation = input<UiStepperOrientation>('horizontal');
  /** When `true`, steps ahead of the active one are disabled (no skipping forward). */
  linear = input(false, { transform: booleanAttribute });
  /** Group default: render an inactive panel's content only once it is first activated. */
  lazy = input(false, { transform: booleanAttribute });
  /** Animate the active panel transition (reduced-motion always wins). */
  motion = input(true, { transform: booleanAttribute });
  /** Icon shown in the marker of completed steps (falls back to the step number). */
  completedIcon = input<string>();
  /** Accessible name for the container (used as `aria-label` in vertical layout). */
  ariaLabel = input<string>();
  /** Tabindex applied to each enabled step header. */
  tabindex = input(0, { transform: numberAttribute });

  /** Fired whenever the active step changes (user click / keyboard). */
  stepChange = output<UiStepperChangeEvent>();

  /** @ignore Unique id root for aria wiring between steps and panels. */
  readonly id = `ui-stepper-${nextUid++}`;

  /** @ignore All steps projected under this container, in DOM order. */
  private readonly steps = contentChildren(forwardRef(() => UiStep), { descendants: true });

  /** @ignore Ordered step values (the progression sequence). */
  private readonly orderedValues = computed(() => this.steps().map((s) => s.value()));

  /** @ignore Index of the active step in the ordered sequence (-1 when none). */
  private readonly activeIndex = computed(() => this.orderedValues().indexOf(this.value()));

  /** @ignore id of the step header for a given value. */
  stepId(value: UiStepValue | undefined): string {
    return `${this.id}-step-${value}`;
  }
  /** @ignore id of the panel for a given value. */
  panelId(value: UiStepValue | undefined): string {
    return `${this.id}-panel-${value}`;
  }

  /** @ignore Whether the given value is the active step. */
  isActive(value: UiStepValue | undefined): boolean {
    return value !== undefined && this.value() === value;
  }

  /** @ignore 1-based position of a step in the progression (0 when unknown). */
  stepNumber(value: UiStepValue | undefined): number {
    return this.orderedValues().indexOf(value) + 1;
  }

  /** @ignore Whether the given value is the last step in the sequence. */
  isLast(value: UiStepValue | undefined): boolean {
    const values = this.orderedValues();
    return values.length > 0 && values[values.length - 1] === value;
  }

  /**
   * @ignore Progression state of a step: before the active one → `completed`,
   * the active one → `active`, after it → `upcoming`.
   */
  stepState(value: UiStepValue | undefined): UiStepState {
    const index = this.orderedValues().indexOf(value);
    const active = this.activeIndex();
    if (index === -1 || active === -1) return 'upcoming';
    if (index < active) return 'completed';
    if (index === active) return 'active';
    return 'upcoming';
  }

  /** @ignore Activate a step (no-op if already active); emits `stepChange`. */
  updateValue(value: UiStepValue, event?: Event): void {
    if (this.value() === value) return;
    this.value.set(value);
    this.stepChange.emit({ value, originalEvent: event });
  }

  /** Activate the next step in the sequence (respects the sequence bounds). */
  next(): void {
    const values = this.orderedValues();
    const target = values[this.activeIndex() + 1];
    if (target !== undefined) this.updateValue(target);
  }

  /** Activate the previous step in the sequence. */
  prev(): void {
    const values = this.orderedValues();
    const index = this.activeIndex();
    if (index > 0) this.updateValue(values[index - 1]!);
  }
}
