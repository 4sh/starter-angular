import { Meta, StoryObj, applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { Component, input } from '@angular/core';
import { UiImage } from '@app/shared/components/ui/ui-image/ui-image';

// --- WRAPPER COMPONENT ---
@Component({
    selector: 'storybook-ui-image-wrapper',
    imports: [UiImage],
    template: `
    <ui-image
        [src]="src()"
        [width]="width()"
        [widthUnit]="widthUnit()"
        [height]="height()"
        [heightUnit]="heightUnit()"
        [alt]="alt()"
        [priority]="priority()"
        [fill]="fill()"
        [objectFit]="objectFit()"
        [authenticated]="authenticated()"
        [preview]="preview()"
    ></ui-image>
  `
})
class StorybookWrapper {
    src = input.required<string>();
    width = input<number>();
    widthUnit = input('px');
    height = input<number>();
    heightUnit = input('px');
    alt = input<string>();
    priority = input(false);
    fill = input(false);
    objectFit = input<'contain' | 'cover' | 'fill' | 'none' | 'scale-down'>('contain');
    authenticated = input(false);
    preview = input(false);
}

// --- CONFIGURATION ---
const meta: Meta<StorybookWrapper> = {
    title: 'Components/ui/ui-image',
    component: StorybookWrapper,
    decorators: [
        applicationConfig({
            providers: [provideHttpClient()],
        }),
    ],
    argTypes: {
        src: {
            control: 'text',
            description: "Chemin d'asset ou URL de l'image à afficher (requis)",
            table: { defaultValue: { summary: 'requis' } },
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
        objectFit: {
            control: 'select',
            options: ['contain', 'cover', 'fill', 'none', 'scale-down'],
            description: "Découpage de l'image dans sa boîte",
            table: { defaultValue: { summary: "'contain'" } },
        },
        authenticated: {
            control: 'boolean',
            description: 'Récupère la source via une requête HTTP authentifiée (blob) au lieu de `src` direct',
            table: { defaultValue: { summary: 'false' } },
        },
        preview: {
            control: 'boolean',
            description: 'Active un aperçu plein écran avec zoom au clic sur l’image',
            table: { defaultValue: { summary: 'false' } },
        },
    },
    args: {
        widthUnit: 'px',
        heightUnit: 'px',
        priority: false,
        fill: false,
        objectFit: 'contain',
        authenticated: false,
        preview: false,
        width: 200, // Valeur par défaut pour voir quelque chose
    },
};

export default meta;
type Story = StoryObj<StorybookWrapper>;

// =========================================================
// FORMATS D'IMAGE
// =========================================================

export const Jpg: Story = {
    args: {
        src: 'assets/img/common/jpg/test-jpg.jpg',
        alt: 'Exemple JPG',
    },
};

export const Png: Story = {
    args: {
        src: 'assets/img/common/png/test-png.png',
        alt: 'Exemple PNG',
    },
};

export const Svg: Story = {
    args: {
        src: 'assets/img/common/svg/test-svg.svg',
        alt: 'Exemple SVG (injecté inline, stylable en CSS)',
    },
};

// =========================================================
// COMPORTEMENTS
// =========================================================

export const Fill: Story = {
    decorators: [
        componentWrapperDecorator(
            (story) =>
                `<div style="width: 400px; height: 300px; border: 2px dashed red; position: relative;">${story}</div>`,
        ),
    ],
    args: {
        src: 'assets/img/common/jpg/test-jpg.jpg',
        fill: true,
        alt: 'Image en mode remplissage',
    },
};

export const ObjectFit: Story = {
    decorators: [
        componentWrapperDecorator(
            (story) => `<div style="width: 300px; height: 200px; position: relative;">${story}</div>`,
        ),
    ],
    args: {
        src: 'assets/img/common/jpg/test-jpg.jpg',
        fill: true,
        objectFit: 'cover',
        alt: 'Image recadrée (object-fit: cover)',
    },
};

export const Preview: Story = {
    args: {
        src: 'assets/img/common/jpg/test-jpg.jpg',
        preview: true,
        alt: 'Cliquer pour ouvrir l’aperçu plein écran',
    },
};

export const Authenticated: Story = {
    args: {
        src: 'assets/img/common/jpg/test-jpg.jpg',
        authenticated: true,
        alt: 'Image récupérée via une requête HTTP (blob)',
    },
};
