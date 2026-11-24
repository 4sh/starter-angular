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
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField, warnMissingAccessibleName } from '@4sh/ui-kit/forms';
import { UiField } from '@4sh/ui-kit/forms/ui-field';
import { UiIcon, type UiIconSize } from '@4sh/ui-kit/base/ui-icon';
import {
  containRect,
  type SignPoint,
  type SignStroke,
  strokesToSvg,
  svgToDataUrl,
  traceStroke,
} from './ui-field-sign-strokes';

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
 * Values the field accepts from the form: an image **data URL**, what it emits itself. A
 * remote URL is refused on purpose — drawn on a canvas it taints it (the export then throws),
 * and carried into an SVG export it would be fetched by whatever renders that SVG later.
 */
const ACCEPTED_VALUE = /^data:image\/(png|jpeg|webp|svg\+xml)[;,]/i;

/** Size of the drawing frame, in CSS pixels. */
interface SignFrame {
  readonly width: number;
  readonly height: number;
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
  readonly frame: SignFrame | null;
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
 * 3. **The signature has a fixed frame.** The box size at the first stroke becomes the
 *    frame: points are stored in it, the screen fits it into the box (`contain`) and the
 *    export is always that size. A box that shrinks afterwards (a phone rotated mid-way)
 *    scales the drawing down instead of cropping it out of the value.
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
  /** Image format of the emitted data URL. */
  format = input<FieldSignFormat>('png');
  /** Ink colour of the **export** (any CSS colour). The screen ink follows the tokens. */
  exportColor = input<string>('black');
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

  /** Emitted when a stroke ends, and when the signature is cleared or undone — never mid-stroke. */
  valueChange = output<FieldSignValue>();
  /** Emitted when the drawing area receives focus. */
  padFocus = output<FocusEvent>();
  /** Emitted when the drawing area loses focus. */
  padBlur = output<FocusEvent>();

  /** @ignore */
  private readonly canvasEl = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasEl');
  /** @ignore */
  private readonly document = inject(DOCUMENT);

  /** @ignore Finished strokes, oldest first, in frame coordinates — `undo()` pops from the end. */
  protected readonly strokes = signal<readonly SignStroke[]>([]);
  /** @ignore A value received from the form, drawn underneath the strokes. */
  protected readonly background = signal<SignBackground | null>(null);
  /** @ignore A stroke is in progress. */
  protected readonly drawing = signal(false);

  /** @ignore Nothing signed: no stroke, no previous signature, no stroke under way. */
  protected readonly isEmpty = computed(
    () => this.strokes().length === 0 && !this.background() && !this.drawing(),
  );
  /** @ignore */
  protected readonly isInteractive = computed(() => !this.isDisabled() && !this.readonly());
  /** @ignore */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));
  /** @ignore */
  protected readonly statusId = computed(() => `${this.resolvedId()}-status`);
  /** @ignore The state, then "required" — `role="img"` takes no `aria-required`. */
  protected readonly statusText = computed(() => {
    const state = this.isEmpty() ? this.placeholder() : this.signedLabel();
    return this.required() && this.requiredLabel() ? `${state}, ${this.requiredLabel()}` : state;
  });
  /** @ignore The state first, then the helper/error message when one is rendered. */
  protected readonly describedByIds = computed(() =>
    [this.statusId(), this.displayMessage() ? this.messageId() : null].filter(Boolean).join(' '),
  );
  /** @ignore `exportColor`, or `black` when the browser does not take it as a colour: an
   *  invalid `stroke` would make the SVG export invisible, the PNG one silently black. */
  private readonly resolvedExportColor = computed(() => {
    const color = this.exportColor();
    if (typeof CSS === 'undefined' || !CSS.supports) return color;
    if (CSS.supports('color', color)) return color;
    if (isDevMode())
      console.warn(`[ui-field-sign] Invalid \`exportColor\` "${color}": using black.`);
    return 'black';
  });

  /** @ignore Frame the strokes live in; `null` until the first stroke (the box stands in). */
  private frame: SignFrame | null = null;
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
  /** @ignore Previous signature recoloured in the screen ink, rebuilt only when its key changes. */
  private silhouette: { key: string; canvas: HTMLCanvasElement } | null = null;
  /** @ignore Last value this field emitted — see {@link writeValue}. */
  private lastEmitted: FieldSignValue | undefined;
  /** @ignore A stroke ended while the previous signature was still loading (PNG export). */
  private commitPending = false;
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
    if (next && !ACCEPTED_VALUE.test(next)) {
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
    this.cleared = null;
    this.frame = null;
    this.drawing.set(false);
    this.strokes.set([]);
    this.background.set(next ? { src: next, image: null } : null);
    if (next) this.loadBackground(next);
  }

  /** Removes the whole signature, previous one included, and emits `null`. `undo()` brings it back. */
  clear(): void {
    if (this.isEmpty()) return;
    this.cleared = { strokes: this.strokes(), background: this.background(), frame: this.frame };
    this.frame = null;
    this.strokes.set([]);
    this.background.set(null);
    this.commit();
  }

  /**
   * Removes the last stroke drawn in this field; with none left, brings back what the last
   * `clear()` removed. A signature received from the form is not a stroke: only `clear()`
   * removes it.
   */
  undo(): void {
    if (this.strokes().length > 0) {
      this.strokes.update((s) => s.slice(0, -1));
    } else if (this.cleared) {
      const { strokes, background, frame } = this.cleared;
      this.cleared = null;
      this.frame = frame;
      this.strokes.set(strokes);
      this.background.set(background);
    } else {
      return;
    }
    if (this.strokes().length === 0 && !this.background()) this.frame = null;
    this.commit();
  }

  /** Focuses the drawing area. */
  focus(options?: FocusOptions): void {
    this.canvasEl().nativeElement.focus(options);
  }

  /** Whether the field holds a signature — a stroke under way does not count until it ends. */
  hasSignature(): boolean {
    return this.strokes().length > 0 || !!this.background();
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

    this.frame ??= { width: this.boxWidth, height: this.boxHeight };
    this.activePointerId = event.pointerId;
    this.padRect = canvas.getBoundingClientRect();
    this.current = [this.toPoint(event)];
    this.drawing.set(true);
    this.scheduleRedraw();
  }

  /** @ignore */
  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId || !this.current) return;
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
    const stroke = this.current;
    this.current = null;
    this.activePointerId = null;
    this.padRect = null;
    this.drawing.set(false);
    this.strokes.update((s) => [...s, stroke]);
    this.commit();
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
    // A PNG export paints the previous signature: wait for it rather than drop it.
    const bg = this.background();
    if (this.format() === 'png' && bg && !bg.image) {
      this.commitPending = true;
      return;
    }
    this.commitPending = false;
    const value = this.isEmpty() ? null : this.export();
    this.lastEmitted = value;
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);
  }

  /** @ignore */
  private export(): string {
    const lineWidth = this.inkWidth();
    if (this.format() === 'png') {
      const png = this.exportPng(lineWidth);
      if (png) return png;
      // No 2D canvas here, or a canvas the browser refuses to read back: SVG needs neither.
    }
    const frame = this.currentFrame();
    return svgToDataUrl(
      strokesToSvg(this.strokes(), {
        width: frame.width,
        height: frame.height,
        color: this.resolvedExportColor(),
        lineWidth,
        background: this.background()?.src,
      }),
    );
  }

  /** @ignore Repaints on a detached canvas, in the export ink and without the tint. */
  private exportPng(lineWidth: number): string | null {
    const { width, height } = this.currentFrame();
    if (width <= 0 || height <= 0) return null;
    const canvas = this.document.createElement('canvas');
    canvas.width = Math.round(width * PNG_EXPORT_SCALE);
    canvas.height = Math.round(height * PNG_EXPORT_SCALE);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(PNG_EXPORT_SCALE, PNG_EXPORT_SCALE);
    const image = this.background()?.image;
    if (image) {
      const r = containRect(image.naturalWidth, image.naturalHeight, width, height);
      ctx.drawImage(image, r.x, r.y, r.width, r.height);
    }
    this.paintStrokes(ctx, this.strokes(), this.resolvedExportColor(), lineWidth);
    try {
      return canvas.toDataURL('image/png');
    } catch {
      // A tainted canvas (an SVG previous signature on older WebKit): fall back to SVG
      // rather than leave the form on the old value while the screen shows the new stroke.
      if (isDevMode()) console.warn('[ui-field-sign] PNG export refused: emitting SVG instead.');
      return null;
    }
  }

  /** @ignore */
  private loadBackground(src: string): void {
    if (typeof Image === 'undefined') return;
    const image = new Image();
    image.onload = () => {
      this.background.update((bg) => (bg?.src === src ? { src, image } : bg));
      if (this.commitPending) this.commit();
    };
    image.onerror = () => {
      if (this.background()?.src !== src) return;
      if (isDevMode()) console.warn('[ui-field-sign] The previous signature could not be loaded.');
      // Shown empty rather than announced as signed over a blank box.
      this.background.set(null);
      if (this.strokes().length === 0) this.frame = null;
      if (this.commitPending) this.commit();
    };
    image.src = src;
  }

  // --- Rendering -----------------------------------------------------------

  /** @ignore The frame in force: the one set at the first stroke, or the box until then. */
  private currentFrame(): SignFrame {
    return this.frame ?? { width: this.boxWidth, height: this.boxHeight };
  }

  /** @ignore Where the frame sits in the box: scaled to fit, centred. */
  private frameView(): { scale: number; x: number; y: number } {
    const frame = this.currentFrame();
    if (frame.width <= 0 || frame.height <= 0) return { scale: 1, x: 0, y: 0 };
    const r = containRect(frame.width, frame.height, this.boxWidth, this.boxHeight);
    return { scale: r.width / frame.width, x: r.x, y: r.y };
  }

  /** @ignore Pointer position → frame coordinates. */
  private toPoint(event: PointerEvent): SignPoint {
    const rect = this.padRect;
    const canvas = this.canvasEl().nativeElement;
    // Screen pixels → CSS pixels of the box, should an ancestor scale it.
    const css = rect && rect.width > 0 ? canvas.clientWidth / rect.width || 1 : 1;
    const x = rect ? (event.clientX - rect.left) * css : event.offsetX;
    const y = rect ? (event.clientY - rect.top) * css : event.offsetY;
    const view = this.frameView();
    return { x: (x - view.x) / view.scale, y: (y - view.y) / view.scale };
  }

  /** @ignore Size the bitmap on the CSS box × device pixel ratio: sharp on every screen. */
  private measure(): void {
    const canvas = this.canvasEl().nativeElement;
    this.boxWidth = canvas.clientWidth;
    this.boxHeight = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(this.boxWidth * ratio));
    canvas.height = Math.max(1, Math.round(this.boxHeight * ratio));
  }

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

    // Everything below is drawn in frame coordinates.
    const view = this.frameView();
    const k = ratio * view.scale;
    ctx.setTransform(k, 0, 0, k, ratio * view.x, ratio * view.y);

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
   * a dark field this way. The scratch canvas is cached — rebuilt only when the image, the
   * ink or the pixel size changes, never per frame while a stroke is drawn over it.
   */
  private paintSilhouette(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    color: string,
    pixelScale: number,
  ): void {
    const { width, height } = this.currentFrame();
    const key = `${image.src.length}:${image.src.slice(-32)}|${color}|${width}x${height}@${pixelScale}`;
    if (this.silhouette?.key !== key) {
      const scratch = this.document.createElement('canvas');
      scratch.width = Math.max(1, Math.round(width * pixelScale));
      scratch.height = Math.max(1, Math.round(height * pixelScale));
      const s = scratch.getContext('2d');
      if (!s) return;
      const r = containRect(image.naturalWidth, image.naturalHeight, width, height);
      s.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
      s.drawImage(image, r.x, r.y, r.width, r.height);
      s.globalCompositeOperation = 'source-in';
      s.fillStyle = color;
      s.fillRect(0, 0, width, height);
      this.silhouette = { key, canvas: scratch };
    }
    ctx.drawImage(this.silhouette.canvas, 0, 0, width, height);
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
