import { Directive, output } from '@angular/core';

/** Keyframes run by the `browser-fill` SCSS mixin while the browser autofills the field. */
const AUTOFILL_ANIMATION = 'ui-browser-fill';

/**
 * Reports the events through which the browser may write a value into a native
 * `<input>`/`<textarea>` without an `input` event:
 *
 * - its autofill: the `:-webkit-autofill` animation declared by the
 *   `utils.browser-fill` mixin, which the host stylesheet must include;
 * - a `change`.
 *
 * Either may follow an edit the host already handled through `input`: the
 * host syncs only when the native value differs from the one it renders, so
 * nothing is emitted twice. An `input` sent by the browser to a field without
 * focus already reaches the host's own `(input)` handler: `hasFocus()` tells
 * it apart from a keystroke.
 */
@Directive({
  selector: '[uiBrowserFill]',
  host: {
    class: 'ui-browser-fill',
    '(change)': 'browserFill.emit($event)',
    '(animationstart)': 'onAnimationStart($event)',
  },
})
export class UiBrowserFill {
  /** Emitted with the change/animation event that may reveal a fill. */
  readonly browserFill = output<Event>();

  protected onAnimationStart(event: AnimationEvent): void {
    if (event.animationName.endsWith(AUTOFILL_ANIMATION)) this.browserFill.emit(event);
  }
}

/** Whether `element` holds the focus (works inside a shadow root). */
export function hasFocus(element: Element): boolean {
  return (element.getRootNode() as Document | ShadowRoot).activeElement === element;
}
