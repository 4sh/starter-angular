import { Component, computed, effect, input, signal, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';

export type UiSpinnerSize = 'default' | 'small';
export type UiSpinnerOrientation = 'vertical' | 'horizontal';

/** How the animated mark is rendered (derived from which input is set). */
type SpinnerMark = 'template' | 'image' | 'icon' | 'svg';

/**
 * ui-spinner — indeterminate loading indicator (headless).
 *
 * Renders a smooth, token-colored circular spinner by default. The animated
 * mark is fully swappable, in priority order:
 *   1. `spinnerTemplate` — any custom content (TemplateRef)
 *   2. `image`           — an image URL (e.g. an animated GIF/SVG loader)
 *   3. `icon`            — a FontAwesome icon name (rotated by the component)
 *   4. default           — a built-in SVG circle (tunable stroke/fill/duration)
 *
 * Accessible: the root is a `role="status"` live region with an accessible
 * name; the mark is decorative (`aria-hidden`). Motion honours the OS
 * reduced-motion preference and the kit-wide `data-motion="off"` switch.
 */
@Component({
  selector: 'ui-spinner',
  imports: [UiIcon, NgTemplateOutlet],
  templateUrl: './ui-spinner.html',
  styleUrl: './ui-spinner.scss',
  host: {
    '[style.--ui-spinner-duration]': 'animationDuration()',
  },
})
export class UiSpinner {
  /** Size preset (also override the raw box via the `--ui-spinner-size` CSS var). */
  size = input<UiSpinnerSize>('default');
  /** Layout of the mark relative to the label (only relevant when `label` is set). */
  orientation = input<UiSpinnerOrientation>('vertical');
  /** Optional visible loading text, rendered inside the live region. */
  label = input<string>();
  /** Accessible name. Falls back to the visible `label`, then to "Chargement". */
  ariaLabel = input<string>();

  // --- Swappable mark (priority: template > image > icon > default SVG) ---
  /** Custom mark content; takes precedence over every other mark source. */
  spinnerTemplate = input<TemplateRef<unknown>>();
  /** Image URL used as the mark (shown as-is — carries its own motion). */
  image = input<string>();
  /** Alt text for the image mark (empty = decorative, the default). */
  imageAlt = input<string>('');
  /** FontAwesome icon name used as the mark (rotated by the component). */
  icon = input<string>();

  // --- Default SVG circle tuning (ignored by the other marks) ----------
  /** Stroke width of the default circle, in the 0–50 viewBox scale. */
  strokeWidth = input<string | number>(4);
  /** Fill of the default circle (`none` = ring only). */
  fill = input<string>('none');
  /** Duration of one rotation (any CSS time), shared with the icon mark. */
  animationDuration = input<string>('1.2s');

  /**
   * Grace delay before the spinner appears, in ms. Prevents a flash of the
   * loader for waits shorter than the delay (a common loading UX best practice).
   */
  delay = input(0);

  /** @ignore Visible once the grace delay (if any) has elapsed. */
  protected readonly visible = signal(true);

  constructor() {
    // Grace delay: hide until the timer fires. setTimeout (not rAF) so it still
    // resolves in a throttled/background tab. Cleaned up on re-run / destroy.
    effect((onCleanup) => {
      const ms = this.delay();
      if (ms > 0) {
        this.visible.set(false);
        const id = setTimeout(() => this.visible.set(true), ms);
        onCleanup(() => clearTimeout(id));
      } else {
        this.visible.set(true);
      }
    });
  }

  /** @ignore Which mark to render. */
  protected readonly markKind = computed<SpinnerMark>(() => {
    if (this.spinnerTemplate()) return 'template';
    if (this.image()) return 'image';
    if (this.icon()) return 'icon';
    return 'svg';
  });

  /** @ignore Icon size matching the spinner box (default → xl, small → default). */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'default' : 'xl'));

  /** @ignore Accessible name: explicit, else the visible label reads on its own, else a default. */
  protected readonly rootAriaLabel = computed(() => {
    if (this.ariaLabel()) return this.ariaLabel()!;
    if (this.label()) return null; // visible text is announced by the live region
    return 'Chargement';
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-spinner'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.orientation() === 'horizontal') c.push('_horizontal');
    return c.join(' ');
  });
}
