import {
  Component,
  computed,
  effect,
  inject,
  InjectionToken,
  input,
  isDevMode,
  linkedSignal,
  output,
  Provider,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ThemeService } from '@4sh/ui-kit/theming';
import { BrandService } from '@4sh/ui-kit/theming';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

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
 * bundled: generate it in your app (see `npm run generate:assets` in the
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

/** Cross-instance memoization: the same resolved URL is fetched once (logos repeated across the app). */
const SVG_CACHE = new Map<string, string>();

/**
 * ui-image — theme/brand-aware image.
 *
 * Two sources: `name` (local asset key resolved through `assets-map.json`,
 * theme/brand variants) or `src` (remote/absolute URL — takes precedence).
 * Local `.svg` assets are inlined (`innerHTML`) so they can inherit CSS;
 * remote URLs always render through `<img [ngSrc]>` (never inlined).
 * On load failure the `fallback` local asset is shown, then a token-styled
 * placeholder if the fallback also fails (or none is provided).
 */
@Component({
  selector: 'ui-image',
  templateUrl: './ui-image.html',
  styleUrl: './ui-image.scss',
  imports: [NgOptimizedImage, UiIcon],
})
export class UiImage {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly assetsMap = inject(UI_IMAGE_ASSETS, { optional: true }) ?? {};
  private readonly themeService = inject(ThemeService);
  private readonly brandService = inject(BrandService);

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

  /** Emitted with the failed URL when an image fails to load. */
  loadFailed = output<string>();

  protected readonly isRemote = computed(() => !!this.src());
  /** Inline SVG is reserved for LOCAL assets — a remote `.svg` renders through `<img>` (no XSS surface). */
  protected readonly isInlineSvg = computed(
    () => !this.isRemote() && !!this.name()?.toLowerCase().endsWith('.svg'),
  );

  protected readonly localSrc = computed(() => this.resolveLocal(this.name()));
  protected readonly fallbackSrc = computed(() => this.resolveLocal(this.fallback()));
  protected readonly primarySrc = computed(() => this.src() || this.localSrc());

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

  protected readonly svgContent = computed<SafeHtml | null>(() => {
    if (!this.isInlineSvg()) return null;
    const url = this.localSrc();
    if (!url) return null;
    const raw =
      SVG_CACHE.get(url) ?? (this.svgResource.hasValue() ? this.svgResource.value() : undefined);
    return raw === undefined ? null : this.sanitizer.bypassSecurityTrustHtml(raw);
  });

  protected readonly primaryFailed = computed(() =>
    this.isInlineSvg() ? this.svgResource.status() === 'error' : this.primaryImgFailed(),
  );
  protected readonly showFallback = computed(
    () => this.primaryFailed() && !!this.fallbackSrc() && !this.fallbackImgFailed(),
  );
  protected readonly showPlaceholder = computed(
    () =>
      !this.primarySrc() ||
      (this.primaryFailed() && (!this.fallbackSrc() || this.fallbackImgFailed())),
  );
  protected readonly displayedSrc = computed(() =>
    this.showFallback() ? this.fallbackSrc() : this.primarySrc(),
  );

  protected readonly cssWidth = computed(() =>
    this.width() != null ? `${this.width()}${this.widthUnit() || 'px'}` : null,
  );
  protected readonly cssHeight = computed(() =>
    this.height() != null ? `${this.height()}${this.heightUnit() || 'px'}` : null,
  );

  constructor() {
    // Side effect only: populate the module-level SVG cache once a fetch resolves.
    effect(() => {
      if (!this.isInlineSvg()) return;
      const url = this.localSrc();
      if (url && this.svgResource.hasValue()) SVG_CACHE.set(url, this.svgResource.value());
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
