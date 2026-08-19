/**
 * Thème du manager Storybook (barre latérale, barre d'outils) posé par
 * `ng add @4sh/ui-kit-schematics`. Fichier à vous.
 *
 * Ce sont les couleurs du CHÂSSIS Storybook, pas celles de vos composants :
 * elles ne peuvent pas venir des design tokens, le manager étant rendu hors de
 * votre application. Mettez-y votre marque — et `brandImage` pour votre logo.
 */
import { create } from 'storybook/theming';

const brandContent = {
  brandTitle: 'Design System',
  brandTarget: '_self',
  fontBase: '"Inter", sans-serif',
  fontCode: 'monospace',
  appBorderRadius: 8,
  inputBorderRadius: 4,
};

export const lightTheme = create({
  base: 'light',
  ...brandContent,
  appBg: '#f6f7f9',
  appContentBg: '#ffffff',
  appBorderColor: '#dfe2e7',
  textColor: '#111827',
  textInverseColor: '#ffffff',
  barTextColor: '#6b7280',
  barSelectedColor: '#9747ff',
  barBg: '#ffffff',
  inputBg: '#ffffff',
  inputBorder: '#dfe2e7',
  inputTextColor: '#111827',
  colorPrimary: '#9747ff',
  colorSecondary: '#9747ff',
});

export const darkTheme = create({
  base: 'dark',
  ...brandContent,
  appBg: '#0f172a',
  appContentBg: '#111827',
  appBorderColor: '#1f2937',
  textColor: '#f3f4f6',
  textInverseColor: '#111827',
  barTextColor: '#9ca3af',
  barSelectedColor: '#ac78ff',
  barBg: '#111827',
  inputBg: '#1f2937',
  inputBorder: '#374151',
  inputTextColor: '#f6f7f9',
  colorPrimary: '#9747ff',
  colorSecondary: '#9747ff',
});

export default lightTheme;
