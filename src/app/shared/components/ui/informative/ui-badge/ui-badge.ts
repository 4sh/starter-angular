import { Component, computed, effect, input, isDevMode } from '@angular/core';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiFeedbackLevel, UiSubLevel } from '@app/shared/types/ui-level';

export type BadgeSize = 'default' | 'small' | 'large';

/**
 * ui-badge — small status / count indicator.
 */
@Component({
  selector: 'ui-badge',
  imports: [UiIcon],
  templateUrl: './ui-badge.html',
  styleUrl: './ui-badge.scss',
})
export class UiBadge {
  value = input<string | number>();
  level = input<UiFeedbackLevel>('default');
  subLevel = input<UiSubLevel>('high');
  size = input<BadgeSize>('default');
  icon = input<string>();
  ariaLabel = input<string>();

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (this.isIconOnly() && !this.ariaLabel()) {
          console.warn('[ui-badge] Badge icon-only sans nom accessible : renseignez `ariaLabel`.');
        }
      });
    }
  }

  /** @ignore There is text here */
  protected readonly hasText = computed(() => {
    const v = this.value();
    return v !== undefined && v !== null && String(v).length > 0;
  });

  /** @ignore There is an icon. */
  protected readonly hasIcon = computed(() => !!this.icon());

  /** @ignore Icon only (no text). */
  protected readonly isIconOnly = computed(() => this.hasIcon() && !this.hasText());

  /** @ignore Point : ni texte ni icône. */
  protected readonly isDot = computed(() => !this.hasIcon() && !this.hasText());

  /** @ignore Bullet: Neither text nor icon. */
  protected readonly iconSize = computed<UiIconSize>(() => {
    switch (this.size()) {
      case 'small':
        return 'sm';
      case 'large':
        return 'lg';
      default:
        return 'md';
    }
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-badge', `_${this.level()}`, `_${this.subLevel()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.isDot()) c.push('_dot');
    return c.join(' ');
  });
}
