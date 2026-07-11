import {
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  isDevMode,
  output,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

export type LinkSize = 'default' | 'small';

/**
 * ui-link — inline textual link (renders a real <a>), for prose / navigation.
 *
 * Choose by semantics, not appearance:
 *   • Something that NAVIGATES (URL/route) → this component, or `ui-button`
 *     with `href`/`routerLink` when it must look like a button.
 *   • Something that triggers an ACTION (submit, open a modal…) → `ui-button`.
 *
 * Accepts a plain `href` (external) or a `routerLink` (internal navigation).
 * Interactive states (hover/focus/pressed) are CSS-driven, never Angular props.
 */
@Component({
  selector: 'ui-link',
  imports: [UiIcon, RouterLink, NgTemplateOutlet],
  templateUrl: './ui-link.html',
  styleUrl: './ui-link.scss',
  host: { '[style.display]': "'inline-flex'" },
})
export class UiLink {
  /** Visible link text (optional when using projected content or icon-only). */
  label = input<string>();
  ariaLabel = input<string>();
  size = input<LinkSize>('default');

  // --- Destination -----------------------------------------------------
  /** External / plain URL. */
  href = input<string>();
  /** Angular router target (internal navigation, uses RouterLink). */
  routerLink = input<string | unknown[]>();
  /** Anchor target (e.g. "_blank"). */
  target = input<string>();
  /** Anchor rel. Defaults to "noopener noreferrer" for external links. */
  rel = input<string>();
  /** Convenience for external links: sets target="_blank" + a safe rel. */
  external = input(false, { transform: booleanAttribute });

  // --- Icons (presence-based, à la ui-button) --------------------------
  /** FontAwesome icon name shown before the text. */
  iconLeft = input<string>();
  /** FontAwesome icon name shown after the text. */
  iconRight = input<string>();

  disabled = input(false, { transform: booleanAttribute });
  tabindex = input<number>();

  /** Emitted on click (never when disabled). Navigation stays native. */
  linkClick = output<MouseEvent>();
  /** Fired when the link receives focus. */
  linkFocus = output<FocusEvent>();
  /** Fired when the link loses focus. */
  linkBlur = output<FocusEvent>();

  /** @ignore */
  private readonly hostEl = viewChild.required<ElementRef<HTMLAnchorElement>>('host');

  constructor() {
    // A11y safeguard: an icon-only link must have an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this.isIconOnly() && !this.accessibleLabel()) {
          console.warn(
            '[ui-link] Lien icon-only sans nom accessible : renseignez `ariaLabel` (ou `label`).',
          );
        }
      });
    }
  }

  /** @ignore Icon size follows the text size. */
  protected readonly iconSize = computed(() => (this.size() === 'small' ? 'sm' : 'default'));

  /** @ignore No visible text but at least one icon → icon-only. */
  protected readonly isIconOnly = computed(
    () => !this.label() && (!!this.iconLeft() || !!this.iconRight()),
  );

  /** @ignore Link mode uses the Angular RouterLink directive. */
  protected readonly useRouterLink = computed(() => this.routerLink() != null);

  /** @ignore Effective anchor target (external forces _blank). */
  protected readonly computedTarget = computed(() => this.target() ?? (this.external() ? '_blank' : null));

  /** @ignore Anchor rel: explicit, or a safe default for _blank / external. */
  protected readonly computedRel = computed(() => {
    if (this.rel()) return this.rel()!;
    if (this.computedTarget() === '_blank') return 'noopener noreferrer';
    return null;
  });

  /** @ignore Tabindex: -1 when disabled (an <a> has no native disabled). */
  protected readonly linkTabindex = computed(() => (this.disabled() ? -1 : (this.tabindex() ?? null)));

  /** @ignore Accessible name: explicit, or the label when icon-only. */
  protected readonly accessibleLabel = computed(() => {
    if (this.ariaLabel()) return this.ariaLabel()!;
    if (this.isIconOnly()) return this.label() ?? null;
    return null;
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-link'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.isIconOnly()) c.push('_icon-only');
    if (this.disabled()) c.push('_disabled');
    return c.join(' ');
  });

  /** Sets the focus on the link (useful for controlling focus programmatically). */
  focus(options?: FocusOptions): void {
    this.hostEl().nativeElement.focus(options);
  }

  /** @ignore */
  protected onClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.linkClick.emit(event);
  }
}
