import { Meta, StoryObj, applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { Component, effect, inject, input, signal, Injectable, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Imports de votre app

import { ThemeService } from '@4sh/ui-kit/theming';
import { BrandService } from '@4sh/ui-kit/theming';

// Imports Storybook
import { addons } from 'storybook/preview-api';
import { DARK_MODE_EVENT_NAME } from '@storybook-community/storybook-dark-mode';
import { UiImage } from '@4sh/ui-kit/base/ui-image';

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

  setMode(mode: 'light' | 'dark') {
    this.currentMode.set(mode);
  }
}

// --- 2. MOCK BRAND SERVICE (Gère le dossier Theme via Controls) ---
@Injectable()
class MockBrandService {
  currentBrand = signal<string>('common');
  setBrand(brand: string) {
    this.currentBrand.set(brand);
  }
}

// --- 3. WRAPPER COMPONENT (Sans encart de debug) ---
@Component({
  selector: 'demo-image-wrapper',
  standalone: true,
  imports: [UiImage, CommonModule],
  template: `
    <ui-image
      [name]="name()"
      [src]="src()"
      [fallback]="fallback()"
      [width]="width()"
      [widthUnit]="widthUnit()"
      [height]="height()"
      [heightUnit]="heightUnit()"
      [alt]="alt()"
      [priority]="priority()"
      [fill]="fill()"
    ></ui-image>
  `,
})
class StorybookWrapper {
  themeService = inject(ThemeService) as unknown as MockThemeService;
  brandService = inject(BrandService) as unknown as MockBrandService;

  name = input<string>();
  src = input<string>();
  fallback = input<string>();
  width = input<number>();
  widthUnit = input('px');
  height = input<number>();
  heightUnit = input('px');
  alt = input<string>();
  priority = input(false);
  fill = input(false);
  brandName = input('common');

  constructor() {
    effect(() => {
      this.brandService.setBrand(this.brandName());
    });
  }
}

// --- 4. CONFIGURATION ---
const meta: Meta<StorybookWrapper> = {
  title: 'Components/ui/base/ui-image',
  component: StorybookWrapper,
  decorators: [
    applicationConfig({
      providers: [
        provideHttpClient(),
        { provide: ThemeService, useClass: MockThemeService },
        { provide: BrandService, useClass: MockBrandService },
      ],
    }),
  ],
  argTypes: {
    name: {
      control: 'text',
      description: 'Nom du fichier image local (clé dans assets-map.json, résolution thème/marque)',
      table: { defaultValue: { summary: 'undefined' } },
    },
    src: {
      control: 'text',
      description: 'URL distante/absolue (via NgOptimizedImage) — prioritaire sur `name`',
      table: { defaultValue: { summary: 'undefined' } },
    },
    fallback: {
      control: 'text',
      description:
        "Nom d'asset local affiché si l'image principale échoue (placeholder tokenisé sinon)",
      table: { defaultValue: { summary: 'undefined' } },
    },
    width: {
      control: 'number',
      description: "Largeur de l'image",
      table: { defaultValue: { summary: 'undefined' } },
    },
    widthUnit: {
      control: 'text',
      description: 'Unité CSS pour la largeur (px, %, rem…)',
      table: { defaultValue: { summary: "'px'" } },
    },
    height: {
      control: 'number',
      description: "Hauteur de l'image",
      table: { defaultValue: { summary: 'undefined' } },
    },
    heightUnit: {
      control: 'text',
      description: 'Unité CSS pour la hauteur (px, %, rem…)',
      table: { defaultValue: { summary: "'px'" } },
    },
    alt: {
      control: 'text',
      description: "Texte alternatif pour l'accessibilité",
      table: { defaultValue: { summary: 'undefined' } },
    },
    priority: {
      control: 'boolean',
      description: 'Active le chargement prioritaire (LCP)',
      table: { defaultValue: { summary: 'false' } },
    },
    fill: {
      control: 'boolean',
      description: "L'image remplit son conteneur parent (position: relative requis)",
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
    width: 200, // Valeur par défaut pour voir quelque chose
  },
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
    alt: 'JPG Base Common',
  },
};

export const Common_JPG_Mode: Story = {
  args: {
    name: 'test-mode-jpg.jpg',
    brandName: 'common',
    alt: 'JPG Mode Common (Changez Light/Dark)',
  },
};

export const Common_PNG_Base: Story = {
  args: {
    name: 'test-png.png',
    brandName: 'common',
    alt: 'PNG Base Common',
  },
};

export const Common_PNG_Mode: Story = {
  args: {
    name: 'test-mode-png.png',
    brandName: 'common',
    alt: 'PNG Mode Common (Changez Light/Dark)',
  },
};

export const Common_SVG_Base: Story = {
  args: {
    name: 'test-svg.svg',
    brandName: 'common',
    alt: 'SVG Base Common',
  },
};

export const Common_SVG_Mode: Story = {
  args: {
    name: 'test-mode-svg.svg',
    brandName: 'common',
    alt: 'SVG Mode Common (Changez Light/Dark)',
  },
};

// =========================================================
// SECTION 2 : IMAGES DE THEME (Dossier 'themeone')
// =========================================================

export const Theme_JPG_Base: Story = {
  args: {
    name: 'test-theme-jpg.jpg',
    brandName: 'themeone',
    alt: 'JPG Base Theme',
  },
};

export const Theme_JPG_Mode: Story = {
  args: {
    name: 'test-theme-mode-jpg.jpg',
    brandName: 'themeone',
    alt: 'JPG Mode Theme (Changez Light/Dark)',
  },
};

export const Theme_PNG_Base: Story = {
  args: {
    name: 'test-theme-png.png',
    brandName: 'themeone',
    alt: 'PNG Base Theme',
  },
};

export const Theme_PNG_Mode: Story = {
  args: {
    name: 'test-theme-mode-png.png',
    brandName: 'themeone',
    alt: 'PNG Mode Theme (Changez Light/Dark)',
  },
};

export const Theme_SVG_Base: Story = {
  args: {
    name: 'test-theme-svg.svg',
    brandName: 'themeone',
    alt: 'SVG Base Theme',
  },
};

export const Theme_SVG_Mode: Story = {
  args: {
    name: 'test-theme-mode-svg.svg',
    brandName: 'themeone',
    alt: 'SVG Mode Theme (Changez Light/Dark)',
  },
};

// =========================================================
// SECTION 3 : SOURCE DISTANTE (input `src`)
// =========================================================

/** URL distante rendue via NgOptimizedImage (dimensions requises hors `fill`). */
export const Remote_Src: Story = {
  args: {
    src: 'https://picsum.photos/id/237/400/300',
    width: 400,
    height: 300,
    alt: 'Image distante (picsum.photos)',
  },
};

/** URL distante + `fill` : remplit le conteneur relatif parent. */
export const Remote_Fill: Story = {
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div style="width: 400px; height: 300px; border: 2px dashed red; position: relative;">${story}</div>`,
    ),
  ],
  args: {
    src: 'https://picsum.photos/id/1015/800/600',
    fill: true,
    alt: 'Image distante en mode fill',
  },
};

/** Un `.svg` distant n'est jamais inliné : il passe par `<img [ngSrc]>` (pas de surface XSS). */
export const Remote_SVG_As_Img: Story = {
  args: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg',
    width: 300,
    height: 300,
    alt: 'SVG distant rendu via <img>',
  },
};

// =========================================================
// SECTION 4 : ERREUR / FALLBACK / PLACEHOLDER
// =========================================================

/** URL en échec + `fallback` : l'asset local de repli s'affiche (et `loadFailed` émet l'URL). */
export const Error_With_Fallback: Story = {
  args: {
    src: './nope-missing.jpg',
    fallback: 'test-png.png',
    width: 200,
    height: 200,
    alt: 'Erreur avec fallback local',
  },
};

/** URL en échec sans fallback : état dégradé stylé tokens (adapté light/dark). */
export const Error_Placeholder: Story = {
  args: {
    src: './nope-missing.jpg',
    width: 200,
    height: 200,
    alt: 'Erreur sans fallback',
  },
};

/** `name` inconnu de l'assets-map : placeholder immédiat (avant : rendu vide silencieux). */
export const Unknown_Name_Placeholder: Story = {
  args: {
    name: 'does-not-exist.png',
    width: 200,
    height: 200,
    alt: 'Asset local inconnu',
  },
};

/** Fallback `.svg` : rendu via `<img>` (jamais inliné), même en repli. */
export const Error_SVG_Fallback: Story = {
  args: {
    src: './nope-missing.jpg',
    fallback: 'test-svg.svg',
    width: 200,
    height: 200,
    alt: 'Erreur avec fallback SVG',
  },
};

// =========================================================
// SECTION 5 : TEST FONCTIONNEL (FILL)
// =========================================================

export const Test_Fill_Container: Story = {
  decorators: [
    componentWrapperDecorator(
      (story) =>
        `<div style="width: 400px; height: 300px; border: 2px dashed red; position: relative;">${story}</div>`,
    ),
  ],
  args: {
    name: 'test-jpg.jpg',
    fill: true,
    brandName: 'common',
    alt: 'Test Fill Mode',
  },
};
