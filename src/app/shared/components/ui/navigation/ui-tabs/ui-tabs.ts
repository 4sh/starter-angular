import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

/** Identifier of a tab / panel pair (matched against the container `value`). */
export type UiTabValue = string | number;
/** Layout axis of the tab list. */
export type UiTabsOrientation = 'horizontal' | 'vertical';
/** Position of a tab's icon relative to its label. */
export type UiTabIconPos = 'left' | 'right';

/** Payload emitted when the active tab changes. */
export interface UiTabsChangeEvent {
  /** Value of the tab that became active. */
  value: UiTabValue;
  /** Originating DOM event (click / keyboard / focus). */
  originalEvent: Event;
}

/** @ignore Measured geometry of the active-tab indicator bar. */
interface ActiveBarMetrics {
  /** Offset along the main axis (px) from the tab list origin. */
  offset: number;
  /** Length along the main axis (px): tab width (horizontal) or height (vertical). */
  length: number;
}

/** Process-wide counter for unique tab/panel ids (aria wiring). */
let nextUid = 0;

/**
 * ui-tab , a single tab button inside a {@link UiTabList}.
 *
 * Renders a real native `<button role="tab">` (the `ui-tab` host is
 * `display: contents`, so the button sits directly inside the `role="tablist"`).
 * Keyboard roving and the active indicator are driven by the list; this element
 * only reports its value/state and activates on click or `selectOnFocus`.
 *
 * Declared before {@link UiTabList} / {@link UiTabs} so their content queries
 * can reference it without a temporal-dead-zone error at class-definition time.
 */
@Component({
  selector: 'ui-tab',
  imports: [UiIcon],
  template: `
    <button
      #tabBtn
      type="button"
      role="tab"
      class="ui-tab-button"
      [id]="tabs.tabId(value())"
      [attr.aria-controls]="tabs.panelId(value())"
      [attr.aria-selected]="active()"
      [attr.aria-label]="ariaLabel() || null"
      [disabled]="disabled()"
      [attr.tabindex]="tabindex()"
      (click)="onClick($event)"
      (focus)="onFocus($event)"
    >
      @if (icon(); as name) {
        <ui-icon class="ui-tab-icon" [name]="name" size="default" />
      }
      <span class="ui-tab-label"><ng-content /></span>
    </button>
  `,
  styleUrl: './ui-tab.scss',
  host: {
    class: 'ui-tab',
    '[class._active]': 'active()',
    '[class._disabled]': 'disabled()',
    '[class._icon-right]': "iconPos() === 'right'",
    '[class._vertical]': "tabs.orientation() === 'vertical'",
  },
})
export class UiTab {
  /** Identifier of this tab (matched against the container `value`). */
  value = input.required<UiTabValue>();
  /** Disable the tab (not selectable, skipped by keyboard navigation). */
  disabled = input(false, { transform: booleanAttribute });
  /** Optional leading (or trailing) icon name. */
  icon = input<string>();
  /** Icon position relative to the label. */
  iconPos = input<UiTabIconPos>('left');
  /** Accessible name override (falls back to the projected label). */
  ariaLabel = input<string>();

  /** @ignore Parent container (owns the active state + group options). */
  protected readonly tabs = inject(UiTabs);

  /** @ignore The native tab button (for focus + indicator measurement). */
  readonly buttonEl = viewChild.required<ElementRef<HTMLButtonElement>>('tabBtn');

  /** @ignore Whether this tab is the active one. */
  readonly active = computed(() => this.tabs.isActive(this.value()));

  /** @ignore Roving tabindex: only the group's tab stop is reachable via Tab. */
  protected readonly tabindex = computed(() =>
    this.tabs.tabStopValue() === this.value() ? this.tabs.tabindex() : -1,
  );

  /** Move focus to this tab's button. */
  focus(options?: FocusOptions): void {
    this.buttonEl().nativeElement.focus(options);
  }

  /** @ignore */
  protected onClick(event: MouseEvent): void {
    if (this.disabled()) return;
    this.tabs.updateValue(this.value(), event);
  }

  /** @ignore Automatic activation on focus (when the group opts in). */
  protected onFocus(event: FocusEvent): void {
    if (this.tabs.selectOnFocus() && !this.disabled()) {
      this.tabs.updateValue(this.value(), event);
    }
  }
}

/**
 * ui-tab-panel , the content region tied to a {@link UiTab} by shared `value`.
 *
 * The panel stays in the DOM but is `hidden` (and skipped by AT) when inactive,
 * so its state is preserved. With `lazy` (per panel or group-wide) the content
 * is rendered only once the panel is first activated; wrap expensive content in
 * a `<ng-template #content>` so it initialises lazily.
 */
@Component({
  selector: 'ui-tab-panel',
  imports: [NgTemplateOutlet],
  template: `
    <ng-template #defaultContent><ng-content /></ng-template>
    @if (shouldRender()) {
      <ng-container [ngTemplateOutlet]="content() ?? defaultContent" />
    }
  `,
  styleUrl: './ui-tab-panel.scss',
  host: {
    class: 'ui-tab-panel',
    role: 'tabpanel',
    tabindex: '0',
    '[id]': 'tabs.panelId(value())',
    '[attr.aria-labelledby]': 'tabs.tabId(value())',
    '[hidden]': '!active()',
    '[class._active]': 'active()',
    '[class._no-motion]': '!tabs.motion()',
  },
})
export class UiTabPanel {
  /** Identifier of this panel (matched against the container `value`). */
  value = input.required<UiTabValue>();
  /** Render this panel's content only once it is first activated. */
  lazy = input(false, { transform: booleanAttribute });

  /** Optional lazy content template (`<ng-template #content>`). */
  protected readonly content = contentChild<TemplateRef<unknown>>('content');

  /** @ignore Parent container (active state + group `lazy` default). */
  protected readonly tabs = inject(UiTabs);

  /** @ignore */
  protected readonly active = computed(() => this.tabs.isActive(this.value()));
  /** @ignore Lazy either per panel or inherited from the group. */
  private readonly isLazy = computed(() => this.tabs.lazy() || this.lazy());
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
 * ui-tab-list , the horizontal (or vertical) strip of {@link UiTab} buttons.
 *
 * Owns the WAI-ARIA `role="tablist"`, the roving-focus keyboard navigation
 * (Arrow keys along the axis, Home/End), the sliding active indicator measured
 * from the active tab, and , when the container is `scrollable` , the prev/next
 * navigators that scroll the overflowing strip.
 */
@Component({
  selector: 'ui-tab-list',
  imports: [UiIcon],
  templateUrl: './ui-tab-list.html',
  styleUrl: './ui-tab-list.scss',
  host: {
    class: 'ui-tab-list',
    '[class._vertical]': "orientation() === 'vertical'",
    '[class._scrollable]': 'scrollable()',
    '[class._no-motion]': '!tabs.motion()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class UiTabList {
  /** Accessible name for the tab list (recommended). */
  ariaLabel = input<string>();

  /** @ignore Parent container (state + group options). */
  protected readonly tabs = inject(UiTabs);
  /** @ignore */
  private readonly destroyRef = inject(DestroyRef);

  /** @ignore Tabs projected into this list, in DOM order. */
  private readonly tabItems = contentChildren(UiTab);
  /** @ignore Scroll viewport around the tab strip. */
  private readonly scrollEl = viewChild.required<ElementRef<HTMLElement>>('scroll');
  /** @ignore The `role="tablist"` inner element (indicator's offset parent). */
  private readonly innerEl = viewChild.required<ElementRef<HTMLElement>>('inner');

  /** @ignore Measured indicator geometry (null when there is no active tab). */
  protected readonly bar = signal<ActiveBarMetrics | null>(null);
  /** @ignore Bumped by the ResizeObserver / scroll to re-measure. */
  private readonly resizeTick = signal(0);
  /** @ignore Whether scrolling further back is possible. */
  protected readonly prevEnabled = signal(false);
  /** @ignore Whether scrolling further forward is possible. */
  protected readonly nextEnabled = signal(false);

  /** @ignore */
  protected readonly orientation = computed(() => this.tabs.orientation());
  /** @ignore */
  protected readonly scrollable = computed(() => this.tabs.scrollable());
  /** @ignore Navigators render only when scrollable AND explicitly enabled. */
  protected readonly showNavigators = computed(
    () => this.scrollable() && this.tabs.showNavigators(),
  );

  constructor() {
    // Re-measure the indicator and the navigator state on any geometry change.
    afterNextRender(() => {
      const ro = new ResizeObserver(() => {
        this.resizeTick.update((v) => v + 1);
        this.updateNavigators();
      });
      ro.observe(this.scrollEl().nativeElement);
      ro.observe(this.innerEl().nativeElement);
      this.updateNavigators();
      this.destroyRef.onDestroy(() => ro.disconnect());
    });

    // Track the active tab with the sliding indicator.
    afterRenderEffect(() => {
      const activeValue = this.tabs.value();
      this.orientation();
      this.resizeTick();
      const items = this.tabItems();

      const item = items.find((t) => t.value() === activeValue && !t.disabled());
      if (!item) {
        this.bar.set(null);
        return;
      }
      const btn = item.buttonEl().nativeElement;
      const horizontal = this.orientation() === 'horizontal';
      const next: ActiveBarMetrics = horizontal
        ? { offset: btn.offsetLeft, length: btn.offsetWidth }
        : { offset: btn.offsetTop, length: btn.offsetHeight };

      const cur = untracked(this.bar);
      if (!cur || cur.offset !== next.offset || cur.length !== next.length) {
        this.bar.set(next);
      }
    });

    afterRenderEffect(() => {
      const activeValue = this.tabs.value();
      if (!this.scrollable()) return;
      const item = this.tabItems().find((t) => t.value() === activeValue && !t.disabled());
      if (item) this.scrollIntoView(item.buttonEl().nativeElement);
    });
  }

  /** @ignore CSS transform positioning the indicator along the main axis. */
  protected readonly barTransform = computed(() => {
    const b = this.bar();
    if (!b) return null;
    return this.orientation() === 'horizontal'
      ? `translateX(${b.offset}px)`
      : `translateY(${b.offset}px)`;
  });

  /** @ignore Roving focus across enabled tabs (WAI-ARIA tabs pattern). */
  protected onKeydown(event: KeyboardEvent): void {
    const horizontal = this.orientation() === 'horizontal';
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
    if (![nextKey, prevKey, 'Home', 'End'].includes(event.key)) return;

    const enabled = this.tabItems().filter((t) => !t.disabled());
    if (!enabled.length) return;

    const active = document.activeElement;
    let pos = enabled.findIndex((t) => t.buttonEl().nativeElement === active);
    if (pos === -1) return; // focus is not on a tab , let the event through.

    event.preventDefault();
    switch (event.key) {
      case nextKey: pos = (pos + 1) % enabled.length; break;
      case prevKey: pos = (pos - 1 + enabled.length) % enabled.length; break;
      case 'Home': pos = 0; break;
      case 'End': pos = enabled.length - 1; break;
    }
    const target = enabled[pos];
    target.focus();
    this.scrollIntoView(target.buttonEl().nativeElement);
  }

  /**
   * @ignore Bring the given tab fully inside the scroll viewport, scrolling by
   * the minimum needed along the active axis. Uses the viewport's own metrics
   * (never the page): a tab clipped at either edge slides back into view.
   */
  private scrollIntoView(el: HTMLElement): void {
    if (!this.scrollable()) return;
    const viewport = this.scrollEl().nativeElement;
    const horizontal = this.orientation() === 'horizontal';
    const start = horizontal ? el.offsetLeft : el.offsetTop;
    const size = horizontal ? el.offsetWidth : el.offsetHeight;
    const viewStart = horizontal ? viewport.scrollLeft : viewport.scrollTop;
    const viewSize = horizontal ? viewport.clientWidth : viewport.clientHeight;
    if (viewSize === 0) return; // not laid out yet , a later pass will re-run.

    let target = viewStart;
    if (start < viewStart) {
      target = start; // clipped at the start edge , align to it.
    } else if (start + size > viewStart + viewSize) {
      target = start + size - viewSize; // clipped at the end edge , align flush.
    } else {
      return; // already fully visible.
    }
    // Plain scrollTo (no `behavior` option) , the animation comes from the
    // container's CSS `scroll-behavior`, which the motion system tunes and
    // reduced-motion disables.
    viewport.scrollTo(horizontal ? { left: target } : { top: target });
  }

  /** @ignore Refresh the prev/next enabled state from the scroll position. */
  private updateNavigators(): void {
    if (!this.scrollable()) return;
    const el = this.scrollEl().nativeElement;
    if (this.orientation() === 'horizontal') {
      const max = el.scrollWidth - el.clientWidth;
      this.prevEnabled.set(el.scrollLeft > 1);
      this.nextEnabled.set(el.scrollLeft < max - 1);
    } else {
      const max = el.scrollHeight - el.clientHeight;
      this.prevEnabled.set(el.scrollTop > 1);
      this.nextEnabled.set(el.scrollTop < max - 1);
    }
  }

  /** @ignore */
  protected onScroll(): void {
    this.updateNavigators();
  }

  /**
   * @ignore Scroll the strip by roughly one viewport in the given direction.
   * Smoothness comes from the container's CSS `scroll-behavior` (motion-aware),
   * not the JS `behavior` option.
   */
  protected scrollBy(direction: -1 | 1): void {
    const el = this.scrollEl().nativeElement;
    if (this.orientation() === 'horizontal') {
      el.scrollBy({ left: direction * el.clientWidth * 0.8 });
    } else {
      el.scrollBy({ top: direction * el.clientHeight * 0.8 });
    }
  }
}

/**
 * ui-tab-panels , thin wrapper grouping the {@link UiTabPanel}s. Fills the
 * remaining space beside/under the tab list.
 */
@Component({
  selector: 'ui-tab-panels',
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      flex: 1 1 auto;
      min-width: 0;
    }
  `,
  host: { class: 'ui-tab-panels' },
})
export class UiTabPanels {}

/**
 * ui-tabs , headless container orchestrating a set of tabs and their panels.
 *
 * Composition API: a root `ui-tabs` owns the shared state (`value` two-way
 * model, `orientation`, `scrollable`, `lazy`, `selectOnFocus`, `motion`), a
 * `ui-tab-list` renders the strip of `ui-tab` buttons (plus the sliding active
 * indicator and, when scrollable, the prev/next navigators), and a
 * `ui-tab-panels` holds one `ui-tab-panel` per tab. Every colour/metric comes
 * from the `navigation.*` design tokens; the active indicator glides , and each
 * panel fades in , via the shared motion system (reduced-motion aware).
 *
 * @example
 * ```html
 * <ui-tabs [(value)]="active">
 *   <ui-tab-list ariaLabel="Sections">
 *     <ui-tab [value]="0">Onglet 1</ui-tab>
 *     <ui-tab [value]="1">Onglet 2</ui-tab>
 *   </ui-tab-list>
 *   <ui-tab-panels>
 *     <ui-tab-panel [value]="0">Contenu 1…</ui-tab-panel>
 *     <ui-tab-panel [value]="1">Contenu 2…</ui-tab-panel>
 *   </ui-tab-panels>
 * </ui-tabs>
 * ```
 */
@Component({
  selector: 'ui-tabs',
  template: '<ng-content />',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    :host(._vertical) {
      flex-direction: row;
      align-items: flex-start;
    }
  `,
  host: {
    class: 'ui-tabs',
    '[class._vertical]': "orientation() === 'vertical'",
  },
})
export class UiTabs {
  /** Value of the active tab (two-way). `undefined` = no active tab. */
  value = model<UiTabValue | undefined>(undefined);
  /** Layout axis: `horizontal` (list on top) or `vertical` (list on the side). */
  orientation = input<UiTabsOrientation>('horizontal');
  /** Enable overflow scrolling of the tab list with prev/next navigators. */
  scrollable = input(false, { transform: booleanAttribute });
  /** Group default: render an inactive tab's panel only once it is first activated. */
  lazy = input(false, { transform: booleanAttribute });
  /** Activate a tab as soon as it receives keyboard focus (automatic activation). */
  selectOnFocus = input(false, { transform: booleanAttribute });
  /** Show the prev/next navigators when `scrollable` (they still gate on overflow). */
  showNavigators = input(true, { transform: booleanAttribute });
  /** Animate the active indicator and panel transitions (reduced-motion always wins). */
  motion = input(true, { transform: booleanAttribute });
  /** Tabindex applied to the active tab (the group's single tab stop). */
  tabindex = input(0, { transform: numberAttribute });

  /** Fired whenever the active tab changes (user click / keyboard / focus). */
  tabChange = output<UiTabsChangeEvent>();

  /** @ignore Unique id root for aria wiring between tabs and panels. */
  readonly id = `ui-tabs-${nextUid++}`;

  /** @ignore All tabs projected under this container (across the list boundary). */
  private readonly tabs = contentChildren(forwardRef(() => UiTab), { descendants: true });

  /** @ignore id of the tab button for a given value. */
  tabId(value: UiTabValue): string {
    return `${this.id}-tab-${value}`;
  }
  /** @ignore id of the panel for a given value. */
  panelId(value: UiTabValue): string {
    return `${this.id}-panel-${value}`;
  }

  /** @ignore Whether the given value is the active tab. */
  isActive(value: UiTabValue): boolean {
    return this.value() === value;
  }

  /**
   * @ignore Value that owns the group's single tab stop (roving tabindex):
   * the active tab, or the first enabled tab when none is active.
   */
  readonly tabStopValue = computed<UiTabValue | undefined>(() => {
    const enabled = this.tabs().filter((t) => !t.disabled());
    if (!enabled.length) return undefined;
    const active = enabled.find((t) => t.value() === this.value());
    return (active ?? enabled[0]).value();
  });

  /** @ignore Activate a tab (no-op if already active); emits `tabChange`. */
  updateValue(value: UiTabValue, event: Event): void {
    if (this.value() === value) return;
    this.value.set(value);
    this.tabChange.emit({ value, originalEvent: event });
  }
}
