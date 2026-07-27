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
import { UiIcon, UiIconType } from '@app/shared/components/ui/ui-icon/ui-icon';

export type EmptyStateSize = 'default' | 'small';

/**
 * Slot markers — apply them (attribute or element form) on the content you project
 * into a `<ui-empty-state>` to route it to the matching region. They carry no
 * behaviour; the component queries their presence to render the surrounding structure.
 *
 *   <ui-empty-state title="Aucun résultat" description="Essayez d'élargir vos filtres.">
 *     <img uiEmptyStateMedia src="/illustrations/empty.svg" alt="" />
 *     <div uiEmptyStateActions>
 *       <ui-button label="Réinitialiser les filtres" level="low" />
 *     </div>
 *   </ui-empty-state>
 */

/** Visual region (illustration, image, custom SVG…). Overrides the `icon` shortcut. */
@Directive({ selector: '[uiEmptyStateMedia], ui-empty-state-media' })
export class UiEmptyStateMedia {}

/** Actions region (buttons, links…), rendered below the text. */
@Directive({ selector: '[uiEmptyStateActions], ui-empty-state-actions' })
export class UiEmptyStateActions {}

/**
 * ui-empty-state — communicates the absence of content (empty list, no search
 * result, cleared inbox…) and offers a way forward.
 *
 * Headless: a centered vertical stack composing an optional visual (illustration
 * slot or `icon` shortcut), a title, a description, an optional free body slot and
 * an actions slot. Every region renders only when it holds content, so no empty
 * wrapper (and no phantom gap) is emitted. All values come from design tokens.
 *
 * The most common case needs no imports — pass `title`/`description`/`icon` and drop
 * actions into the default flow via the `uiEmptyStateActions` marker.
 */
@Component({
  selector: 'ui-empty-state',
  imports: [UiIcon],
  templateUrl: './ui-empty-state.html',
  styleUrl: './ui-empty-state.scss',
})
export class UiEmptyState {
  /** Main line — what is empty / why (recommended). */
  title = input<string>();
  /** Supporting line under the title (guidance, next step). */
  description = input<string>();
  /** FontAwesome icon name — shortcut for the visual (ignored if a media slot is projected). */
  icon = input<string>();
  /** Icon variant, forwarded to `ui-icon`. */
  iconType = input<UiIconType>('solid');
  /** Density. */
  size = input<EmptyStateSize>('default');
  /**
   * Whether the visual region is shown. `true` by default; set `false` to keep a
   * text-only empty state without removing the projected media / `icon` from markup.
   */
  showMedia = input(true, { transform: booleanAttribute });
  /** Accessible name for the region landmark (adds `role="region"`). */
  ariaLabel = input<string>();
  /** Id of the element labelling the region landmark (adds `role="region"`). */
  ariaLabelledBy = input<string>();

  /** @ignore */
  protected readonly mediaSlot = contentChild(UiEmptyStateMedia);
  /** @ignore */
  protected readonly actionsSlot = contentChild(UiEmptyStateActions);

  /** @ignore */
  private readonly bodyWrap = viewChild<ElementRef<HTMLElement>>('bodyWrap');
  /** @ignore Default (body) content actually projected (detected after rendering). */
  private readonly hasProjectedBody = signal(false);

  constructor() {
    // Detect projected default content (<ng-content>) — SSR-safe (browser only).
    afterNextRender(() => {
      const el = this.bodyWrap()?.nativeElement;
      const has =
        !!el &&
        Array.from(el.childNodes).some(
          (n) =>
            n.nodeType === Node.ELEMENT_NODE ||
            (n.nodeType === Node.TEXT_NODE && !!n.textContent?.trim()),
        );
      this.hasProjectedBody.set(has);
    });
  }

  /** @ignore An icon shortcut is provided. */
  protected readonly hasIcon = computed(() => !!this.icon());
  /** @ignore A media slot is projected. */
  protected readonly hasMedia = computed(() => !!this.mediaSlot());
  /** @ignore The visual region is shown and has something to render. */
  protected readonly showVisual = computed(
    () => this.showMedia() && (this.hasMedia() || this.hasIcon()),
  );

  /** @ignore */
  protected readonly hasTitle = computed(() => !!this.title());
  /** @ignore */
  protected readonly hasDescription = computed(() => !!this.description());
  /** @ignore Free body content projected between the description and the actions. */
  protected readonly hasBody = computed(() => this.hasProjectedBody());
  /** @ignore The text region (title / description / body) has content. */
  protected readonly hasText = computed(
    () => this.hasTitle() || this.hasDescription() || this.hasBody(),
  );

  /** @ignore An actions slot is projected. */
  protected readonly hasActions = computed(() => !!this.actionsSlot());

  /** @ignore Landmark role only when the region carries an accessible name. */
  protected readonly role = computed(() =>
    this.ariaLabel() || this.ariaLabelledBy() ? 'region' : null,
  );

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-empty-state'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    return c.join(' ');
  });
}
