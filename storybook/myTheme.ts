import { create } from 'storybook/theming';
// Généré par `pnpm build-info` (chaîné avant `storybook`/`build-storybook`),
// même mécanique que `generated/ui-config.json` — voir `docs.config.mjs`.
import buildInfo from './generated/build-info.json';

const brandContent = {
  // FSHSP-101 : ce Storybook est redéployé à chaque push `main`, donc en
  // avance sur ce qui est installable — le label rend cet écart visible sur
  // toutes les pages (barre du manager), pas juste sur l'accueil.
  brandTitle: `Starter Design System · ${buildInfo.label}`,
  brandTarget: '_self',
  fontBase: '"Inter", sans-serif',
  fontCode: 'monospace',
  appBorderRadius: 8,
  inputBorderRadius: 4,
};

export const lightTheme = create({
  base: 'light',
  ...brandContent,
  brandImage: './storybook-projet-logo.png',
  // UI
  appBg: '#f6f7f9',
  appContentBg: '#ffffff',
  appBorderColor: '#dfe2e7',
  // Text colors
  textColor: '#111827',
  textInverseColor: '#ffffff',
  // Toolbar
  barTextColor: '#6b7280',
  barSelectedColor: '#111827',
  barBg: '#ffffff',
  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#dfe2e7',
  inputTextColor: '#111827',
  // Accent
  colorPrimary: '#111827',
  colorSecondary: '#111827',
});

export const darkTheme = create({
  base: 'dark',
  ...brandContent,
  brandImage: './storybook-projet-logo-white.png',
  // UI
  appBg: '#0f172a',
  appContentBg: '#111827',
  appBorderColor: '#1f2937',
  // Text colors
  textColor: '#f3f4f6',
  textInverseColor: '#111827',
  // Toolbar
  barTextColor: '#9ca3af',
  barSelectedColor: '#f3f4f6',
  barBg: '#111827',
  // Form colors
  inputBg: '#1f2937',
  inputBorder: '#374151',
  inputTextColor: '#f6f7f9',
  // Accent
  colorPrimary: '#d1d5db',
  colorSecondary: '#d1d5db',
});

export default lightTheme;
