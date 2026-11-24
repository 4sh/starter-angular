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
 * Resolution of a PNG export, relative to the drawing area: crisp on a high-density screen
 * and in print, and the same on every device — the device pixel ratio is a property of the
 * screen the person signed on, not of the document the signature ends up in.
 */
const PNG_EXPORT_SCALE = 2;

/** Ink width used when the custom property cannot be read (no layout: SSR, tests). */
const FALLBACK_INK_WIDTH = 2;

/** A previous signature received from the form, kept underneath the new strokes. */
interface SignBackground {
  readonly src: string;
  /** `null` until the image has loaded — it is drawn from then on. */
  readonly image: HTMLImageElement | null;
}

/**
 * ui-field-sign — handwritten signature field on the `ui-field` shell (label + box +
 * helper). **The box is the drawing area**: finger, stylus or mouse, through Pointer
 * Events, on a `<canvas>`.
 *
 * Three choices shape it:
 *
 * 1. **The value is an image, emitted once a stroke ends** — a data URL (`format`: PNG or
 *    SVG), `null` when empty, so `required` works as is. Never mid-stroke: a form bound to
 *    an autosave would otherwise receive an image per pointer move.
 * 2. **The screen and the export use two inks.** On screen the ink follows the tokens, dark
 *    theme included; the export is painted with `exportColor` on a transparent background.
 *    A signature drawn in dark mode would otherwise come out white — invisible on the PDF
 *    it is meant for.
 * 3. **The page does not scroll under the pen.** `touch-action: none` on the drawing area,
 *    pointer capture for the whole stroke.
 *
 * A value written by the form is shown in the box and kept underneath any new stroke, until
 * cleared. It is expected to be what this field emits — a signature on a transparent
 * background: on screen it is redrawn as a silhouette in the current ink, so that a black
 * signature stays legible on a dark field.
 *
 * Standalone, `[(ngModel)]` or reactive forms (ControlValueAccessor via BaseFormField).
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

  /** @ignore Finished strokes, oldest first — `undo()` pops from the end. */
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
  /** @ignore The state first, then the helper/error message when one is rendered. */
  protected readonly describedByIds = computed(() =>
    [this.statusId(), this.displayMessage() ? this.messageId() : null].filter(Boolean).join(' '),
  );

  /** @ignore The stroke under the pen — plain array, mutated per pointer move. */
  private current: SignPoint[] | null = null;
  /** @ignore Pointer that owns {@link current}: a second finger does not draw. */
  private activePointerId: number | null = null;
  /** @ignore Drawing area at stroke start, so a move does not force a layout. */
  private padRect: DOMRect | null = null;
  /** @ignore Size of the drawing area, in CSS pixels, as last observed. */
  private cssWidth = 0;
  private cssHeight = 0;
  /** @ignore `undefined` = not asked yet; `null` = no 2D canvas here (tests, old engines). */
  private context: CanvasRenderingContext2D | null | undefined;
  /** @ignore Last value this field emitted: a `writeValue` echoing it must not reset the strokes. */
  private lastEmitted: FieldSignValue | undefined;
  /** @ignore */
  private frame: number | null = null;

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
      if (this.frame !== null) cancelAnimationFrame(this.frame);
    });
  }

  override writeValue(value: FieldSignValue): void {
    const next = value || null;
    super.writeValue(next);
    // The form echoing what we just emitted: the strokes ARE that value, keep them (undo
    // would otherwise lose its history after every stroke).
    if (next === this.lastEmitted) return;
    this.lastEmitted = undefined;
    this.current = null;
    this.activePointerId = null;
    this.drawing.set(false);
    this.strokes.set([]);
    this.background.set(next ? { src: next, image: null } : null);
    if (next) this.loadBackground(next);
  }

  /** Removes the whole signature, previous one included, and emits `null`. */
  clear(): void {
    if (this.isEmpty()) return;
    this.strokes.set([]);
    this.background.set(null);
    this.commit();
  }

  /** Removes the last stroke drawn in this field. A signature received from the form is not a stroke: `clear()` removes it. */
  undo(): void {
    if (this.strokes().length === 0) return;
    this.strokes.update((s) => s.slice(0, -1));
    this.commit();
  }

  /** Focuses the drawing area. */
  focus(options?: FocusOptions): void {
    this.canvasEl().nativeElement.focus(options);
  }

  /** Whether the field holds a signature. */
  hasSignature(): boolean {
    return !this.isEmpty();
  }

  /** @ignore */
  protected override uidPrefix(): string {
    return 'ui-field-sign';
  }

  // --- Pointer ---------------------------------------------------------

  /** @ignore */
  protected onPointerDown(event: PointerEvent): void {
    if (!this.isInteractive() || this.activePointerId !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const canvas = this.canvasEl().nativeElement;
    // No text selection, no synthetic mouse events — which also means no native focus:
    // given back right below.
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture?.(event.pointerId);

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

  /** @ignore `pointerup` and `pointercancel` alike: what was drawn is kept. */
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

  /** @ignore `Suppr`/`Retour arrière` clear, `Ctrl`/`⌘`+`Z` undoes. */
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.isInteractive()) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.clear();
    } else if (
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      event.key.toLowerCase() === 'z'
    ) {
      event.preventDefault();
      this.undo();
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
      // No 2D canvas in this environment: SVG needs none, and is still a valid image.
    }
    return svgToDataUrl(
      strokesToSvg(this.strokes(), {
        width: this.cssWidth,
        height: this.cssHeight,
        color: this.exportColor(),
        lineWidth,
        background: this.background()?.src,
      }),
    );
  }

  /** @ignore Repaints on a detached canvas, in the export ink and without the tint. */
  private exportPng(lineWidth: number): string | null {
    if (this.cssWidth <= 0 || this.cssHeight <= 0) return null;
    const canvas = this.document.createElement('canvas');
    canvas.width = Math.round(this.cssWidth * PNG_EXPORT_SCALE);
    canvas.height = Math.round(this.cssHeight * PNG_EXPORT_SCALE);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(PNG_EXPORT_SCALE, PNG_EXPORT_SCALE);
    const image = this.background()?.image;
    if (image) {
      const r = containRect(image.naturalWidth, image.naturalHeight, this.cssWidth, this.cssHeight);
      ctx.drawImage(image, r.x, r.y, r.width, r.height);
    }
    this.paintStrokes(ctx, this.strokes(), this.exportColor(), lineWidth);
    return canvas.toDataURL('image/png');
  }

  /** @ignore */
  private loadBackground(src: string): void {
    if (typeof Image === 'undefined') return;
    const image = new Image();
    image.onload = () => this.background.update((bg) => (bg?.src === src ? { src, image } : bg));
    image.src = src;
  }

  // --- Rendering -----------------------------------------------------------

  /** @ignore */
  private toPoint(event: PointerEvent): SignPoint {
    const rect = this.padRect;
    return rect
      ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
      : { x: event.offsetX, y: event.offsetY };
  }

  /** @ignore Size the bitmap on the CSS box × device pixel ratio: sharp on every screen. */
  private measure(): void {
    const canvas = this.canvasEl().nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
  }

  /** @ignore One repaint per frame, however many pointer moves arrive in it. */
  private scheduleRedraw(): void {
    if (this.frame !== null || typeof requestAnimationFrame === 'undefined') return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.redraw();
    });
  }

  /** @ignore */
  private redraw(): void {
    const ctx = this.ctx();
    if (!ctx) return;
    const canvas = ctx.canvas;
    const ratio = this.cssWidth > 0 ? canvas.width / this.cssWidth : 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const color = this.inkColor();
    const image = this.background()?.image;
    if (image) this.paintSilhouette(ctx, image, color, ratio);
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
   * then `source-in` keeps its shape and replaces its colour. A black export stays legible
   * on a dark field this way.
   */
  private paintSilhouette(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    color: string,
    ratio: number,
  ): void {
    const scratch = this.document.createElement('canvas');
    scratch.width = ctx.canvas.width;
    scratch.height = ctx.canvas.height;
    const s = scratch.getContext('2d');
    if (!s) return;
    const r = containRect(image.naturalWidth, image.naturalHeight, this.cssWidth, this.cssHeight);
    s.setTransform(ratio, 0, 0, ratio, 0, 0);
    s.drawImage(image, r.x, r.y, r.width, r.height);
    s.globalCompositeOperation = 'source-in';
    s.fillStyle = color;
    s.fillRect(0, 0, this.cssWidth, this.cssHeight);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(scratch, 0, 0);
    ctx.restore();
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

  /** @ignore Ink width, read from `--_ink-width` (px or rem). */
  private inkWidth(): number {
    const canvas = this.canvasEl().nativeElement;
    const raw = getComputedStyle(canvas).getPropertyValue('--_ink-width').trim();
    const value = parseFloat(raw);
    if (!Number.isFinite(value) || value <= 0) return FALLBACK_INK_WIDTH;
    if (raw.endsWith('rem')) {
      return value * parseFloat(getComputedStyle(this.document.documentElement).fontSize || '16');
    }
    return value;
  }
}
