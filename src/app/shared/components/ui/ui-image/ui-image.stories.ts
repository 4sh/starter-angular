import { Meta, StoryObj, applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { Component, Input, OnChanges, inject, signal, Injectable, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Imports de votre app

import { ThemeService } from "@app/core/service/theme.service";
import { BrandService } from "@app/core/service/brand.service";

// Imports Storybook
import { addons } from "storybook/preview-api";
import {DARK_MODE_EVENT_NAME} from "@storybook-community/storybook-dark-mode";
import {UiImage} from "@app/shared/components/ui/ui-image/ui-image";

// --- 1. MOCK THEME SERVICE (Gère le Dark Mode via Toolbar) ---
@Injectable()
class MockThemeService implements OnDestroy {
    currentMode = signal<'light' | 'dark'>('light');
    private channel = addons.getChannel();

    constructor() {
        this.channel.on(DARK_MODE_EVENT_NAME, this.handleDarkMode);
    }

    handleDarkMode = (isDark: boolean) => {
        this.currentMode.set(isDark ? 'dark' : 'light');
    };

    ngOnDestroy() {
        this.channel.off(DARK_MODE_EVENT_NAME, this.handleDarkMode);
    }

    setMode(mode: 'light' | 'dark') { this.currentMode.set(mode); }
}

// --- 2. MOCK BRAND SERVICE (Gère le dossier Theme via Controls) ---
@Injectable()
class MockBrandService {
    currentBrand = signal<string>('common');
    setBrand(brand: string) { this.currentBrand.set(brand); }
}

// --- 3. WRAPPER COMPONENT (Sans encart de debug) ---
@Component({
    selector: 'storybook-ui-image-wrapper',
    standalone: true,
    imports: [UiImage, CommonModule],
    template: `
    <ui-image 
        [name]="name" 
        [width]="width" 
        [widthUnit]="widthUnit" 
        [height]="height" 
        [heightUnit]="heightUnit"
        [alt]="alt"
        [priority]="priority"
        [fill]="fill"
    ></ui-image>
  `
})
class StorybookWrapper implements OnChanges {
    themeService = inject(ThemeService) as unknown as MockThemeService;
    brandService = inject(BrandService) as unknown as MockBrandService;

    @Input() name!: string;
    @Input() width?: number;
    @Input() widthUnit: string = 'px';
    @Input() height?: number;
    @Input() heightUnit: string = 'px';
    @Input() alt?: string;
    @Input() priority = false;
    @Input() fill = false;
    @Input() brandName: string = 'common';

    ngOnChanges() {
        this.brandService.setBrand(this.brandName);
    }
}

// --- 4. CONFIGURATION ---
const meta: Meta<StorybookWrapper> = {
    title: 'Components/ui/ui-image',
    component: StorybookWrapper,
    decorators: [
        applicationConfig({
            providers: [
                provideHttpClient(),
                { provide: ThemeService, useClass: MockThemeService },
                { provide: BrandService, useClass: MockBrandService }
            ],
        }),
    ],
    argTypes: {
        name: {
            control: 'text',
            description: 'Nom du fichier image à afficher (requis)',
            table: { defaultValue: { summary: 'requis' } },
        },
        width: {
            control: 'number',
            description: "Largeur de l\'image",
            table: { defaultValue: { summary: 'undefined' } },
        },
        widthUnit: {
            control: 'text',
            description: 'Unité CSS pour la largeur (px, %, rem…)',
            table: { defaultValue: { summary: "'px'" } },
        },
        height: {
            control: 'number',
            description: "Hauteur de l\'image",
            table: { defaultValue: { summary: 'undefined' } },
        },
        heightUnit: {
            control: 'text',
            description: 'Unité CSS pour la hauteur (px, %, rem…)',
            table: { defaultValue: { summary: "'px'" } },
        },
        alt: {
            control: 'text',
            description: "Texte alternatif pour l\'accessibilité",
            table: { defaultValue: { summary: 'undefined' } },
        },
        priority: {
            control: 'boolean',
            description: 'Active le chargement prioritaire (LCP)',
            table: { defaultValue: { summary: 'false' } },
        },
        fill: {
            control: 'boolean',
            description: "L\'image remplit son conteneur parent (position: relative requis)",
            table: { defaultValue: { summary: 'false' } },
        },
        brandName: {
            control: 'select',
            options: ['common', 'themeone', 'themetwo', 'themethree'],
            description: 'Simule la marque active (dossier racine des assets)',
            table: { defaultValue: { summary: "'common'" } },
        },
    },
    args: {
        widthUnit: 'px',
        heightUnit: 'px',
        brandName: 'common',
        priority: false,
        fill: false,
        width: 200 // Valeur par défaut pour voir quelque chose
    }
};

export default meta;
type Story = StoryObj<StorybookWrapper>;

// =========================================================
// SECTION 1 : IMAGES COMMUNES (Dossier 'common')
// =========================================================

export const Common_JPG_Base: Story = {
    args: {
        name: 'test-jpg.jpg',
        brandName: 'common',
        alt: 'JPG Base Common'
    }
};

export const Common_JPG_Mode: Story = {
    args: {
        name: 'test-mode-jpg.jpg',
        brandName: 'common',
        alt: 'JPG Mode Common (Changez Light/Dark)'
    }
};

export const Common_PNG_Base: Story = {
    args: {
        name: 'test-png.png',
        brandName: 'common',
        alt: 'PNG Base Common'
    }
};

export const Common_PNG_Mode: Story = {
    args: {
        name: 'test-mode-png.png',
        brandName: 'common',
        alt: 'PNG Mode Common (Changez Light/Dark)'
    }
};

export const Common_SVG_Base: Story = {
    args: {
        name: 'test-svg.svg',
        brandName: 'common',
        alt: 'SVG Base Common'
    }
};

export const Common_SVG_Mode: Story = {
    args: {
        name: 'test-mode-svg.svg',
        brandName: 'common',
        alt: 'SVG Mode Common (Changez Light/Dark)'
    }
};

// =========================================================
// SECTION 2 : IMAGES DE THEME (Dossier 'themeone')
// =========================================================

export const Theme_JPG_Base: Story = {
    args: {
        name: 'test-theme-jpg.jpg',
        brandName: 'themeone',
        alt: 'JPG Base Theme'
    }
};

export const Theme_JPG_Mode: Story = {
    args: {
        name: 'test-theme-mode-jpg.jpg',
        brandName: 'themeone',
        alt: 'JPG Mode Theme (Changez Light/Dark)'
    }
};

export const Theme_PNG_Base: Story = {
    args: {
        name: 'test-theme-png.png',
        brandName: 'themeone',
        alt: 'PNG Base Theme'
    }
};

export const Theme_PNG_Mode: Story = {
    args: {
        name: 'test-theme-mode-png.png',
        brandName: 'themeone',
        alt: 'PNG Mode Theme (Changez Light/Dark)'
    }
};

export const Theme_SVG_Base: Story = {
    args: {
        name: 'test-theme-svg.svg',
        brandName: 'themeone',
        alt: 'SVG Base Theme'
    }
};

export const Theme_SVG_Mode: Story = {
    args: {
        name: 'test-theme-mode-svg.svg',
        brandName: 'themeone',
        alt: 'SVG Mode Theme (Changez Light/Dark)'
    }
};

// =========================================================
// SECTION 3 : TEST FONCTIONNEL (FILL)
// =========================================================

export const Test_Fill_Container: Story = {
    decorators: [
        componentWrapperDecorator((story) =>
            `<div style="width: 400px; height: 300px; border: 2px dashed red; position: relative;">${story}</div>`
        )
    ],
    args: {
        name: 'test-jpg.jpg',
        fill: true,
        brandName: 'common',
        alt: 'Test Fill Mode'
    }
};
