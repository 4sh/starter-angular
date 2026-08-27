import {
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { CdkConnectedOverlay, ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiMotion } from '@4sh/ui-kit/motion';
import { closeOnNavigation } from '@4sh/ui-kit/overlay';

/** Density: `default`, or `small` for compact toolbars/popups. */
export type SwatchPickerSize = 'default' | 'small';

/** One selectable color entry. */
export interface UiSwatch {
  /** Stable identifier, also the value carried by `value`/`swatchSelect`. */
  key: string;
  /** CSS variable rendering the swatch (e.g. `--primitives-red-500`). */
  cssVar: string;
  /** Accessible name (never just the color: sighted/non-sighted parity). */
  label: string;
}

/** A labeled section of the grid (rendered as consecutive cells, same columns). */
export interface UiSwatchGroup {
  /** Section label (rendered for screen readers via `aria-label` on the group). */
  label: string;
  /** Swatches of the section, in row-major (left-to-right, top-to-bottom) order. */
  swatches: UiSwatch[];
}

/** @ignore Internal flat entry (real swatch, or the synthetic "no color" one). */
interface FlatSwatch {
  key: string | null;
  cssVar: string | null;
  label: string;
}

/** Hue columns of the default palette, dark → light rows. */
const DEFAULT_HUES: { key: string; label: string }[] = [
  { key: 'primary', label: 'Primaire' },
  { key: 'secondary', label: 'Secondaire' },
  { key: 'green', label: 'Vert' },
  { key: 'orange', label: 'Orange' },
  { key: 'red', label: 'Rouge' },
  { key: 'slate', label: 'Ardoise' },
  { key: 'grey', label: 'Gris' },
];
const DEFAULT_STEPS = [900, 700, 500, 300, 100];

/**
 * Default palette: a 7×5 grid (7 hues × 5 shades, dark → light) derived from
 * the `primitives.*` tokens, plus `black`/`white`. Never hardcode a hex here —
 * every swatch is a semantic pointer to a `--primitives-*` CSS variable, so a
 * brand rebind (Brand 2 / Brand 3) changes what the grid shows for free.
 */
export const DEFAULT_SWATCH_PALETTE: UiSwatchGroup[] = [
  {
    label: 'Couleurs',
    swatches: [
      ...DEFAULT_STEPS.flatMap((step) =>
        DEFAULT_HUES.map(
          (hue): UiSwatch => ({
            key: `${hue.key}-${step}`,
            cssVar: `--primitives-${hue.key}-${step}`,
            label: `${hue.label} ${step}`,
          }),
        ),
      ),
      { key: 'black', cssVar: '--primitives-black-base', label: 'Noir' },
      { key: 'white', cssVar: '--primitives-white-base', label: 'Blanc' },
    ],
  },
];

/** Number of columns of the grid — tuned to the default 7-hue palette; a
 * custom palette wraps onto the same column count. */
const GRID_COLUMNS = 7;

/** Trigger ↔ panel gap — keep aligned with `$overlay-panel-offset` (ui-config). */
const OVERLAY_OFFSET = 8;

/** Process-wide counter for unique picker ids (aria wiring). */
let nextUid = 0;

/**
 * ui-swatch-picker — headless color grid, static or popup, for a single-value
 * choice among a `UiSwatchGroup[]` palette (see {@link DEFAULT_SWATCH_PALETTE}).
 *
 * No trigger button of its own — same composition contract as {@link UiMenu}:
 * a caller wires its own `ui-button` to `toggle(event)` / `show(event)` and
 * reads the selection from `value` (two-way) or `swatchSelect`. Reuses
 * `ui-menu`'s overlay mechanics (`CdkConnectedOverlay`, auto-flip, scroll
 * re-position) and the shared `overlay-panel` shell.
 *
 * Every swatch is a real `<button>` (`role="option"`, `aria-selected`) inside
 * a `role="listbox"`; 2D roving-tabindex keyboard navigation (arrows,
 * Home/End) mirrors `ui-menu`'s roving focus, adapted to a grid.
 */
@Component({
  selector: 'ui-swatch-picker',
  imports: [NgTemplateOutlet, OverlayModule, UiIcon, UiMotion],
  templateUrl: './ui-swatch-picker.html',
  styleUrl: './ui-swatch-picker.scss',
  host: {
    '[style.display]': "popup() ? 'contents' : 'block'",
  },
})
export class UiSwatchPicker {
  /** Palette rendered as sections of swatches (see {@link UiSwatchGroup}). */
  palette = input<UiSwatchGroup[]>(DEFAULT_SWATCH_PALETTE);
  /** Selected swatch `key` (two-way bindable), or `null` for "no color". */
  value = model<string | null>(null);
  /** Popup mode: the panel opens in an overlay via `toggle(event)` / `show(event)`. */
  popup = input(false, { transform: booleanAttribute });
  /** Density: `default`, or `small` for compact toolbars/popups. */
  size = input<SwatchPickerSize>('small');
  /** Renders a "no color" swatch at the start of the grid, emitting `null`. */
  allowClear = input(true, { transform: booleanAttribute });
  /** Accessible name of the grid (`aria-label` on `role="listbox"`). */
  ariaLabel = input<string>();

  /** Emitted on user selection (`null` when the "no color" swatch is picked). */
  swatchSelect = output<UiSwatch | null>();
  /** Emitted when the popup opens. */
  opened = output<void>();
  /** Emitted when the popup closes. */
  closed = output<void>();

  /** @ignore Panel root (overlay or inline) — keyboard focus queries. */
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');
  /** @ignore The popup's overlay (repositioning on scroll). */
  private readonly connectedOverlay = viewChild(CdkConnectedOverlay);
  /** @ignore */
  private readonly doc = inject(DOCUMENT);

  /** Unique id of the panel (public: wire the trigger's `aria-controls` to it). */
  readonly uid = `ui-swatch-picker-${nextUid++}`;
  /** @ignore Popup open state. */
  protected readonly popupOpen = signal(false);
  /** @ignore Element the overlay is anchored to (the `toggle(event)` trigger). */
  protected readonly overlayOrigin = signal<Element | null>(null);
  /** @ignore Key of the swatch owning the roving tabindex (`''` = the clear
   * swatch, `undefined` = nothing focused yet). */
  private readonly focusedKey = signal<string | undefined>(undefined);

  constructor() {
    // A picker declared in an app shell outlives the routed view: dismiss it
    // rather than carrying it over to the next page.
    closeOnNavigation(() => this.hide());

    // Keep the floating panel GLUED to its scrolling anchor: while the popup
    // is open, re-apply the overlay position on any scroll (the CDK
    // reposition scroll strategy proved unreliable in zoneless contexts).
    effect((onCleanup) => {
      if (!this.popupOpen() || typeof window === 'undefined') return;
      const handler = () =>
        setTimeout(() => {
          // The trigger can be gone while the picker lives on: re-positioning
          // on a detached origin measures 0×0 and snaps to the top-left corner.
          if (this.overlayOrigin()?.isConnected === false) {
            this.hide();
            return;
          }
          this.overlayRef()?.updatePosition();
        });
      this.doc.addEventListener('scroll', handler, { capture: true, passive: true });
      onCleanup(() => this.doc.removeEventListener('scroll', handler, true));
    });
  }

  /** @ignore */
  private overlayRef() {
    return this.connectedOverlay()?.overlayRef;
  }

  /** @ignore Below the trigger, flipping above when space is lacking. */
  protected readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: OVERLAY_OFFSET,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -OVERLAY_OFFSET,
    },
  ];

  /** @ignore Flat, render-ready swatch list (the synthetic "no color" one first). */
  protected readonly flatSwatches = computed<FlatSwatch[]>(() => {
    const list: FlatSwatch[] = [];
    if (this.allowClear()) list.push({ key: null, cssVar: null, label: 'Aucune couleur' });
    for (const group of this.palette()) {
      for (const swatch of group.swatches) list.push(swatch);
    }
    return list;
  });

  /** @ignore Keys of the focusable entries, in grid order (roving focus path). Uses `''` as the clear swatch's key (`null` is reserved for "nothing focused"). */
  private readonly focusableKeys = computed<string[]>(() =>
    this.flatSwatches().map((s) => s.key ?? ''),
  );

  /** @ignore Key owning the tab stop: last focused, else the selected value, else first. */
  protected readonly tabStopKey = computed<string | null>(() => {
    const keys = this.focusableKeys();
    if (!keys.length) return null;
    const focused = this.focusedKey();
    if (focused !== undefined && keys.includes(focused ?? '')) return focused ?? '';
    const selected = this.value() ?? '';
    return keys.includes(selected) ? selected : keys[0];
  });

  /** @ignore */
  protected readonly panelClasses = computed(() => {
    const c = ['ui-swatch-picker'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.popup()) c.push('_popup');
    return c.join(' ');
  });

  // --- Popup ------------------------------------------------------------

  /** Toggles the popup relative to the event's `currentTarget`. */
  toggle(event: Event): void {
    this.popupOpen() ? this.hide() : this.show(event);
  }

  /** Opens the popup anchored to the event's `currentTarget`. */
  show(event: Event): void {
    if (!this.popup() || this.popupOpen()) return;
    this.overlayOrigin.set((event.currentTarget ?? event.target) as Element);
    this.popupOpen.set(true);
    this.opened.emit();
    this.queueFocusTabStop();
  }

  /** Closes the popup. */
  hide(focusTrigger = false): void {
    if (!this.popupOpen()) return;
    this.popupOpen.set(false);
    this.focusedKey.set(undefined);
    this.closed.emit();
    if (focusTrigger) (this.overlayOrigin() as HTMLElement | null)?.focus?.();
  }

  // --- Interactions -------------------------------------------------------

  /** @ignore Swatch key used as `data-key` / DOM id (empty string for "no color"). */
  protected swatchKey(swatch: FlatSwatch): string {
    return swatch.key ?? '';
  }

  /** @ignore Selection state of a swatch. */
  protected isSelected(swatch: FlatSwatch): boolean {
    return this.value() === swatch.key;
  }

  /** @ignore Activation (click / Enter / Space): select, emit, popup auto-close. */
  protected onSwatchClick(swatch: FlatSwatch): void {
    this.focusedKey.set(swatch.key ?? '');
    this.value.set(swatch.key);
    this.swatchSelect.emit(
      swatch.key === null || swatch.cssVar === null
        ? null
        : { key: swatch.key, cssVar: swatch.cssVar, label: swatch.label },
    );
    if (this.popup()) this.hide(true);
  }

  /** @ignore */
  protected onSwatchFocus(swatch: FlatSwatch): void {
    this.focusedKey.set(swatch.key ?? '');
  }

  /** @ignore 2D roving keyboard navigation (arrow grid, Home/End). */
  protected onGridKeydown(event: KeyboardEvent): void {
    const keys = this.focusableKeys();
    if (!keys.length) return;
    const currentKey = this.currentFocusKey(event);
    const index = currentKey !== null ? keys.indexOf(currentKey) : -1;
    const columns = Math.min(GRID_COLUMNS, keys.length);

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.focusByKey(keys[Math.min(index + 1, keys.length - 1)]);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.focusByKey(keys[Math.max(index - 1, 0)]);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusByKey(keys[Math.min(index + columns, keys.length - 1)]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusByKey(keys[Math.max(index - columns, 0)]);
        break;
      case 'Home':
        event.preventDefault();
        this.focusByKey(keys[0]);
        break;
      case 'End':
        event.preventDefault();
        this.focusByKey(keys[keys.length - 1]);
        break;
      case 'Escape':
        if (this.popup()) {
          event.preventDefault();
          this.hide(true);
        }
        break;
    }
  }

  /** @ignore Popup outside interaction. */
  protected onPopupOutsideClick(): void {
    this.hide();
  }

  // --- Internals ----------------------------------------------------------

  /** @ignore Key of the entry currently holding DOM focus. */
  private currentFocusKey(event: KeyboardEvent): string | null {
    const el = (event.target as HTMLElement).closest?.('[data-key]');
    return el?.getAttribute('data-key') ?? this.focusedKey() ?? null;
  }

  /** @ignore Move DOM focus (and the tab stop) to the entry with the given key. */
  private focusByKey(key: string | undefined): void {
    if (key === undefined) return;
    this.focusedKey.set(key);
    this.panelEl()
      ?.nativeElement.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)
      ?.focus();
  }

  /** @ignore Focus the roving tab stop once the panel is rendered
   * (macrotask, not rAF: rAF never fires in throttled/background tabs). */
  private queueFocusTabStop(): void {
    setTimeout(() => this.focusByKey(this.tabStopKey() ?? undefined));
  }
}
