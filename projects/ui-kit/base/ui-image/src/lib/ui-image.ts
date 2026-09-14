import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  InjectionToken,
  input,
  isDevMode,
  linkedSignal,
  model,
  numberAttribute,
  output,
  PLATFORM_ID,
  Provider,
  signal,
  TemplateRef,
} from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ThemeService } from '@4sh/ui-kit/theming';
import { BrandService } from '@4sh/ui-kit/theming';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiSpinner } from '@4sh/ui-kit/informative/ui-spinner';
import { UiMotion } from '@4sh/ui-kit/motion';
import { sanitizeInlineSvg } from './ui-image-svg';
import { UiImagePreview } from './ui-image-preview';

interface ModeMap {
  base?: string;
  light?: string;
  dark?: string;
}
type ThemeMap = Record<string, ModeMap>;
/** filename → { brand|'common' → { base|light|dark → extension } }. */
export type UiImageAssetsMap = Record<string, ThemeMap>;

/**
 * Map of the LOCAL assets available to `ui-image` (its `name` input).
 *
 * The kit cannot know a project's assets, so the map is injected rather than
 * bundled: generate it in your app (see the `generate:assets` script in the
 * starter, which writes `src/assets/assets-map.json`) and provide it with
 * `provideUiImageAssets()`. Without it, `name` resolves to nothing and the
 * component falls back to its placeholder — `src` (remote URLs) still works.
 */
export const UI_IMAGE_ASSETS = new InjectionToken<UiImageAssetsMap>('UI_IMAGE_ASSETS');

/**
 * Registers the local asset map consumed by `ui-image`.
 *
 * ```ts
 * import assetsMap from './assets/assets-map.json';
 * providers: [provideUiImageAssets(assetsMap)]
 * ```
 */
export function provideUiImageAssets(map: UiImageAssetsMap): Provider {
  return { provide: UI_IMAGE_ASSETS, useValue: map };
}

/**
 * Cross-instance memoization: the same resolved URL is fetched once (logos
 * repeated across the app).
 *
 * Holds the **scrubbed** markup, never the raw response — nothing that skipped
 * `sanitizeInlineSvg()` may ever be read back out of here.
 */
const SVG_CACHE = new Map<string, string>();

/** Payload carried in the URL itself (`data:image/png;base64,…`). */
const DATA_URL = /^data:/i;

/**
 * ui-image — theme/brand-aware image.
 *
 * Three sources: `name` (local asset key resolved through `assets-map.json`,
 * theme/brand variants), `src` (remote/absolute URL — takes precedence), and
 * `src` + `secured` (the URL is fetched through `HttpClient`, so the app's
 * interceptors authenticate it, and the response `Blob` is shown from an object
 * URL revoked with the component).
 * Local `.svg` assets are inlined (`innerHTML`) so they can inherit CSS — after
 * being scrubbed by `sanitizeInlineSvg()`; remote URLs always render through
 * `<img [ngSrc]>` (never inlined), except `data:`/`blob:` payloads, which
 * `NgOptimizedImage` rejects and a plain `<img>` renders.
 * On load failure the `fallback` local asset is shown, then a token-styled
 * placeholder if the fallback also fails (or none is provided).
 *
 * `preview` turns the image into a trigger for the enlarged view
 * (`ui-image-preview`): zoom, rotation, pan, reset, optional download.
 */
@Component({
  selector: 'ui-image',
  templateUrl: './ui-image.html',
  styleUrl: './ui-image.scss',
  imports: [NgOptimizedImage, NgTemplateOutlet, UiIcon, UiSpinner, UiMotion, UiImagePreview],
})
export class UiImage {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly assetsMap = inject(UI_IMAGE_ASSETS, { optional: true }) ?? {};
  private readonly themeService = inject(ThemeService);
  private readonly brandService = inject(BrandService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Local asset key in `assets-map.json` (theme/brand-aware resolution). */
  name = input<string>();
  /** Remote/absolute URL, rendered via `NgOptimizedImage` — takes precedence over `name`. */
  src = input<string>();
  /** Local asset name (`assets-map.json` key) displayed when the main image fails to load. */
  fallback = input<string>();
  priority = input(false);
  fill = input(false);
  width = input<string | number>();
  widthUnit = input<string>();
  height = input<string | number>();
  heightUnit = input<string>();
  alt = input<string>();

  /**
   * Fetch `src` through `HttpClient` instead of letting the browser load it.
   *
   * That is what an endpoint behind an `Authorization` header needs: an `<img
   * src>` is a plain browser request, which carries no interceptor and no
   * bearer token. The response `Blob` is shown from an object URL, revoked as
   * soon as the source changes or the component goes away.
   *
   * Cross-origin still applies: the endpoint must answer the CORS preflight
   * (`Access-Control-Allow-Origin`, and `Access-Control-Allow-Headers` for the
   * auth header) — an `<img>` would have displayed it without any of that.
   */
  secured = input(false, { transform: booleanAttribute });
  /** Send cookies/TLS credentials with the `secured` request (cross-origin sessions). */
  withCredentials = input(false, { transform: booleanAttribute });
  /** Visible text of the loading indicator shown while a `secured` fetch is in flight. */
  loadingLabel = input<string>();
  /** Accessible name of that loading indicator. */
  loadingAriaLabel = input('Chargement de l’image');

  /** Clicking the image opens the enlarged view (`ui-image-preview`). */
  preview = input(false, { transform: booleanAttribute });
  /** Enlarged view open state (two-way — set it to open the preview yourself). */
  previewVisible = model(false);
  /** Accessible name of the trigger (defaults to the image's own `alt`). */
  previewAriaLabel = input<string>();
  /** Accessible name of the enlarged view dialog. */
  previewDialogAriaLabel = input('Aperçu de l’image');
  /** Zoom increment of one toolbar click, wheel notch or `+`/`-` press in the preview. */
  zoomStep = input(0.25, { transform: numberAttribute });
  /** Lower zoom bound in the preview. */
  minZoom = input(0.5, { transform: numberAttribute });
  /** Upper zoom bound in the preview. */
  maxZoom = input(4, { transform: numberAttribute });
  /** Offer a download action in the preview toolbar. */
  downloadable = input(false, { transform: booleanAttribute });
  /** Filename proposed by that download action. */
  downloadName = input<string>();

  /** Emitted with the failed URL when an image fails to load. */
  loadFailed = output<string>();

  /**
   * Replaces the hover indicator of the `preview` mode (the magnifier). Rendered
   * over the image, decorative — the accessible name stays on the trigger.
   *
   * ```html
   * <ui-image src="…" preview>
   *   <ng-template #previewIndicator>Agrandir</ng-template>
   * </ui-image>
   * ```
   */
  protected readonly previewIndicator = contentChild<TemplateRef<unknown>>('previewIndicator');

  protected readonly isRemote = computed(() => !!this.src());
  /** Inline SVG is reserved for LOCAL assets — a remote `.svg` renders through `<img>` (no XSS surface). */
  protected readonly isInlineSvg = computed(
    () => !this.isRemote() && !!this.name()?.toLowerCase().endsWith('.svg'),
  );
  /** `secured` only means anything with a `src` to fetch. */
  protected readonly isSecured = computed(() => this.secured() && !!this.src());
  /** A `data:` payload is already the image — `NgOptimizedImage` refuses it. */
  protected readonly isDataUrl = computed(() => DATA_URL.test(this.src() ?? ''));

  protected readonly localSrc = computed(() => this.resolveLocal(this.name()));
  protected readonly fallbackSrc = computed(() => this.resolveLocal(this.fallback()));

  // --- Secured source (HttpClient → Blob → object URL) ------------------
  private readonly blobResource = httpResource.blob(() =>
    this.isSecured() ? { url: this.src()!, withCredentials: this.withCredentials() } : undefined,
  );
  private readonly blobUrl = signal<string | null>(null);

  protected readonly securedLoading = computed(
    () => this.isSecured() && this.blobResource.isLoading(),
  );
  private readonly securedFailed = computed(
    () => this.isSecured() && this.blobResource.status() === 'error',
  );

  protected readonly primarySrc = computed(() =>
    this.isSecured() ? (this.blobUrl() ?? '') : this.src() || this.localSrc(),
  );

  // Failure flags auto-reset when their source URL changes (theme/brand/src swap → automatic retry).
  private readonly primaryImgFailed = linkedSignal({
    source: this.primarySrc,
    computation: () => false,
  });
  private readonly fallbackImgFailed = linkedSignal({
    source: this.fallbackSrc,
    computation: () => false,
  });

  private readonly svgResource = httpResource.text(() => {
    if (!this.isInlineSvg()) return undefined;
    const url = this.localSrc();
    return !url || SVG_CACHE.has(url) ? undefined : url;
  });

  /**
   * The inlined SVG, scrubbed then trusted.
   *
   * FSHSP-177 — this is the kit's ONLY `bypassSecurityTrust*()`. It is not
   * avoidable: Angular's HTML sanitizer strips `<svg>` wholesale, so passing the
   * asset through `sanitize(SecurityContext.HTML, …)` would render nothing, and
   * inlining is the whole point (the asset inherits `currentColor` and the
   * theme's CSS — an `<img>` cannot). What makes the bypass defensible is that
   * the markup went through `sanitizeInlineSvg()` first: scripts, `foreignObject`,
   * SMIL, event handlers and non-navigational references are already gone.
   * Justified in `docs/SECURITY-PRACTICES.md`.
   */
  protected readonly svgContent = computed<SafeHtml | null>(() => {
    if (!this.isInlineSvg()) return null;
    const url = this.localSrc();
    if (!url) return null;
    const safe =
      SVG_CACHE.get(url) ??
      (this.svgResource.hasValue() ? sanitizeInlineSvg(this.svgResource.value()) : undefined);
    /* eslint-disable-next-line no-restricted-syntax -- EXCEPTION JUSTIFIÉE :
       seul bypass du kit. Inévitable (l'assainisseur d'Angular supprime `<svg>`
       en entier) et sûr parce que `sanitizeInlineSvg()` a déjà retiré scripts,
       foreignObject, SMIL, gestionnaires d'événements et références non
       navigationnelles. Registre : docs/SECURITY-PRACTICES.md. */
    return safe === undefined ? null : this.sanitizer.bypassSecurityTrustHtml(safe);
  });

  protected readonly primaryFailed = computed(() => {
    if (this.isInlineSvg()) return this.svgResource.status() === 'error';
    return this.securedFailed() || this.primaryImgFailed();
  });
  protected readonly showFallback = computed(
    () => this.primaryFailed() && !!this.fallbackSrc() && !this.fallbackImgFailed(),
  );
  protected readonly showPlaceholder = computed(
    () =>
      !this.securedLoading() &&
      (!this.primarySrc() ||
        (this.primaryFailed() && (!this.fallbackSrc() || this.fallbackImgFailed()))),
  );
  protected readonly displayedSrc = computed(() =>
    this.showFallback() ? this.fallbackSrc() : this.primarySrc(),
  );
  /** `blob:`/`data:` bypass `NgOptimizedImage`; a local fallback never does. */
  protected readonly isRawSrc = computed(
    () => !this.showFallback() && (this.isSecured() || this.isDataUrl()),
  );

  /** The image is a preview trigger only once there is something to enlarge. */
  protected readonly canPreview = computed(
    () => this.preview() && !this.showPlaceholder() && !this.securedLoading(),
  );

  protected readonly cssWidth = computed(() =>
    this.width() != null ? `${this.width()}${this.widthUnit() || 'px'}` : null,
  );
  protected readonly cssHeight = computed(() =>
    this.height() != null ? `${this.height()}${this.heightUnit() || 'px'}` : null,
  );

  constructor() {
    // Side effect only: populate the module-level SVG cache once a fetch
    // resolves. Scrubbed on the way in — the cache is read straight into the
    // bypass, so it must never hold a raw response.
    effect(() => {
      if (!this.isInlineSvg()) return;
      const url = this.localSrc();
      if (url && this.svgResource.hasValue())
        SVG_CACHE.set(url, sanitizeInlineSvg(this.svgResource.value()));
    });

    // The object URL's whole lifetime: created when a Blob arrives, revoked by
    // the cleanup — which runs before the next source AND on destroy. That is
    // what keeps a list of secured images from leaking one URL per render.
    effect((onCleanup) => {
      const blob = this.blobResource.hasValue() ? this.blobResource.value() : undefined;
      if (!blob || !this.isBrowser) {
        this.blobUrl.set(null);
        return;
      }
      const url = URL.createObjectURL(blob);
      this.blobUrl.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });

    // A failed fetch never reaches an `<img>`, so `(error)` cannot report it.
    effect(() => {
      if (this.securedFailed()) this.loadFailed.emit(this.src()!);
    });

    // Nothing left to enlarge (source swapped, load failed): close rather than
    // leave the dialog on a stale image.
    effect(() => {
      if (this.previewVisible() && !this.canPreview()) this.previewVisible.set(false);
    });

    if (isDevMode()) {
      effect(() => {
        if (this.src() && this.name()) {
          console.warn('[ui-image] `src` and `name` are both set — `src` takes precedence.');
        }
        if (!this.src() && !this.name()) {
          console.warn(
            '[ui-image] Neither `src` nor `name` is set — the placeholder is displayed.',
          );
        }
        if (this.secured() && !this.src()) {
          console.warn('[ui-image] `secured` has no effect without `src` — nothing to fetch.');
        }
        if (this.preview() && !this.alt() && !this.previewAriaLabel()) {
          console.warn(
            '[ui-image] `preview` renders a button with no accessible name — set `alt` or `previewAriaLabel`.',
          );
        }
      });
    }
  }

  protected onImgError(): void {
    const failed = this.displayedSrc();
    if (this.showFallback()) this.fallbackImgFailed.set(true);
    else this.primaryImgFailed.set(true);
    if (failed) this.loadFailed.emit(failed);
  }

  private resolveLocal(filename: string | undefined): string {
    if (!filename) return '';
    const mode = this.themeService.currentMode();
    const brand = this.brandService.currentBrand();

    const fileEntry = this.assetsMap[filename];
    if (!fileEntry) return '';

    if (fileEntry[brand]) {
      const path = this.resolvePath(brand, fileEntry[brand], mode, filename);
      if (path) return path;
    }

    if (fileEntry['common']) {
      return this.buildPath('common', fileEntry['common'], mode, filename);
    }

    return '';
  }

  private resolvePath(
    themeFolder: string,
    variants: ModeMap,
    currentMode: 'light' | 'dark',
    filename: string,
  ): string | null {
    if (variants[currentMode]) {
      const type = variants[currentMode]!;
      return `assets/img/${themeFolder}/${type}/${currentMode}/${filename}`;
    }

    if (variants.base) {
      const type = variants.base;
      return `assets/img/${themeFolder}/${type}/${filename}`;
    }

    return null;
  }

  private buildPath(
    themeName: string,
    variants: ModeMap,
    currentMode: 'light' | 'dark',
    filename: string,
  ): string {
    if (variants[currentMode]) {
      const type = variants[currentMode]!;
      return `assets/img/${themeName}/${type}/${currentMode}/${filename}`;
    }

    if (variants.base) {
      const type = variants.base;
      return `assets/img/${themeName}/${type}/${filename}`;
    }

    return '';
  }
}
