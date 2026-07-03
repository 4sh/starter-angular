import {Component, Input, signal, inject, computed, effect} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {subdomain} from '@app/app.config';
import assetsMapRaw from '../../../../../assets/assets-map.json';
import {ThemeService} from "@app/core/service/theme.service";
import {BrandService} from "@app/core/service/brand.service";

type ModeMap = { base?: string; light?: string; dark?: string };
type ThemeMap = Record<string, ModeMap>;
const assetsMap = assetsMapRaw as Record<string, ThemeMap>;

const SVG_CACHE = new Map<string, string>();

@Component({
    selector: 'ui-image',
    templateUrl: './ui-image.html',
    styleUrls: ['./ui-image.scss'],
    standalone: true,
    imports: [CommonModule, NgOptimizedImage],
})
export class UiImage {
    private http = inject(HttpClient);
    private sanitizer = inject(DomSanitizer);
    private themeService = inject(ThemeService);
    private brandService = inject(BrandService);

    @Input({required: true}) set name(val: string) {
        this._name.set(val);
    }

    @Input() priority = false;
    @Input() fill = false;
    @Input() width?: string | number;
    @Input() widthUnit?: string;
    @Input() height?: string | number;
    @Input() heightUnit?: string;
    @Input() alt?: string;

    private _name = signal('');

    isSvg = computed(() => this._name().toLowerCase().endsWith('.svg'));

    finalSrc = computed(() => {
        const filename = this._name();
        const mode = this.themeService.currentMode();

        const brand = this.brandService.currentBrand();

        if (!filename) return '';

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
    });

    svgContent = signal<SafeHtml | null>(null);

    constructor() {
        effect(() => {
            const src = this.finalSrc();
            if (this.isSvg() && src) this.loadSvg(src);
        });
    }

    private resolvePath(themeFolder: string, variants: ModeMap, currentMode: 'light'|'dark', filename: string): string | null {
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

    private loadSvg(url: string) {
        if (SVG_CACHE.has(url)) {
            this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(SVG_CACHE.get(url)!));
            return;
        }
        this.http.get(url, {responseType: 'text'}).subscribe({
            next: (html) => {
                SVG_CACHE.set(url, html);
                this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
            },
            error: (err) => console.error(`SVG Error: ${url}`, err)
        });
    }
}
