import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiFeedbackLevel, UiSubLevel } from '@app/shared/types/ui-level';
import { UI_ALERT_DEFAULT_ICONS, UiAlertSize } from './ui-alert.types';

/**
 * ui-alert — inline message for informational, success, warning or error feedback.
 *
 * Headless & fully token-driven (the `informative` category): surface, content
 * and stroke all come from `--informative-{level}{sub}-*`. It renders the Figma
 * anatomy (leading icon · title/text · dismiss button) and projects `<ng-content>`
 * in the content region for custom bodies or action buttons.
 *
 * The root carries `role="alert"` (implicit `aria-live="assertive"` +
 * `aria-atomic="true"`), so screen readers announce it as soon as it appears —
 * ideal for form validation summaries or transient status banners. Set `life`
 * to auto-dismiss after a delay; the alert hides itself and emits `close`.
 *
 * Unlike {@link UiToast} (a floating, service-driven notification), `ui-alert`
 * is a plain inline block — drop it in the page flow, a form, or a `@for` loop.
 *
 * @example
 * ```html
 * <ui-alert level="error" title="Erreur" text="Le formulaire est invalide." />
 * <ui-alert level="success" text="Enregistré." [life]="4000" (close)="onClose()" />
 * ```
 */
@Component({
  selector: 'ui-alert',
  imports: [UiIcon],
  templateUrl: './ui-alert.html',
  styleUrl: './ui-alert.scss',
  host: {
    '[style.display]': "dismissed() ? 'none' : 'block'",
    '[style.width]': "'100%'",
  },
})
export class UiAlert {
  private readonly destroyRef = inject(DestroyRef);

  /** Bold heading line. */
  title = input<string>();
  /** Supporting body line. */
  text = input<string>();
  /** Semantic level — colours + default icon. */
  level = input<UiFeedbackLevel>('default');
  /** Hierarchical intensity (`high` = solid, `low` = subtle). */
  subLevel = input<UiSubLevel>('high');
  /** Rendered scale (`default` | `large`). */
  size = input<UiAlertSize>('default');
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
  /** Auto-dismiss delay in ms. `0` (default) never auto-dismisses. */
  life = input(0, { transform: numberAttribute });
  /** Accessible label of the alert region (screen readers). */
  ariaLabel = input<string>();
  /** id of the element labelling the alert region. */
  ariaLabelledBy = input<string>();
  /** Extra class(es) merged onto the alert root. */
  styleClass = input<string>();

  /** Emitted when the alert is dismissed (close button or `life` expiry). */
  close = output<void>();

  /** @ignore Hidden after a dismiss so the close button works standalone. */
  protected readonly dismissed = signal(false);

  /** @ignore Resolved leading icon name (null when hidden). */
  protected readonly iconName = computed<string | null>(() => {
    const icon = this.icon();
    if (icon === false) return null;
    if (typeof icon === 'string') return icon;
    return UI_ALERT_DEFAULT_ICONS[this.level()];
  });

  /** @ignore Leading icon size follows the alert size (Figma). */
  protected readonly iconSize = computed(() => (this.size() === 'large' ? 'default' : 'md'));

  /** @ignore Dismiss icon size follows the alert size (Figma). */
  protected readonly closeIconSize = computed(() => (this.size() === 'large' ? 'md' : 'sm'));

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-alert', `_${this.level()}`, `_${this.subLevel()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    const sc = this.styleClass();
    if (sc) c.push(sc);
    return c.join(' ');
  });

  constructor() {
    // Auto-dismiss timer (browser only). setTimeout — not rAF — so it still
    // fires in a throttled/background tab. Cleared if destroyed first.
    afterNextRender(() => {
      const life = this.life();
      if (life > 0) {
        const id = setTimeout(() => this.dismiss(), life);
        this.destroyRef.onDestroy(() => clearTimeout(id));
      }
    });
  }

  /** @ignore */
  protected onClose(): void {
    this.dismiss();
  }

  /** @ignore Hide the alert and notify the parent. */
  private dismiss(): void {
    if (this.dismissed()) return;
    this.dismissed.set(true);
    this.close.emit();
  }
}
