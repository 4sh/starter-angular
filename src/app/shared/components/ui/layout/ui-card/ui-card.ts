import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  contentChild,
  Directive,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';

export type CardVariant = 'outlined' | 'elevated' | 'flat';

/**
 * Slot markers — apply them (attribute or element form) on the content you project
 * into a `<ui-card>` to route it to the matching region. They carry no behaviour;
 * the card queries their presence to render the surrounding structure.
 *
 *   <ui-card>
 *     <img uiCardMedia … />
 *     <span uiCardTitle>Title</span>
 *     <span uiCardSubtitle>Subtitle</span>
 *     Body content (default slot)
 *     <div uiCardFooter><ui-button … /></div>
 *   </ui-card>
 */
/** Full-bleed media region, rendered above the body (image, illustration…). */
@Directive({ selector: '[uiCardMedia], ui-card-media' })
export class UiCardMedia {}

/** Title region (also settable via the `header` string input). */
@Directive({ selector: '[uiCardTitle], ui-card-title' })
export class UiCardTitle {}

/** Subtitle region (also settable via the `subheader` string input). */
@Directive({ selector: '[uiCardSubtitle], ui-card-subtitle' })
export class UiCardSubtitle {}

/** Footer region (actions, tags…), rendered below the body content. */
@Directive({ selector: '[uiCardFooter], ui-card-footer' })
export class UiCardFooter {}

/**
 * ui-card — flexible container that composes optional regions: media, header
 * (title + subtitle), body content and footer.
 *
 * Headless: renders a neutral `surface` box (border + radius, optional elevation) whose
 * regions are driven by content projection. Each region is rendered only when it holds
 * content, so no empty wrapper (and no phantom gap) is emitted. The most common case —
 * dropping content into the card — needs no imports (default `<ng-content>`); title and
 * subtitle also accept the `header`/`subheader` string inputs. Richer slots use the
 * exported marker directives (`UiCardMedia`, `UiCardTitle`, `UiCardSubtitle`, `UiCardFooter`).
 */
@Component({
  selector: 'ui-card',
  imports: [],
  templateUrl: './ui-card.html',
  styleUrl: './ui-card.scss',
})
export class UiCard {
  /** Title text (convenience shorthand for the `uiCardTitle` slot). */
  header = input<string>();
  /** Subtitle text (convenience shorthand for the `uiCardSubtitle` slot). */
  subheader = input<string>();
  /** Visual treatment of the surface. */
  variant = input<CardVariant>('outlined');
  /**
   * Removes the horizontal gutter of the default content region so it bleeds to
   * the card edges — lets the consumer own the inner layout (e.g. a full-bleed
   * media/color band + a padded paragraph). Re-apply the gutter on inner blocks
   * with `padding-inline: var(--ui-card-padding)`.
   */
  contentFlush = input(false, { transform: booleanAttribute });
  /** Accessible name for the card region (use when the card conveys a landmark). */
  ariaLabel = input<string>();
  /** Id of the element labelling the card region. */
  ariaLabelledBy = input<string>();

  /** @ignore */
  protected readonly titleSlot = contentChild(UiCardTitle);
  /** @ignore */
  protected readonly subtitleSlot = contentChild(UiCardSubtitle);
  /** @ignore */
  protected readonly mediaSlot = contentChild(UiCardMedia);
  /** @ignore */
  protected readonly footerSlot = contentChild(UiCardFooter);

  /** @ignore */
  private readonly contentWrap = viewChild<ElementRef<HTMLElement>>('contentWrap');
  /** @ignore Default content actually projected (detected after rendering). */
  private readonly hasProjectedContent = signal(false);

  constructor() {
    // Detect projected default content (<ng-content>) — SSR-safe (browser only).
    afterNextRender(() => {
      const el = this.contentWrap()?.nativeElement;
      const has =
        !!el &&
        Array.from(el.childNodes).some(
          (n) =>
            n.nodeType === Node.ELEMENT_NODE ||
            (n.nodeType === Node.TEXT_NODE && !!n.textContent?.trim()),
        );
      this.hasProjectedContent.set(has);
    });
  }

  /** @ignore A title is provided (string input or projected slot). */
  protected readonly hasTitle = computed(() => !!this.header() || !!this.titleSlot());
  /** @ignore A subtitle is provided (string input or projected slot). */
  protected readonly hasSubtitle = computed(() => !!this.subheader() || !!this.subtitleSlot());
  /** @ignore The header region (title and/or subtitle) has content. */
  protected readonly hasHeader = computed(() => this.hasTitle() || this.hasSubtitle());
  /** @ignore A media slot is provided. */
  protected readonly hasMedia = computed(() => !!this.mediaSlot());
  /** @ignore A footer slot is provided. */
  protected readonly hasFooter = computed(() => !!this.footerSlot());
  /** @ignore The body has default content. */
  protected readonly hasContent = computed(() => this.hasProjectedContent());

  /** @ignore Render the string title only when no title slot overrides it. */
  protected readonly showHeaderString = computed(() => !!this.header() && !this.titleSlot());
  /** @ignore Render the string subtitle only when no subtitle slot overrides it. */
  protected readonly showSubheaderString = computed(
    () => !!this.subheader() && !this.subtitleSlot(),
  );

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-card', `_${this.variant()}`];
    if (this.hasMedia()) c.push('_has-media');
    return c.join(' ');
  });
}
