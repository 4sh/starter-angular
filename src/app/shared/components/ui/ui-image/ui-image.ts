import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { UiSpinner } from '@app/shared/components/ui/informative/ui-spinner/ui-spinner';
import { UiLightbox } from '@app/shared/components/ui/layout/ui-lightbox/ui-lightbox';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

@Component({
    selector: 'ui-image',
    imports: [NgOptimizedImage, NgTemplateOutlet, UiSpinner, UiLightbox, UiIcon],
    templateUrl: './ui-image.html',
    styleUrl: './ui-image.scss',
    host: {
        '[class.ui-image-fill]': 'fill()',
        '[style.--ui-image-object-fit]': 'objectFit()',
    },
})
export class UiImage {
    private http = inject(HttpClient);
    private sanitizer = inject(DomSanitizer);

    /** Source: asset path or URL, provided directly by the consumer. */
    src = input.required<string>();
    alt = input<string>();
    width = input<string | number>();
    widthUnit = input<string>();
    height = input<string | number>();
    heightUnit = input<string>();
    /** Fills the parent container (parent needs `position: relative`). */
    fill = input(false);
    /** Loads the image eagerly with high priority (reserve for the LCP image). */
    priority = input(false);
    /** How the image is fit inside its box. */
    objectFit = input<'contain' | 'cover' | 'fill' | 'none' | 'scale-down'>('contain');
    /** Fetches the image via an authenticated HTTP request (blob) instead of a direct `src`. */
    authenticated = input(false);
    /** Enables a fullscreen zoomable preview on click. */
    preview = input(false);

    isSvg = computed(() => this.src().toLowerCase().endsWith('.svg'));
    svgContent = signal<SafeHtml | null>(null);
    blobSafeUrl = signal<SafeUrl | null>(null);
    loading = signal(false);
    previewOpen = signal(false);
    zoom = signal(1);
    rotation = signal(0);
    previewTransform = computed(() => `scale(${this.zoom()}) rotate(${this.rotation()}deg)`);

    constructor() {
        // SVG: loaded and injected inline so it stays stylable via CSS.
        effect((onCleanup) => {
            const url = this.src();
            if (!this.isSvg() || !url) return;
            const sub = this.http.get(url, { responseType: 'text' }).subscribe({
                next: (html) => this.svgContent.set(this.sanitizer.bypassSecurityTrustHtml(html)),
                error: (err) => console.error(`SVG Error: ${url}`, err),
            });
            onCleanup(() => sub.unsubscribe());
        });

        // Authenticated image (opt-in): fetched as a blob, shown once loaded.
        effect((onCleanup) => {
            const url = this.src();
            this.blobSafeUrl.set(null);
            if (!this.authenticated() || this.isSvg() || !url) {
                this.loading.set(false);
                return;
            }
            this.loading.set(true);
            let objectUrl: string | null = null;
            const sub = this.http.get(url, { responseType: 'blob' }).subscribe({
                next: (blob) => {
                    objectUrl = URL.createObjectURL(blob);
                    this.blobSafeUrl.set(this.sanitizer.bypassSecurityTrustUrl(objectUrl));
                    this.loading.set(false);
                },
                error: () => {
                    this.blobSafeUrl.set(null);
                    this.loading.set(false);
                },
            });
            onCleanup(() => {
                sub.unsubscribe();
                if (objectUrl) URL.revokeObjectURL(objectUrl);
            });
        });
    }

    openPreview(): void {
        if (!this.preview()) return;
        this.zoom.set(1);
        this.rotation.set(0);
        this.previewOpen.set(true);
    }

    zoomIn(): void {
        this.zoom.update((z) => Math.min(z + 0.25, 4));
    }

    zoomOut(): void {
        this.zoom.update((z) => Math.max(z - 0.25, 0.5));
    }

    rotateLeft(): void {
        this.rotation.update((r) => (r - 90 + 360) % 360);
    }

    rotateRight(): void {
        this.rotation.update((r) => (r + 90) % 360);
    }
}
