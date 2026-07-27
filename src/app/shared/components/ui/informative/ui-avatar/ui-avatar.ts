import { Component, computed, effect, input, isDevMode, output, signal } from '@angular/core';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';

export type AvatarSize = 'small' | 'default' | 'large';
export type AvatarShape = 'circle' | 'square';

/** Rendering mode resolved from the provided inputs. */
export type AvatarMode = 'image' | 'label' | 'icon';

/**
 * ui-avatar — represents a user or entity with an image, initials or an icon.
 *
 * The visual mode is inferred from the inputs (image > label > icon), mirroring the
 * Figma `Type` variant without a redundant prop. A projected `[avatarBadge]` slot
 * overlays a status indicator (typically a `ui-badge`) on the top-right corner.
 *
 * Accessible: exposes an accessible name via `alt` (image) or `ariaLabel`; a bare icon
 * avatar with no name is treated as decorative (aria-hidden).
 */
@Component({
  selector: 'ui-avatar',
  imports: [UiIcon],
  templateUrl: './ui-avatar.html',
  styleUrl: './ui-avatar.scss',
})
export class UiAvatar {
  /** Image source (image mode). Highest priority. */
  image = input<string>();
  /** Alternative text for the image (accessible name in image mode). */
  alt = input<string>();
  /** Short text / initials (label mode). Used when no image is set. */
  label = input<string>();
  /** FontAwesome icon name (icon mode). Fallback when neither image nor label is set. */
  icon = input<string>('user');
  /** Avatar size. */
  size = input<AvatarSize>('default');
  /** Avatar shape. */
  shape = input<AvatarShape>('circle');
  /** Explicit accessible name (recommended for image and icon modes). */
  ariaLabel = input<string>();

  /** Emitted when the image fails to load (the avatar then falls back to label/icon). */
  imageError = output<Event>();

  /** @ignore Set once the current image source failed to load. */
  private readonly imageFailed = signal(false);

  constructor() {
    // Reset the load-error flag whenever the source changes.
    effect(() => {
      this.image();
      this.imageFailed.set(false);
    });

    // A11y safeguard: an image avatar should carry an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this.mode() === 'image' && !this.alt() && !this.ariaLabel()) {
          console.warn(
            '[ui-avatar] Avatar image sans nom accessible : renseignez `alt` (ou `ariaLabel`).',
          );
        }
      });
    }
  }

  /** @ignore Rendering mode resolved from the inputs (image > label > icon). */
  protected readonly mode = computed<AvatarMode>(() => {
    if (this.image() && !this.imageFailed()) return 'image';
    if (this.label()) return 'label';
    return 'icon';
  });

  /** @ignore Icon size mapped from the avatar size. */
  protected readonly iconSize = computed<UiIconSize>(() => {
    switch (this.size()) {
      case 'small':
        return 'md';
      case 'large':
        return 'lg';
      default:
        return 'default';
    }
  });

  /** @ignore Accessible name for the label/icon modes (image mode uses `alt`). */
  protected readonly accessibleName = computed<string | null>(() => {
    if (this.ariaLabel()) return this.ariaLabel()!;
    if (this.mode() === 'label') return this.label() ?? null;
    return null;
  });

  /** @ignore Icon avatar with no accessible name → purely decorative. */
  protected readonly isDecorative = computed(
    () => this.mode() === 'icon' && !this.accessibleName(),
  );

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-avatar', `_${this.mode()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.shape() !== 'circle') c.push(`_${this.shape()}`);
    return c.join(' ');
  });

  /** @ignore */
  protected onImageError(event: Event): void {
    this.imageFailed.set(true);
    this.imageError.emit(event);
  }
}
