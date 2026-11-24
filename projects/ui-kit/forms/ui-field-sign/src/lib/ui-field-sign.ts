import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  isDevMode,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField, type FieldLevel, warnMissingAccessibleName } from '@4sh/ui-kit/forms';
import { UiField } from '@4sh/ui-kit/forms/ui-field';
import { UiIcon, type UiIconSize } from '@4sh/ui-kit/base/ui-icon';
import {
  containRect,
  IMAGE_DATA_URL,
  type SignPoint,
  type SignRect,
  type SignStroke,
  type SignSvgDrawing,
  strokesBounds,
  strokesToSvg,
  svgToDataUrl,
  traceStroke,
  unionRect,
} from './ui-field-sign-strokes';
import { readSignSvg } from './ui-field-sign-svg';

/** Image format of the emitted value. */
export type FieldSignFormat = 'png' | 'svg';

/** Value carried by the field: a data URL, or `null` while nothing is signed. */
export type FieldSignValue = string | null;

/**
 * Resolution of a PNG export, relative to the drawing frame: crisp on a high-density screen
 * and in print, and the same on every device — the device pixel ratio is a property of the
 * screen the person signed on, not of the document the signature ends up in.
 */
const PNG_EXPORT_SCALE = 2;

/** Ink width used when the custom property cannot be read (no layout: SSR, tests). */
const FALLBACK_INK_WIDTH = 2;

/**
 * Colour a probe inherits when `exportColor` does not resolve (a `var()` with no value): an
 * unlikely `rgb()` that tells "unresolved" apart from a genuine black.
 */
const UNRESOLVED_COLOR = 'rgb(1, 2, 3)';

/** Where drawing space sits in the box: `box = drawing × scale + (x, y)`. */
interface SignView {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
}

/** A previous signature received from the form, kept underneath the new strokes. */
interface SignBackground {
  readonly src: string;
  /** `null` until the image has loaded — it is drawn from then on. */
  readonly image: HTMLImageElement | null;
}

/** Everything `clear()` wipes, kept so that `undo()` can bring it back. */
interface SignSnapshot {
  readonly strokes: readonly SignStroke[];
  readonly background: SignBackground | null;
  readonly region: SignRect | null;
  readonly unreadable: string | null;
}

/**
 * ui-field-sign — handwritten signature field on the `ui-field` shell (label + box +
 * helper). **The box is the drawing area**: finger, stylus or mouse, through Pointer
 * Events, on a `<canvas>`.
 *
 * Four choices shape it:
 *
 * 1. **The value is an image, emitted once a stroke ends** — a data URL (`format`: PNG or
 *    SVG), `null` when empty, so `required` works as is. Never mid-stroke: a form bound to
 *    an autosave would otherwise receive an image per pointer move.
 * 2. **The screen and the export use two inks.** On screen the ink follows the tokens, dark
 *    theme included; the export is painted with `exportColor` on a transparent background.
 *    A signature drawn in dark mode would otherwise come out white — invisible on the PDF it
 *    is meant for.
 * 3. **What is on screen is what is exported.** The box at the first stroke is the
 *    signature's region; the exported frame is that region grown to every stroke. A resized
 *    box (a phone rotated) refits the frame, scaled and centred — and a stroke drawn in the
 *    room this leaves around it grows the frame instead of falling outside the value. Points
 *    are clamped to the box: nothing drawn can be invisible, nothing visible can be lost.
 * 4. **The page does not scroll under the pen.** `touch-action: none` on the drawing area,
 *    pointer capture for the whole stroke.
 *
 * A value written by the form must be an image data URL — what this field emits. It is shown
 * in the box and kept underneath any new stroke until cleared; on screen it is redrawn as a
 * silhouette in the current ink, so that a black signature stays legible on a dark field.
 *
 * Standalone, `[(ngModel)]`, reactive forms or Signal Forms (ControlValueAccessor via
 * BaseFormField).
 */
@Component({
  selector: 'ui-field-sign',
  imports: [UiField, UiIcon],
  templateUrl: './ui-field-sign.html',
  styleUrl: './ui-field-sign.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiFieldSign), multi: true },
  ],
})
export class UiFieldSign extends BaseFormField<FieldSignValue> {
  /**
   * Ink colour of the **export**: any CSS colour, `var(--token)` included — resolved to
   * `rgb()` where the field sits. `black` when it is not a colour or does not resolve. The
   * screen ink follows the tokens.
   */
  exportColor = input<string>('black');
  /** Image format of the emitted data URL. */
  format = input<FieldSignFormat>('png');
  /** Hint shown in the empty box. */
  placeholder = input<string>('Signez ici');
  /** Renders the button that clears the signature. */
  clearable = input(true, { transform: booleanAttribute });
  /** Accessible name of the clear button. */
  clearAriaLabel = input<string>('Effacer la signature');
  /** State announced once the box holds a signature (the placeholder is announced while empty). */
  signedLabel = input<string>('Signature saisie');
  /** Announced after the state when the field is `required` (the visual `*` is hidden from assistive tech). */
  requiredLabel = input<string>('obligatoire');
  /** Shown and announced in place of a signature from the form that cannot be loaded. */
  unreadableLabel = input<string>('Signature illisible');

  /** Emitted when a stroke ends, and when the signature is cleared or undone — never mid-stroke. */
  valueChange = output<FieldSignValue>();
  /** Emitted when the drawing area receives focus. */
  padFocus = output<FocusEvent>();
  /** Emitted when the drawing area loses focus. */
  padBlur = output<FocusEvent>();
  /**
   * Emitted when the signature written by the form cannot be loaded. The field shows it as
   * unreadable (`unreadableLabel`, error level) and keeps it as its value until it is
   * cleared or signed over — it never drops what it could not read on its own.
   */
  imageError = output<Event>();

  /** @ignore */
  private readonly canvasEl = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasEl');
  /** @ignore */
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** @ignore */
  private readonly document = inject(DOCUMENT);

  /** @ignore Finished strokes, oldest first, in drawing space — `undo()` pops from the end. */
  protected readonly strokes = signal<readonly SignStroke[]>([]);
  /** @ignore A value received from the form, drawn underneath the strokes. */
  protected readonly background = signal<SignBackground | null>(null);
  /** @ignore A stroke is in progress. */
  protected readonly drawing = signal(false);
  /**
   * @ignore The value received from the form, when it could not be loaded: still the field's
   * value until cleared or signed over, shown as unreadable meanwhile.
   */
  protected readonly unreadable = signal<string | null>(null);

  /** @ignore Nothing signed: no stroke, no previous signature, no stroke under way. */
  protected readonly isEmpty = computed(
    () => this.strokes().length === 0 && !this.background() && !this.drawing(),
  );
  /** @ignore An unreadable value is all the field holds: no stroke drawn over it yet. */
  protected readonly showUnreadable = computed(
    () => this.unreadable() !== null && this.strokes().length === 0 && !this.drawing(),
  );
  /** @ignore Something to clear: a signature, or an unreadable value. */
  protected readonly canClear = computed(() => !this.isEmpty() || this.showUnreadable());
  /** @ignore The shell's level: `error` while an unreadable value stands. */
  protected readonly fieldLevel = computed<FieldLevel>(() =>
    this.showUnreadable() ? 'error' : this.effectiveLevel(),
  );
  /** @ignore */
  protected readonly isInteractive = computed(() => !this.isDisabled() && !this.readonly());
  /** @ignore */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));
  /** @ignore */
  protected readonly statusId = computed(() => `${this.resolvedId()}-status`);
  /** @ignore The state, then "required" — `role="img"` takes no `aria-required`. */
  protected readonly statusText = computed(() => {
    const state = this.showUnreadable()
      ? this.unreadableLabel()
      : this.isEmpty()
        ? this.placeholder()
        : this.signedLabel();
    return this.required() && this.requiredLabel() ? `${state}, ${this.requiredLabel()}` : state;
  });
  /** @ignore The state first, then the helper/error message when one is rendered. */
  protected readonly describedByIds = computed(() =>
    [this.statusId(), this.displayMessage() ? this.messageId() : null].filter(Boolean).join(' '),
  );

  /**
   * @ignore The box at the first stroke: where the previous signature is fitted, and the
   * smallest frame the export can have. `null` until a stroke (the box stands in).
   */
  private region: SignRect | null = null;
  /** @ignore Drawing space → box. Changes on resize only, never under the pen. */
  private view: SignView = { scale: 1, x: 0, y: 0 };
  /** @ignore What the last `clear()` removed, for `undo()`. */
  private cleared: SignSnapshot | null = null;
  /** @ignore The stroke under the pen — plain array, mutated per pointer move. */
  private current: SignPoint[] | null = null;
  /** @ignore Pointer that owns {@link current}: a second finger does not draw. */
  private activePointerId: number | null = null;
  /** @ignore Drawing area at stroke start, so a move does not force a layout. */
  private padRect: DOMRect | null = null;
  /** @ignore Size of the drawing area, in CSS pixels, as last observed. */
  private boxWidth = 0;
  private boxHeight = 0;
  /** @ignore `undefined` = not asked yet; `null` = no 2D canvas here (tests, old engines). */
  private context: CanvasRenderingContext2D | null | undefined;
  /** @ignore Previous signature recoloured in the screen ink, rebuilt only when its inputs change. */
  private silhouette: {
    image: HTMLImageElement;
    color: string;
    key: string;
    canvas: HTMLCanvasElement;
  } | null = null;
  /** @ignore Last value this field emitted — see {@link writeValue}. */
  private lastEmitted: FieldSignValue | undefined;
  /** @ignore A stroke ended while the previous signature was still loading (PNG export). */
  private commitPending = false;
  /**
   * @ignore The last value emitted embeds a previous signature not loaded yet (SVG export):
   * should it turn out unreadable, the value is emitted again without it.
   */
  private embedsUnloaded = false;
  /** @ignore The box was resized under the pen: the view is refitted once the stroke ends. */
  private viewStale = false;
  /** @ignore Half the ink width, in box pixels, at stroke start — how far points stay from the edge. */
  private edgeMargin = 0;
  /** @ignore The previous signature read back as one of this field's exports, per source. */
  private readBack: { src: string; drawing: SignSvgDrawing | null } | null = null;
  /** @ignore */
  private animationFrame: number | null = null;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);

    // Anything that changes the picture: strokes, previous signature, disabled ink.
    effect(() => {
      this.strokes();
      this.background();
      this.isDisabled();
      this.scheduleRedraw();
    });

    // Disabled or made read-only under the pen (a form disabled by an autosave): the stroke
    // is dropped, not committed — the field no longer accepts input.
    effect(() => {
      if (!this.isInteractive()) untracked(() => this.abandonStroke());
    });

    afterNextRender(() => {
      if (!this.label() && !this.ariaLabel() && !this.ariaLabelledBy()) {
        warnMissingAccessibleName(
          'ui-field-sign',
          'No accessible name: provide `label`, `ariaLabel` or `ariaLabelledBy`.',
        );
      }
      const canvas = this.canvasEl().nativeElement;
      this.measure();

      if (typeof ResizeObserver !== 'undefined') {
        const resize = new ResizeObserver(() => {
          this.measure();
          this.redraw();
        });
        resize.observe(canvas);
        destroyRef.onDestroy(() => resize.disconnect());
      }

      // The screen ink is a token: a theme or brand switch on <html> repaints it.
      if (typeof MutationObserver !== 'undefined') {
        const theme = new MutationObserver(() => this.scheduleRedraw());
        theme.observe(this.document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme', 'data-brand', 'class', 'style'],
        });
        destroyRef.onDestroy(() => theme.disconnect());
      }
      this.redraw();
    });

    destroyRef.onDestroy(() => {
      if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    });
  }

  override writeValue(value: FieldSignValue): void {
    let next = value || null;
    if (next && !IMAGE_DATA_URL.test(next)) {
      if (isDevMode()) {
        console.warn(
          '[ui-field-sign] Ignored a value that is not an image data URL: convert a remote ' +
            'signature to a data URL before handing it to the field.',
        );
      }
      next = null;
    }
    super.writeValue(next);
    // A form writing back the very value the field just emitted (`control.setValue(
    // control.value)`, a `patchValue` of the whole form…) must not flatten the strokes into a
    // background: `undo()` would lose its history.
    if (next !== null && next === this.lastEmitted) return;
    this.lastEmitted = undefined;
    this.current = null;
    this.activePointerId = null;
    this.commitPending = false;
    this.embedsUnloaded = false;
    this.cleared = null;
    this.viewStale = false;
    this.setRegion(null);
    this.drawing.set(false);
    this.unreadable.set(null);
    this.strokes.set([]);
    this.background.set(next ? { src: next, image: null } : null);
    if (next) this.loadBackground(next);
  }

  /** Removes the whole signature, previous one included, and emits `null`. `undo()` brings it back. */
  clear(): void {
    // Not under the pen: emptying mid-stroke would emit a blank image that `required` takes
    // for a signature.
    if (!this.canClear() || this.drawing()) return;
    this.cleared = {
      strokes: this.strokes(),
      background: this.background(),
      region: this.region,
      unreadable: this.unreadable(),
    };
    this.setRegion(null);
    this.strokes.set([]);
    this.background.set(null);
    this.unreadable.set(null);
    this.commit();
  }

  /**
   * Removes the last stroke drawn in this field; with none left, brings back what the last
   * `clear()` removed. A signature received from the form is not a stroke: only `clear()`
   * removes it.
   */
  undo(): void {
    if (this.drawing()) return;
    if (this.strokes().length > 0) {
      this.strokes.update((s) => s.slice(0, -1));
    } else if (this.cleared) {
      const { strokes, background, region, unreadable } = this.cleared;
      this.cleared = null;
      this.setRegion(region);
      this.strokes.set(strokes);
      this.background.set(background);
      this.unreadable.set(unreadable);
      // Cleared before it had loaded: its `onload` was dropped meanwhile, ask again.
      if (background && !background.image) this.loadBackground(background.src);
    } else {
      return;
    }
    if (this.strokes().length === 0 && !this.background()) this.setRegion(null);
    this.commit();
  }

  /** @ignore Drops the stroke under the pen, if any, without committing it. */
  private abandonStroke(): void {
    if (!this.current) return;
    const canvas = this.canvasEl().nativeElement;
    const pointerId = this.activePointerId;
    this.current = null;
    this.activePointerId = null;
    this.padRect = null;
    this.drawing.set(false);
    if (pointerId !== null && canvas.hasPointerCapture?.(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }
    // A first stroke abandoned leaves nothing: the region it set goes with it, as on undo.
    if (this.strokes().length === 0 && !this.background()) this.setRegion(null);
    this.refitIfStale();
    this.scheduleRedraw();
  }

  /** Focuses the drawing area. */
  focus(options?: FocusOptions): void {
    this.canvasEl().nativeElement.focus(options);
  }

  /**
   * Whether the field holds a signature — an unreadable one included, it is still the value.
   * A stroke under way does not count until it ends.
   */
  hasSignature(): boolean {
    return this.strokes().length > 0 || !!this.background() || this.unreadable() !== null;
  }

  /** @ignore */
  protected override uidPrefix(): string {
    return 'ui-field-sign';
  }

  // --- Pointer ---------------------------------------------------------

  /** @ignore */
  protected onPointerDown(event: PointerEvent): void {
    if (!this.isInteractive() || this.activePointerId !== null) return;
    // Main button only: a mouse right-click, or a stylus eraser (button 5), does not draw.
    if (event.button !== 0) return;
    const canvas = this.canvasEl().nativeElement;
    // No text selection, no synthetic mouse events — which also means no native focus:
    // given back right below.
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture?.(event.pointerId);

    if (!this.region) this.setRegion(this.boxRect());
    this.edgeMargin = (this.inkWidth() / 2) * this.view.scale;
    this.activePointerId = event.pointerId;
    this.padRect = canvas.getBoundingClientRect();
    this.current = [this.toPoint(event)];
    this.drawing.set(true);
    this.scheduleRedraw();
  }

  /** @ignore */
  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId || !this.current) return;
    if (this.dropIfLocked()) return;
    // Coalesced events: a fast stroke is sampled at the device rate, not the frame rate.
    const samples = event.getCoalescedEvents?.() ?? [];
    for (const sample of samples.length ? samples : [event]) {
      this.current.push(this.toPoint(sample));
    }
    this.scheduleRedraw();
  }

  /** @ignore `pointerup`, `pointercancel` and a lost capture alike: what was drawn is kept. */
  protected onPointerEnd(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId || !this.current) return;
    if (this.dropIfLocked()) return;
    const stroke = this.current;
    this.current = null;
    this.activePointerId = null;
    this.padRect = null;
    this.drawing.set(false);
    this.strokes.update((s) => [...s, stroke]);
    this.refitIfStale();
    this.commit();
  }

  /**
   * @ignore Disabled or made read-only under the pen: the stroke is dropped. Checked on the
   * pointer events themselves — the effect that does the same only runs at the next change
   * detection, and a `pointerup` may land before it.
   */
  private dropIfLocked(): boolean {
    if (this.isInteractive()) return false;
    this.abandonStroke();
    return true;
  }

  /** @ignore Refits the view the box changed size for while a stroke was drawn. */
  private refitIfStale(): void {
    if (!this.viewStale) return;
    this.viewStale = false;
    this.fitView();
  }

  // --- Keyboard / focus ------------------------------------------------

  /** @ignore `Backspace` / `Ctrl`+`Z` undo, `Delete` clears (undoable too). */
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.isInteractive()) return;
    const undoChord =
      (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z';
    if (event.key === 'Backspace' || undoChord) {
      event.preventDefault();
      this.undo();
    } else if (event.key === 'Delete') {
      event.preventDefault();
      this.clear();
    }
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.padBlur.emit(event);
  }

  /** @ignore The clear button hands focus back to the drawing area it just emptied. */
  protected onClearClick(): void {
    this.clear();
    this.focus();
  }

  // --- Value -------------------------------------------------------------

  /** @ignore Current picture → value, pushed to the form and to `valueChange`. */
  private commit(): void {
    const bg = this.background();
    let value: FieldSignValue;
    if (this.showUnreadable()) {
      // An unreadable value stands until something is drawn over it: undoing that stroke
      // brings the form's value back, not `null`.
      value = this.unreadable();
    } else if (this.strokes().length === 0) {
      // Nothing drawn over the previous signature (a clear undone, the last stroke undone):
      // the value received, word for word — not re-exported, which would change it.
      value = bg?.src ?? null;
    } else if (this.format() === 'png' && bg && !bg.image) {
      // A PNG export paints the previous signature: wait for it rather than drop it.
      this.commitPending = true;
      return;
    } else {
      value = this.export();
    }
    this.commitPending = false;
    // An SVG export carries the previous signature by reference, loaded or not: should it
    // turn out unreadable, the value is emitted again without it.
    this.embedsUnloaded = this.strokes().length > 0 && !!bg && !bg.image;
    this.lastEmitted = value;
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);
  }

  /** @ignore */
  private export(): string {
    const lineWidth = this.inkWidth();
    const color = this.resolveExportColor();
    if (this.format() === 'png') {
      const png = this.exportPng(color, lineWidth);
      if (png) return png;
      // No 2D canvas here, or a canvas the browser refuses to read back: SVG needs neither.
    }
    const bg = this.background();
    return svgToDataUrl(
      strokesToSvg(this.strokes(), {
        frame: this.frame(lineWidth),
        color,
        lineWidth,
        background: bg
          ? { href: bg.src, rect: this.backgroundSlot(), drawing: this.readBackground(bg.src) }
          : null,
      }),
    );
  }

  /**
   * @ignore The previous signature as one of this field's own SVG exports, read once per
   * value. Never throws: on the commit path, a value it cannot read is kept as an image.
   */
  private readBackground(src: string): SignSvgDrawing | null {
    if (this.readBack?.src !== src) {
      let drawing: SignSvgDrawing | null;
      try {
        drawing = readSignSvg(src);
      } catch {
        drawing = null;
      }
      this.readBack = { src, drawing };
    }
    return this.readBack.drawing;
  }

  /** @ignore Repaints on a detached canvas, in the export ink and without the tint. */
  private exportPng(color: string, lineWidth: number): string | null {
    const frame = this.frame(lineWidth);
    if (frame.width <= 0 || frame.height <= 0) return null;
    const canvas = this.document.createElement('canvas');
    canvas.width = Math.round(frame.width * PNG_EXPORT_SCALE);
    canvas.height = Math.round(frame.height * PNG_EXPORT_SCALE);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(PNG_EXPORT_SCALE, PNG_EXPORT_SCALE);
    ctx.translate(-frame.x, -frame.y);
    const image = this.background()?.image;
    if (image) {
      const slot = this.backgroundSlot();
      const r = containRect(image.naturalWidth, image.naturalHeight, slot.width, slot.height);
      ctx.drawImage(image, slot.x + r.x, slot.y + r.y, r.width, r.height);
    }
    this.paintStrokes(ctx, this.strokes(), color, lineWidth);
    try {
      const png = canvas.toDataURL('image/png');
      // A canvas past the engine's size limit gives `data:,` (iOS) instead of throwing.
      return png.startsWith('data:image/png') ? png : null;
    } catch {
      // A tainted canvas (an SVG previous signature on older WebKit): fall back to SVG
      // rather than leave the form on the old value while the screen shows the new stroke.
      if (isDevMode()) console.warn('[ui-field-sign] PNG export refused: emitting SVG instead.');
      return null;
    }
  }

  /**
   * @ignore `exportColor` resolved where the field sits — a `var(--token)` included — into
   * an `rgb()` an image can carry: a `var()` in an SVG served as an image resolves to nothing,
   * and the stroke would not be painted at all. `black` when the value is not a colour or
   * does not resolve.
   */
  private resolveExportColor(): string {
    const value = this.exportColor();
    const host = this.host.nativeElement;
    if (typeof getComputedStyle === 'undefined' || !host.isConnected) return value || 'black';
    const outer = this.document.createElement('span');
    const probe = this.document.createElement('span');
    outer.style.color = UNRESOLVED_COLOR;
    outer.hidden = true;
    probe.style.color = value;
    const parsed = probe.style.color !== '';
    outer.appendChild(probe);
    host.appendChild(outer);
    const resolved = getComputedStyle(probe).color;
    outer.remove();
    if (parsed && resolved && resolved !== UNRESOLVED_COLOR) return resolved;
    if (isDevMode())
      console.warn(`[ui-field-sign] \`exportColor\` "${value}" is not a colour here: using black.`);
    return 'black';
  }

  /** @ignore */
  private loadBackground(src: string): void {
    if (typeof Image === 'undefined') return;
    const image = new Image();
    image.onload = () => {
      if (this.background()?.src !== src) return;
      this.background.set({ src, image });
      if (this.commitPending) this.commit();
    };
    image.onerror = (event) => {
      if (this.background()?.src !== src) return;
      if (isDevMode()) console.warn('[ui-field-sign] The previous signature could not be loaded.');
      // Shown as unreadable — neither as a signature over a blank box, nor as empty while the
      // form holds a value. The value is left alone: an image this browser cannot decode may
      // be a valid signature elsewhere, and dropping it would lose it silently. Clearing it, or
      // signing over it, is the person's call; `imageError` tells the host.
      this.background.set(null);
      this.unreadable.set(src);
      // Not under the pen: the first stroke's region stays until that stroke ends.
      if (this.strokes().length === 0 && !this.current) this.setRegion(null);
      // A value already out with this image in it (SVG), or held for it (PNG): the strokes
      // replace it, alone — what the screen shows.
      if (this.commitPending || this.embedsUnloaded) this.commit();
      this.imageError.emit(event instanceof Event ? event : new Event('error'));
    };
    image.src = src;
  }

  // --- Geometry ------------------------------------------------------------

  /** @ignore The whole box, in box coordinates. */
  private boxRect(): SignRect {
    return { x: 0, y: 0, width: this.boxWidth, height: this.boxHeight };
  }

  /** @ignore Sets the region and fits the view on it: identity when it is the box itself. */
  private setRegion(region: SignRect | null): void {
    this.region = region;
    this.fitView();
  }

  /**
   * @ignore The exported frame: the region grown to every stroke (half the ink width around
   * them, so round caps are not shaved). The box until a first stroke.
   */
  private frame(lineWidth = this.inkWidth()): SignRect {
    if (!this.region) return this.boxRect();
    return unionRect(this.region, strokesBounds(this.strokes(), lineWidth / 2));
  }

  /** @ignore Where the previous signature is fitted: the region, or the box until a stroke. */
  private backgroundSlot(): SignRect {
    return this.region ?? this.boxRect();
  }

  /** @ignore Fits the frame into the box, scaled and centred. Called on resize, never mid-stroke. */
  private fitView(): void {
    if (!this.region) {
      this.view = { scale: 1, x: 0, y: 0 };
      return;
    }
    const frame = this.frame();
    if (frame.width <= 0 || frame.height <= 0 || this.boxWidth <= 0 || this.boxHeight <= 0) {
      this.view = { scale: 1, x: -frame.x, y: -frame.y };
      return;
    }
    const r = containRect(frame.width, frame.height, this.boxWidth, this.boxHeight);
    const scale = r.width / frame.width;
    this.view = { scale, x: r.x - frame.x * scale, y: r.y - frame.y * scale };
  }

  /**
   * @ignore Pointer position → drawing space, clamped to the box: a captured pointer dragged
   * past the edge draws along it, never somewhere the screen does not show.
   */
  private toPoint(event: PointerEvent): SignPoint {
    const rect = this.padRect;
    const canvas = this.canvasEl().nativeElement;
    // Screen pixels → CSS pixels of the box, should an ancestor scale it.
    const css = rect && rect.width > 0 ? canvas.clientWidth / rect.width || 1 : 1;
    const rawX = rect ? (event.clientX - rect.left) * css : event.offsetX;
    const rawY = rect ? (event.clientY - rect.top) * css : event.offsetY;
    const x = this.clamp(rawX, this.boxWidth);
    const y = this.clamp(rawY, this.boxHeight);
    const { scale, x: dx, y: dy } = this.view;
    return { x: (x - dx) / scale, y: (y - dy) / scale };
  }

  /**
   * @ignore Keeps a coordinate half the ink width inside the box: a stroke along the edge then
   * fits the frame cap included, and the frame does not grow — nor the previous signature
   * shrink — edit after edit.
   */
  private clamp(value: number, size: number): number {
    if (size <= 0) return value;
    const margin = Math.min(this.edgeMargin, size / 2);
    return Math.min(Math.max(value, margin), size - margin);
  }

  /** @ignore Size the bitmap on the CSS box × device pixel ratio, and refit the view. */
  private measure(): void {
    const canvas = this.canvasEl().nativeElement;
    this.boxWidth = canvas.clientWidth;
    this.boxHeight = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(this.boxWidth * ratio));
    canvas.height = Math.max(1, Math.round(this.boxHeight * ratio));
    // Not mid-stroke: the points already drawn would no longer line up with the pen. Refitted
    // once the stroke ends instead.
    if (this.drawing()) {
      this.viewStale = true;
      // The pointer keeps mapping onto the box as it is now.
      this.padRect = canvas.getBoundingClientRect();
    } else {
      this.fitView();
    }
  }

  // --- Rendering -----------------------------------------------------------

  /** @ignore One repaint per frame, however many pointer moves arrive in it. */
  private scheduleRedraw(): void {
    if (this.animationFrame !== null || typeof requestAnimationFrame === 'undefined') return;
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = null;
      this.redraw();
    });
  }

  /** @ignore */
  private redraw(): void {
    const ctx = this.ctx();
    if (!ctx) return;
    const canvas = ctx.canvas;
    const ratio = this.boxWidth > 0 ? canvas.width / this.boxWidth : 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Everything below is drawn in drawing space.
    const k = ratio * this.view.scale;
    ctx.setTransform(k, 0, 0, k, ratio * this.view.x, ratio * this.view.y);

    const color = this.inkColor();
    const image = this.background()?.image;
    if (image) this.paintSilhouette(ctx, image, color, k);
    const strokes = this.current ? [...this.strokes(), this.current] : this.strokes();
    this.paintStrokes(ctx, strokes, color, this.inkWidth());
  }

  /** @ignore */
  private paintStrokes(
    ctx: CanvasRenderingContext2D,
    strokes: readonly SignStroke[],
    color: string,
    lineWidth: number,
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of strokes) {
      ctx.beginPath();
      traceStroke(ctx, stroke);
      ctx.stroke();
    }
  }

  /**
   * @ignore The previous signature, recoloured in the screen ink: drawn on a scratch canvas,
   * then `source-in` keeps its shape and replaces its colour. A black export stays legible on
   * a dark field this way. The scratch canvas is cached — rebuilt only when the image (by
   * identity: each value gets its own element), the ink or the pixel size changes, never per
   * frame while a stroke is drawn over it.
   */
  private paintSilhouette(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    color: string,
    pixelScale: number,
  ): void {
    const slot = this.backgroundSlot();
    const key = `${slot.width}x${slot.height}@${pixelScale}`;
    const cached = this.silhouette;
    if (cached?.image !== image || cached.color !== color || cached.key !== key) {
      const scratch = this.document.createElement('canvas');
      scratch.width = Math.max(1, Math.round(slot.width * pixelScale));
      scratch.height = Math.max(1, Math.round(slot.height * pixelScale));
      const s = scratch.getContext('2d');
      if (!s) return;
      const r = containRect(image.naturalWidth, image.naturalHeight, slot.width, slot.height);
      s.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
      s.drawImage(image, r.x, r.y, r.width, r.height);
      s.globalCompositeOperation = 'source-in';
      s.fillStyle = color;
      s.fillRect(0, 0, slot.width, slot.height);
      this.silhouette = { image, color, key, canvas: scratch };
    }
    ctx.drawImage(this.silhouette!.canvas, slot.x, slot.y, slot.width, slot.height);
  }

  /** @ignore */
  private ctx(): CanvasRenderingContext2D | null {
    if (this.context === undefined) {
      // jsdom logs on every `getContext` call: ask once, remember the answer.
      this.context = this.canvasEl().nativeElement.getContext('2d') ?? null;
    }
    return this.context;
  }

  /** @ignore Screen ink: the canvas `color`, which the stylesheet binds to the ink token. */
  private inkColor(): string {
    return getComputedStyle(this.canvasEl().nativeElement).color;
  }

  /**
   * @ignore Ink width, in CSS pixels. `--_field-sign-ink-width` is registered as a
   * `<length>` (`@property`), so the browser hands back an absolute `px` value whatever unit
   * the hook was set in.
   */
  private inkWidth(): number {
    const canvas = this.canvasEl().nativeElement;
    const raw = getComputedStyle(canvas).getPropertyValue('--_field-sign-ink-width').trim();
    const value = parseFloat(raw);
    return raw.endsWith('px') && Number.isFinite(value) && value > 0 ? value : FALLBACK_INK_WIDTH;
  }
}
