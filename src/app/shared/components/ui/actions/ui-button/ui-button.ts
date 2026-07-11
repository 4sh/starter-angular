import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  isDevMode,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiLevel } from '@app/shared/types/ui-level';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonSize = 'default' | 'small';
export type ButtonIconPos = 'left' | 'right' | 'top' | 'bottom';
export type ButtonNativeProps = Record<string, string | number | boolean | null | undefined>;

@Component({
  selector: 'ui-button',
  imports: [UiIcon, NgTemplateOutlet, RouterLink],
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.scss',
  host: {
    '[style.display]': "expanded() ? 'flex' : 'inline-flex'",
    '[style.width]': "expanded() ? '100%' : null",
  },
})
export class UiButton {
  label = input<string>();
  ariaLabel = input<string>();
  type = input<ButtonType>('button');
  level = input<UiLevel>('high');
  size = input<ButtonSize>('default');
  icon = input<string>();
  iconPos = input<ButtonIconPos>('left');
  iconOnly = input(false, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });
  loadingIcon = input<string>('circle-notch');
  expanded = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  tabindex = input<number>();
  buttonProps = input<ButtonNativeProps>();
  iconTemplate = input<TemplateRef<unknown>>();
  loadingIconTemplate = input<TemplateRef<unknown>>();

  // --- Link mode (polymorphic host) ------------------------------------
  // When `href` or `routerLink` is set, the host renders a real <a> styled
  // as a button — preserving native anchor behavior (Cmd/Ctrl+click, middle
  // click, "open/copy link"…). No JS-router navigation in a click handler.
  /** External / plain URL. Presence switches the host to an <a>. */
  href = input<string>();
  /** Angular router target. Presence switches the host to an <a> (RouterLink). */
  routerLink = input<string | unknown[]>();
  /** Anchor target (e.g. "_blank"). Only applies in link mode. */
  target = input<string>();
  /** Anchor rel. Defaults to "noopener noreferrer" when target="_blank". */
  rel = input<string>();

  /** Triggered on click (never if disabled or loading). */
  buttonClick = output<MouseEvent>();
  /** Fired when the button receives focus. */
  buttonFocus = output<FocusEvent>();
  /** Fired when the button loses focus. */
  buttonBlur = output<FocusEvent>();

  /** @ignore Host element (either the <button> or the <a>). */
  private readonly hostEl = viewChild.required<ElementRef<HTMLElement>>('host');
  /** @ignore */
  private readonly contentWrap = viewChild<ElementRef<HTMLElement>>('contentWrap');
  /** @ignore Content actually rendered via <ng-content> (detected after rendering). */
  private readonly hasProjectedContent = signal(false);

  constructor() {
    // Detection of rendered content (<ng-content>) — SSR-safe (browser only).
    afterNextRender(() => {
      const el = this.contentWrap()?.nativeElement;
      const has =
        !!el &&
        Array.from(el.childNodes).some(
          (n) =>
            n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && !!n.textContent?.trim()),
        );
      this.hasProjectedContent.set(has);
    });

    // Pass additional native attributes (buttonProps) to the host element.
    effect(() => {
      const el = this.hostEl().nativeElement;
      const props = this.buttonProps() ?? {};
      for (const [key, value] of Object.entries(props)) {
        if (value === null || value === undefined || value === false) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, value === true ? '' : String(value));
        }
      }
    });

    // A11y safeguard: An icon-only button must have an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this.isIconOnly() && !this.accessibleLabel()) {
          console.warn(
            '[ui-button] Bouton icon-only sans nom accessible : renseignez `ariaLabel` (ou `label`).',
          );
        }
      });
    }
  }

  /** @ignore */
  protected readonly iconSize = computed(() => (this.size() === 'small' ? 'sm' : 'default'));

  /** @ignore An icon (or its template) is available. */
  protected readonly hasIcon = computed(() => !!this.icon() || !!this.iconTemplate());

  /** @ignore Visible text content (label or displayed content). */
  protected readonly hasVisibleText = computed(() => !!this.label() || this.hasProjectedContent());

  /** @ignore The icon appears before the content (left/top) or after it (right/bottom). */
  protected readonly iconBefore = computed(() => {
    const pos = this.iconPos();
    return pos === 'left' || pos === 'top';
  });

  /** @ignore Icon-only mode: forced, or inferred (icon only, with no visible text). */
  protected readonly isIconOnly = computed(() => {
    if (this.iconOnly()) return true;
    const pos = this.iconPos();
    if (pos === 'top' || pos === 'bottom') return false;
    return !this.hasVisibleText() && this.hasIcon();
  });

  /** @ignore Accessible name: explicit; otherwise, the label is hidden as “icon-only”; otherwise, the text is visible. */
  protected readonly accessibleLabel = computed(() => {
    if (this.ariaLabel()) return this.ariaLabel()!;
    if (this.isIconOnly()) return this.label() ?? null;
    return null;
  });

  /** @ignore Host renders an <a> (a URL or a router target was provided). */
  protected readonly isLink = computed(() => !!this.href() || this.routerLink() != null);

  /** @ignore Link mode uses the Angular RouterLink directive. */
  protected readonly useRouterLink = computed(() => this.routerLink() != null);

  /** @ignore Anchor rel: explicit, or a safe default for target="_blank". */
  protected readonly computedRel = computed(() => {
    if (this.rel()) return this.rel()!;
    if (this.target() === '_blank') return 'noopener noreferrer';
    return null;
  });

  /** @ignore Anchor tabindex: -1 when disabled (an <a> has no native disabled). */
  protected readonly linkTabindex = computed(() => (this.disabled() ? -1 : (this.tabindex() ?? null)));

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-button', `_${this.level()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.expanded()) c.push('_expanded');
    if (this.isIconOnly()) c.push('_icon-only');
    if (this.loading()) c.push('_loading');
    if (this.isLink() && this.disabled()) c.push('_disabled');
    const pos = this.iconPos();
    if (pos === 'top') c.push('_icon-top');
    else if (pos === 'bottom') c.push('_icon-bottom');
    return c.join(' ');
  });

  /** Sets the focus on the button (useful for controlling focus programmatically). */
  focus(options?: FocusOptions): void {
    this.hostEl().nativeElement.focus(options);
  }

  /** @ignore */
  protected onClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      return;
    }
    this.buttonClick.emit(event);
  }
}
