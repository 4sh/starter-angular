import {
  Meta,
  StoryObj,
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular';
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
      [secured]="secured()"
      [withCredentials]="withCredentials()"
      [loadingLabel]="loadingLabel()"
      [preview]="preview()"
      [previewAriaLabel]="previewAriaLabel()"
      [previewDialogAriaLabel]="previewDialogAriaLabel()"
      [downloadable]="downloadable()"
      [downloadName]="downloadName()"
      [zoomStep]="zoomStep()"
      [minZoom]="minZoom()"
      [maxZoom]="maxZoom()"
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
  secured = input(false);
  withCredentials = input(false);
  loadingLabel = input<string>();
  preview = input(false);
  previewAriaLabel = input<string>();
  previewDialogAriaLabel = input('Aperçu de l’image');
  downloadable = input(false);
  downloadName = input<string>();
  zoomStep = input(0.25);
  minZoom = input(0.5);
  maxZoom = input(4);
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
    secured: {
      control: 'boolean',
      description:
        'Récupère `src` via HttpClient (intercepteurs, jeton) puis affiche le Blob depuis une object URL révoquée',
      table: { defaultValue: { summary: 'false' } },
    },
    withCredentials: {
      control: 'boolean',
      description:
        'Envoie les cookies/identifiants TLS avec la requête `secured` (session cross-origin)',
      table: { defaultValue: { summary: 'false' } },
    },
    loadingLabel: {
      control: 'text',
      description: "Texte visible de l'indicateur de chargement d'une source `secured`",
      table: { defaultValue: { summary: 'undefined' } },
    },
    preview: {
      control: 'boolean',
      description: "Un clic sur l'image ouvre la vue agrandie (zoom, rotation, déplacement)",
      table: { defaultValue: { summary: 'false' } },
    },
    previewAriaLabel: {
      control: 'text',
      description: "Nom accessible du déclencheur d'aperçu (par défaut : le `alt` de l'image)",
      table: { defaultValue: { summary: 'undefined' } },
    },
    previewDialogAriaLabel: {
      control: 'text',
      description: 'Nom accessible de la boîte de dialogue de la vue agrandie',
      table: { defaultValue: { summary: "'Aperçu de l’image'" } },
    },
    downloadable: {
      control: 'boolean',
      description: "Ajoute une action de téléchargement dans la barre d'outils de l'aperçu",
      table: { defaultValue: { summary: 'false' } },
    },
    downloadName: {
      control: 'text',
      description: "Nom de fichier proposé par l'action de téléchargement",
      table: { defaultValue: { summary: 'undefined' } },
    },
    zoomStep: {
      control: { type: 'number', step: 0.05 },
      description: "Pas de zoom d'un clic, d'un cran de molette ou d'une touche `+`/`-`",
      table: { defaultValue: { summary: '0.25' } },
    },
    minZoom: {
      control: { type: 'number', step: 0.1 },
      description: 'Borne basse du zoom',
      table: { defaultValue: { summary: '0.5' } },
    },
    maxZoom: {
      control: { type: 'number', step: 0.5 },
      description: 'Borne haute du zoom',
      table: { defaultValue: { summary: '4' } },
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
    secured: false,
    withCredentials: false,
    preview: false,
    previewDialogAriaLabel: 'Aperçu de l’image',
    downloadable: false,
    zoomStep: 0.25,
    minZoom: 0.5,
    maxZoom: 4,
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

// =========================================================
// SECTION 6 : SOURCE SÉCURISÉE (input `secured`)
// =========================================================

/**
 * `secured` récupère l'URL via `HttpClient` — donc à travers les intercepteurs de
 * l'application, seul moyen d'ajouter un `Authorization` : un `<img src>` est une
 * requête navigateur nue. Le `Blob` reçu est affiché depuis une object URL,
 * révoquée au changement de source et à la destruction du composant.
 *
 * Ici l'endpoint est public (rien à intercepter) : ce que la story montre, c'est le
 * chemin de récupération, l'indicateur de chargement puis le rendu `blob:`.
 */
export const Secured_Source: Story = {
  args: {
    src: 'https://picsum.photos/id/1025/400/300',
    secured: true,
    width: 400,
    height: 300,
    alt: 'Image récupérée via HttpClient',
  },
};

/** Endpoint en échec : le placeholder tokenisé prend le relais et `loadFailed` émet l'URL. */
export const Secured_Error: Story = {
  args: {
    src: './api/nope-forbidden.jpg',
    secured: true,
    width: 200,
    height: 200,
    alt: 'Endpoint sécurisé en échec',
  },
};

// =========================================================
// SECTION 7 : PAYLOAD EN LIGNE (data URL)
// =========================================================

/** Une `data:` URL est déjà l'image : elle passe par un `<img>` nu, `NgOptimizedImage` la refusant. */
export const Data_Url: Story = {
  args: {
    src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMTYwIiB2aWV3Qm94PSIwIDAgMjQwIDE2MCI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIxNjAiIHJ4PSIxMiIgZmlsbD0iIzRjMWQ5NSIvPjxjaXJjbGUgY3g9IjcwIiBjeT0iNzAiIHI9IjM0IiBmaWxsPSIjYzRiNWZkIi8+PHBhdGggZD0iTTE2IDE0OCBMOTIgNzYgTDE0NiAxMzAgTDE4MiA5OCBMMjI0IDE0OCBaIiBmaWxsPSIjYTc4YmZhIi8+PHRleHQgeD0iMTIwIiB5PSIyNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNlZGU5ZmUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPmRhdGEgVVJMPC90ZXh0Pjwvc3ZnPg==',
    width: 240,
    height: 160,
    alt: 'Image encodée en base64 dans son URL',
  },
};

// =========================================================
// SECTION 8 : APERÇU (input `preview`)
// =========================================================

/** `preview` transforme l'image en déclencheur : au clic, la vue agrandie s'ouvre. */
export const Preview_Basic: Story = {
  args: {
    src: 'https://picsum.photos/id/1015/1200/800',
    preview: true,
    width: 300,
    height: 200,
    alt: 'Paysage de rivière',
  },
};

/** Barre d'outils complétée par le téléchargement (optionnel, désactivé par défaut). */
export const Preview_Downloadable: Story = {
  args: {
    src: 'https://picsum.photos/id/1043/1200/800',
    preview: true,
    downloadable: true,
    width: 300,
    height: 200,
    alt: 'Forêt en contre-plongée',
  },
};

/** Un asset local marche aussi : le `.svg` inliné est agrandi tel quel. */
export const Preview_Local_Asset: Story = {
  args: {
    name: 'test-jpg.jpg',
    brandName: 'common',
    preview: true,
    width: 200,
    alt: 'Asset local en aperçu',
  },
};

/** Bornes resserrées : le zoom s'arrête à ×2 et les boutons se désactivent d'eux-mêmes. */
export const Preview_Zoom_Bounds: Story = {
  args: {
    src: 'https://picsum.photos/id/1024/1200/800',
    preview: true,
    minZoom: 1,
    maxZoom: 2,
    zoomStep: 0.5,
    width: 300,
    height: 200,
    alt: 'Chien de traîneau',
  },
};

// --- Indicateur personnalisé ------------------------------------------
// Le template `#previewIndicator` est du contenu projeté : il lui faut un
// composant hôte à lui, le wrapper commun ne projetant rien.
@Component({
  selector: 'demo-image-indicator',
  imports: [UiImage],
  template: `
    <ui-image
      src="https://picsum.photos/id/1069/1200/800"
      [width]="300"
      [height]="200"
      preview
      alt="Ville de nuit"
    >
      <ng-template #previewIndicator>
        <span class="demo-indicator">Agrandir</span>
      </ng-template>
    </ui-image>
  `,
  styles: `
    .demo-indicator {
      padding: var(--units-xs) var(--units-md);
      border-radius: var(--radius-full);
      background: var(--primitives-white-base);
      color: var(--global-text-default);
      font-family: var(--fontfamily-base);
      font-size: var(--size-typography-text-sm);
    }
  `,
})
class DemoImageIndicator {}

/** L'indicateur affiché au survol est remplaçable par un template projeté. */
export const Preview_Custom_Indicator: Story = {
  render: () => ({ template: `<demo-image-indicator />` }),
  decorators: [moduleMetadata({ imports: [DemoImageIndicator] })],
};
