import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Auto-dismiss shared by every floating panel of the kit (menu, context menu,
 * popover, select, autocomplete, input-tags, datepicker, tooltip).
 *
 * A CDK overlay lives in `body`, outside the routed view: it only disappears
 * when its host component is destroyed. A panel whose host survives the
 * navigation — declared in an app shell (header, sidebar, layout) — therefore
 * stays on screen over the next page, and lands in the top-left corner as soon
 * as it is re-positioned, because its anchor left the DOM with the previous
 * page (a detached element measures 0×0 at the viewport origin).
 *
 * Call it from the component's constructor (injection context); the
 * subscription is torn down with the component.
 *
 * ```ts
 * constructor() {
 *   closeOnNavigation(() => this.close(false));
 * }
 * ```
 *
 * Only **page** changes dismiss the panel: a navigation that merely rewrites
 * the query string or the fragment (filters, pagination, deep-link state
 * pushed by the panel itself) leaves it open. Without a `Router` in the
 * injector (kit used outside a routed app), this is a no-op.
 *
 * @param close Closing callback — must be idempotent (it may fire on a panel
 * that is already closed) and must not steal focus, the navigation owns it.
 */
export function closeOnNavigation(close: () => void): void {
  const router = inject(Router, { optional: true });
  if (!router) return;

  router.events
    .pipe(
      filter((event): event is NavigationStart => event instanceof NavigationStart),
      // `router.url` is still the current page while the navigation starts.
      filter((event) => pathOf(event.url) !== pathOf(router.url)),
      takeUntilDestroyed(),
    )
    .subscribe(() => close());
}

/** Path part of a serialized URL, query string and fragment removed. */
function pathOf(url: string): string {
  return url.split(/[?#]/)[0];
}
