import { Component, computed, effect, inject, input, isDevMode, linkedSignal, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import assetsMapRaw from '../../../../../assets/assets-map.json';
import { ThemeService } from '@app/core/service/theme.service';
import { BrandService } from '@app/core/service/brand.service';
import { UiIcon } from '@4sh/ui-kit/ui-icon';

interface ModeMap {
  base?: string;
  light?: string;
  dark?: string;
}
type ThemeMap = Record<string, ModeMap>;
const assetsMap = assetsMapRaw as Record<string, ThemeMap>;

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
  protected readonly isInlineSvg = computed(() => !this.isRemote() && !!this.name()?.toLowerCase().endsWith('.svg'));

  protected readonly localSrc = computed(() => this.resolveLocal(this.name()));
  protected readonly fallbackSrc = computed(() => this.resolveLocal(this.fallback()));
  protected readonly primarySrc = computed(() => this.src() || this.localSrc());

  // Failure flags auto-reset when their source URL changes (theme/brand/src swap → automatic retry).
  private readonly primaryImgFailed = linkedSignal({ source: this.primarySrc, computation: () => false });
  private readonly fallbackImgFailed = linkedSignal({ source: this.fallbackSrc, computation: () => false });

  private readonly svgResource = httpResource.text(() => {
    if (!this.isInlineSvg()) return undefined;
    const url = this.localSrc();
    return !url || SVG_CACHE.has(url) ? undefined : url;
  });

  protected readonly svgContent = computed<SafeHtml | null>(() => {
    if (!this.isInlineSvg()) return null;
    const url = this.localSrc();
    if (!url) return null;
    const raw = SVG_CACHE.get(url) ?? (this.svgResource.hasValue() ? this.svgResource.value() : undefined);
    return raw === undefined ? null : this.sanitizer.bypassSecurityTrustHtml(raw);
  });

  protected readonly primaryFailed = computed(() =>
    this.isInlineSvg() ? this.svgResource.status() === 'error' : this.primaryImgFailed(),
  );
  protected readonly showFallback = computed(
    () => this.primaryFailed() && !!this.fallbackSrc() && !this.fallbackImgFailed(),
  );
  protected readonly showPlaceholder = computed(
    () => !this.primarySrc() || (this.primaryFailed() && (!this.fallbackSrc() || this.fallbackImgFailed())),
  );
  protected readonly displayedSrc = computed(() => (this.showFallback() ? this.fallbackSrc() : this.primarySrc()));

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
          console.warn('[ui-image] Neither `src` nor `name` is set — the placeholder is displayed.');
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

    const fileEntry = assetsMap[filename];
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

  private buildPath(themeName: string, variants: ModeMap, currentMode: 'light' | 'dark', filename: string): string {
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
