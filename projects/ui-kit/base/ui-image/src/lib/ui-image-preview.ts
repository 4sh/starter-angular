import {
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

// --- Body scroll lock (ref-counted) -------------------------------------
// Same recipe as the kit's other viewport masks (ui-modal, ui-drawer,
// ui-bottom-sheet, ui-sidebar): each entry point compiles on its own, so the
// counter is per-module rather than shared.
let scrollLockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

/** Freeze background scroll, compensating the scrollbar gutter to avoid a shift. */
function lockBodyScroll(doc: Document): void {
  if (scrollLockCount === 0) {
    const body = doc.body;
    const gap = (doc.defaultView?.innerWidth ?? 0) - doc.documentElement.clientWidth;
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
  }
  scrollLockCount++;
}

/** Release one scroll lock; restore the body when the last mask closes. */
function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    doc.body.style.overflow = savedOverflow;
    doc.body.style.paddingRight = savedPaddingRight;
  }
}

/** Clamp `value` into `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * ui-image-preview — the enlarged view (lightbox) opened by `ui-image`'s
 * `preview` mode.
 *
 * A viewport mask holding a toolbar (zoom in/out, rotate, reset, optional
 * download, close) and the image itself, which the three transforms drive
 * through a single `transform`: pan, scale, rotation. Zoom is reachable at the
 * pointer (toolbar, wheel) and at the keyboard (`+`/`-`/`0`/`r`, arrows to pan)
 * — a zoom a keyboard user cannot pan is a zoom they cannot read.
 *
 * Lives in `ui-image`'s entry point: it renders that component's resolved
 * source, so a separate entry point would be a cycle. Mount it directly only to
 * drive the enlarged view yourself.
 */
@Component({
  selector: 'ui-image-preview',
  imports: [A11yModule, UiIcon],
  templateUrl: './ui-image-preview.html',
  styleUrl: './ui-image-preview.scss',
})
export class UiImagePreview {
  private readonly document = inject(DOCUMENT);

  /** URL of the image to show enlarged (already resolved — `http(s)`, `blob:` or `data:`). */
  src = input.required<string>();
  /** Alt text of the enlarged image (empty = decorative). */
  alt = input<string>('');
  /** Accessible name of the dialog. */
  ariaLabel = input<string>('Aperçu de l’image');

  /** Zoom increment applied by one toolbar click, one wheel notch or one `+`/`-` press. */
  zoomStep = input(0.25, { transform: numberAttribute });
  /** Lower zoom bound. */
  minZoom = input(0.5, { transform: numberAttribute });
  /** Upper zoom bound. */
  maxZoom = input(4, { transform: numberAttribute });

  /** Offer a download action in the toolbar. */
  downloadable = input(false, { transform: booleanAttribute });
  /** Filename proposed by the download action (defaults to the browser's choice). */
  downloadName = input<string>();

  /** Close when the mask around the image is clicked. */
  dismissableMask = input(true, { transform: booleanAttribute });

  zoomInAriaLabel = input('Zoom avant');
  zoomOutAriaLabel = input('Zoom arrière');
  rotateLeftAriaLabel = input('Pivoter vers la gauche');
  rotateRightAriaLabel = input('Pivoter vers la droite');
  resetAriaLabel = input('Réinitialiser l’affichage');
  downloadAriaLabel = input('Télécharger l’image');
  closeAriaLabel = input('Fermer l’aperçu');

  /** Emitted when the view asks to be dismissed (Escape, close button, mask click). */
  closed = output<void>();

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');

  protected readonly scale = signal(1);
  protected readonly rotation = signal(0);
  protected readonly panX = signal(0);
  protected readonly panY = signal(0);

  protected readonly canZoomIn = computed(() => this.scale() < this.maxZoom());
  protected readonly canZoomOut = computed(() => this.scale() > this.minZoom());
  /** Nothing to reset while the three transforms are at their neutral value. */
  protected readonly isPristine = computed(
    () => this.scale() === 1 && this.rotation() === 0 && this.panX() === 0 && this.panY() === 0,
  );
  /** Panning only makes sense once the image overflows its stage. */
  protected readonly canPan = computed(() => this.scale() > 1);
  /** A quarter turn: what is drawn no longer fits the layout box's axes. */
  protected readonly isQuarterTurned = computed(() => this.rotation() % 180 !== 0);

  protected readonly transform = computed(
    () =>
      `translate(${this.panX()}px, ${this.panY()}px) scale(${this.scale()}) rotate(${this.rotation()}deg)`,
  );

  constructor() {
    lockBodyScroll(this.document);
    inject(DestroyRef).onDestroy(() => unlockBodyScroll(this.document));
  }

  protected zoomIn(): void {
    this.setScale(this.scale() + this.zoomStep());
  }

  protected zoomOut(): void {
    this.setScale(this.scale() - this.zoomStep());
  }

  protected rotateLeft(): void {
    this.rotation.update((deg) => deg - 90);
  }

  protected rotateRight(): void {
    this.rotation.update((deg) => deg + 90);
  }

  protected reset(): void {
    this.scale.set(1);
    this.rotation.set(0);
    this.panX.set(0);
    this.panY.set(0);
  }

  protected close(): void {
    this.closed.emit();
  }

  /** A press that lands on the stage itself (not on the image) is a press outside. */
  protected onStagePointerDown(event: PointerEvent): void {
    if (this.dismissableMask() && event.target === this.stage().nativeElement) this.close();
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.setScale(this.scale() + (event.deltaY < 0 ? this.zoomStep() : -this.zoomStep()));
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = 24;
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
        this.zoomOut();
        break;
      case '0':
        this.reset();
        break;
      case 'r':
      case 'R':
        this.rotateRight();
        break;
      case 'ArrowLeft':
        this.panX.update((x) => x - step);
        break;
      case 'ArrowRight':
        this.panX.update((x) => x + step);
        break;
      case 'ArrowUp':
        this.panY.update((y) => y - step);
        break;
      case 'ArrowDown':
        this.panY.update((y) => y + step);
        break;
      default:
        return;
    }
    // Only a handled key is swallowed: Tab must keep cycling the focus trap.
    event.preventDefault();
    event.stopPropagation();
  }

  // --- Drag to pan ------------------------------------------------------
  private dragOrigin: { x: number; y: number; panX: number; panY: number } | null = null;

  protected onPointerDown(event: PointerEvent): void {
    if (!this.canPan() || event.button !== 0) return;
    this.dragOrigin = { x: event.clientX, y: event.clientY, panX: this.panX(), panY: this.panY() };
    (event.target as Element).setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    const origin = this.dragOrigin;
    if (!origin) return;
    this.panX.set(origin.panX + (event.clientX - origin.x));
    this.panY.set(origin.panY + (event.clientY - origin.y));
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.dragOrigin) return;
    this.dragOrigin = null;
    (event.target as Element).releasePointerCapture?.(event.pointerId);
  }

  private setScale(value: number): void {
    const next = clamp(Number(value.toFixed(4)), this.minZoom(), this.maxZoom());
    this.scale.set(next);
    // Back to fit: the pan offset would otherwise strand the image off-centre.
    if (next <= 1) {
      this.panX.set(0);
      this.panY.set(0);
    }
  }
}
