import { booleanAttribute, Component, computed, input, output } from '@angular/core';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiFeedbackLevel, UiSubLevel } from '@app/shared/types/ui-level';
import { UI_TOAST_DEFAULT_ICONS } from './ui-toast.types';

/**
 * ui-toast — presentational notification card.
 *
 * Headless & fully token-driven (the `informative` category): surface, content
 * and stroke all come from `--informative-{level}{sub}-*`. It renders the Figma
 * anatomy (leading icon · title/text · dismiss button) and projects `<ng-content>`
 * in the content region for custom bodies or action buttons.
 *
 * Usually rendered for you by {@link UiToastContainer} from a {@link UiToastService}
 * message, but it is a plain standalone card — drop `<ui-toast>` anywhere.
 *
 * @example
 * ```html
 * <ui-toast level="success" title="Enregistré" text="Profil mis à jour." (close)="…" />
 * ```
 */
@Component({
  selector: 'ui-toast',
  imports: [UiIcon],
  templateUrl: './ui-toast.html',
  styleUrl: './ui-toast.scss',
  host: {
    // Hug content by default; the container makes it fill the region in banner mode.
    '[style.display]': "'inline-flex'",
    '[style.maxWidth]': "'100%'",
  },
})
export class UiToast {
  /** Bold heading line. */
  title = input<string>();
  /** Supporting body line. */
  text = input<string>();
  /** Semantic level — colours + default icon. */
  level = input<UiFeedbackLevel>('default');
  /** Hierarchical intensity (`high` = solid, `low` = subtle). */
  subLevel = input<UiSubLevel>('high');
  /**
   * Leading icon: a FontAwesome name to override the level default, `false`
   * to hide it, or `true` (default) for the level's default icon.
   */
  icon = input<string | boolean>(true);
  /** Show the dismiss button (default `true`). */
  closable = input(true, { transform: booleanAttribute });
  /** FontAwesome name of the dismiss icon. */
  closeIcon = input<string>('times-circle');
  /** Accessible label of the dismiss button. */
  closeAriaLabel = input<string>('Fermer');
  /** Stretch the card to fill its region width (banner-style). */
  expanded = input(false, { transform: booleanAttribute });
  /** Extra class(es) merged onto the card root. */
  styleClass = input<string>();

  /** Emitted when the user clicks the dismiss button. */
  close = output<MouseEvent>();

  /** @ignore Resolved leading icon name (null when hidden). */
  protected readonly iconName = computed<string | null>(() => {
    const icon = this.icon();
    if (icon === false) return null;
    if (typeof icon === 'string') return icon;
    return UI_TOAST_DEFAULT_ICONS[this.level()];
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-toast', `_${this.level()}`, `_${this.subLevel()}`];
    if (this.expanded()) c.push('_expanded');
    const sc = this.styleClass();
    if (sc) c.push(sc);
    return c.join(' ');
  });

  /** @ignore */
  protected onClose(event: MouseEvent): void {
    this.close.emit(event);
  }
}
