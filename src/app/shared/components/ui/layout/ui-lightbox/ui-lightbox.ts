import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
  isDevMode,
  model,
  numberAttribute,
  output,
  PLATFORM_ID,
  TemplateRef,
  untracked,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { UiMotion, UiMotionPreset } from '@app/shared/motion/ui-motion';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

/** Base stacking level — mirrors `$lightbox-z-index` in the SCSS. */
const LIGHTBOX_BASE_Z_INDEX = 1100;
/** Process-wide sequence so `autoZIndex` layers a later lightbox above earlier ones. */
let zIndexSeq = 0;

// --- Body scroll lock (ref-counted, shared across nested overlays) -------
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

/** Release one scroll lock; restore the body when the last lightbox closes. */
function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    doc.body.style.overflow = savedOverflow;
    doc.body.style.paddingRight = savedPaddingRight;
  }
}

/**
 * ui-lightbox — bezel-less fullscreen overlay: dark scrim, centered content,
 * no card chrome. For a dialog with a header/footer/drag/resize, use `ui-modal`
 * instead; this component only knows how to display and close.
 */
@Component({
  selector: 'ui-lightbox',
  imports: [NgTemplateOutlet, A11yModule, UiMotion, UiIcon],
  templateUrl: './ui-lightbox.html',
  styleUrl: './ui-lightbox.scss',
})
export class UiLightbox {
  /** Open state (two-way). Toggling it drives the enter/leave animation. */
  visible = model(false);

  /** Accessible name of the dialog (there is no visible title to reference). */
  ariaLabel = input<string>('Aperçu');
  /** Show the close button and allow `Escape` to close. */
  closable = input(true, { transform: booleanAttribute });
  /** Close when `Escape` is pressed (ignored when `closable` is false). */
  closeOnEscape = input(true, { transform: booleanAttribute });
  /** Close when the backdrop (outside the panel) is clicked. */
  dismissableMask = input(true, { transform: booleanAttribute });
  /** FontAwesome name of the close button icon. */
  closeIcon = input<string>('xmark');
  /** Accessible name of the close button. */
  closeAriaLabel = input<string>('Fermer');

  /** Enter/leave preset for the panel (the scrim always fades). */
  motion = input<UiMotionPreset>('zoom');
  /** Disable the open/close animation for this lightbox. */
  motionDisabled = input(false, { transform: booleanAttribute });

  /** Layer this lightbox above earlier overlays automatically. */
  autoZIndex = input(true, { transform: booleanAttribute });
  /** Floor z-index (added to the auto value, or used as-is when `autoZIndex=false`). */
  baseZIndex = input(0, { transform: numberAttribute });

  /** Custom toolbar content (e.g. zoom/rotate), rendered next to the close button. */
  protected readonly toolbarTemplate = contentChild<TemplateRef<unknown>>('toolbar');

  /** Emitted after the lightbox becomes visible. */
  shown = output<void>();
  /** Emitted after the lightbox is hidden. */
  hidden = output<void>();

  /** @ignore */
  private readonly document = inject(DOCUMENT);
  /** @ignore */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** @ignore Per-instance layering rank for `autoZIndex`. */
  private readonly zSeq = ++zIndexSeq;
  /** @ignore This instance currently holds a body scroll lock. */
  private locked = false;

  /** @ignore Effective stacking level. */
  protected readonly zIndex = computed(() => {
    const base = this.baseZIndex();
    if (this.autoZIndex()) return LIGHTBOX_BASE_Z_INDEX + base + this.zSeq;
    return base > 0 ? base : LIGHTBOX_BASE_Z_INDEX;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    let wasVisible = false;

    // Open/close side effects: scroll lock, lifecycle events.
    effect(() => {
      const v = this.visible();
      untracked(() => {
        if (v && !wasVisible) {
          wasVisible = true;
          if (this.isBrowser) {
            lockBodyScroll(this.document);
            this.locked = true;
          }
          this.shown.emit();
        } else if (!v && wasVisible) {
          wasVisible = false;
          this.releaseLock();
          this.hidden.emit();
        }
      });
    });

    // A11y safeguard: a dialog must have an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this.visible() && !this.ariaLabel()) {
          console.warn('[ui-lightbox] Boîte de dialogue sans nom accessible : renseignez `ariaLabel`.');
        }
      });
    }

    destroyRef.onDestroy(() => this.releaseLock());
  }

  /** Close the lightbox. */
  close(): void {
    this.visible.set(false);
  }

  /** @ignore Escape-to-close (bubbles from any focused control inside the panel). */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closeOnEscape() && this.closable()) {
      event.stopPropagation();
      this.close();
    }
  }

  /** @ignore Click-outside dismiss (frame target only). */
  protected onMaskPointerdown(event: PointerEvent): void {
    if (!this.dismissableMask() || !this.closable()) return;
    if (event.target === event.currentTarget) this.close();
  }

  /** @ignore Release this instance's scroll lock, if held. */
  private releaseLock(): void {
    if (this.locked) {
      unlockBodyScroll(this.document);
      this.locked = false;
    }
  }
}
