import { Component, computed, input, TemplateRef, ViewEncapsulation } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** Side of the trigger the tooltip is displayed on (drives the arrow position). */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Internal visual panel of the tooltip (the "bubble" + arrow).
 *
 * Rendered inside a CDK overlay by the {@link UiTooltip} directive — never used
 * directly in templates. Styling is co-located in `ui-tooltip.scss` and fully
 * token-driven; every value is overridable through the `--ui-tooltip-*` CSS hooks.
 */
@Component({
  selector: 'ui-tooltip',
  imports: [NgTemplateOutlet],
  templateUrl: './ui-tooltip-panel.html',
  styleUrl: './ui-tooltip.scss',
  encapsulation: ViewEncapsulation.Emulated,
})
export class UiTooltipPanel {
  /** Plain-text (or HTML when `escape=false`) content. Ignored if `template` is set. */
  text = input<string>();
  /** Rich content rendered through `ngTemplateOutlet`. Takes precedence over `text`. */
  template = input<TemplateRef<unknown>>();
  /** Context object forwarded to `template`. */
  templateContext = input<unknown>();
  /** When true (default) content is text; when false, `text` is bound as sanitized HTML. */
  escape = input(true);
  /** Extra class(es) applied to the tooltip root for one-off customization. */
  styleClass = input<string>();
  /** Side the tooltip sits on — sets the arrow orientation. */
  position = input<TooltipPosition>('top');
  /** DOM id, wired to the trigger via `aria-describedby`. */
  tooltipId = input<string>();
  /** Whether the panel is in its shown (opaque) state — drives the fade transition. */
  visible = input(false);
  /** When true the panel accepts pointer events (autoHide disabled). */
  interactive = input(false);

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-tooltip', `_${this.position()}`];
    if (this.visible()) c.push('_visible');
    if (this.interactive()) c.push('_interactive');
    const sc = this.styleClass();
    if (sc) c.push(sc);
    return c.join(' ');
  });
}
