import {
  booleanAttribute,
  Component,
  computed,
  effect,
  input,
  isDevMode,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiFeedbackLevel, UiSubLevel } from '@app/shared/types/ui-level';

export type TagSize = 'default' | 'small';

/**
 * ui-tag — informative label / status pill.
 *
 * Inspired by the PrimeNG `Tag` API (static, non-interactive), adapted to this
 * design system: `level` × `subLevel` (informative color families) instead of a
 * flat `severity`, an optional icon on each side, and a pill/square shape.
 *
 * Fully token-driven (like `ui-badge`) — the color families are the built-in
 * customization surface; no per-component CSS hooks.
 */
@Component({
  selector: 'ui-tag',
  imports: [UiIcon],
  templateUrl: './ui-tag.html',
  styleUrl: './ui-tag.scss',
})
export class UiTag {
  /** Text content of the tag. */
  label = input<string>();
  /** Color family. */
  level = input<UiFeedbackLevel>('default');
  /** Intensity: high (solid) or low (subtle). */
  subLevel = input<UiSubLevel>('high');
  /** Size. */
  size = input<TagSize>('default');
  /** FontAwesome name of the leading icon (optional). */
  iconLeft = input<string>();
  /** FontAwesome name of the trailing icon (optional). */
  iconRight = input<string>();
  /** Pill shape when true (default); rounded-rectangle when false. */
  rounded = input(true, { transform: booleanAttribute });
  /** Accessible name (recommended when the tag has no textual label). */
  ariaLabel = input<string>();

  constructor() {
    // A11y safeguard: an icon-only tag needs an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this.isIconOnly() && !this.ariaLabel()) {
          console.warn('[ui-tag] Tag sans texte : renseignez `label` ou `ariaLabel`.');
        }
      });
    }
  }

  /** @ignore There is a textual label. */
  protected readonly hasLabel = computed(() => !!this.label()?.length);

  /** @ignore At least one icon and no label. */
  protected readonly isIconOnly = computed(
    () => (!!this.iconLeft() || !!this.iconRight()) && !this.hasLabel(),
  );

  /** @ignore Icon size derived from the tag size. */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-tag', `_${this.level()}`, `_${this.subLevel()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (!this.rounded()) c.push('_square');
    return c.join(' ');
  });
}
