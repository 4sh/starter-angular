import { create } from 'storybook/theming';

const brandContent = {
  brandTitle: 'Starter Design System',
  brandTarget: '_self',
  fontBase: '"Inter", sans-serif',
  fontCode: 'monospace',
  appBorderRadius: 8,
  inputBorderRadius: 4,
};

export const lightTheme = create({
  base: 'light',
  ...brandContent,
  brandImage: '/storybook-projet-logo.png',
  // UI
  appBg: '#f6f7f9',
  appContentBg: '#ffffff',
  appBorderColor: '#dfe2e7',
  // Text colors
  textColor: '#111827',
  textInverseColor: '#ffffff',
  // Toolbar
  barTextColor: '#6b7280',
  barSelectedColor: '#9747ff',
  barBg: '#ffffff',
  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#dfe2e7',
  inputTextColor: '#111827',
  // Accent
  colorPrimary: '#9747ff',
  colorSecondary: '#9747ff',
});

export const darkTheme = create({
  base: 'dark',
  ...brandContent,
  brandImage: '/storybook-projet-logo-white.png',
  // UI
  appBg: '#0f172a',
  appContentBg: '#111827',
  appBorderColor: '#1f2937',
  // Text colors
  textColor: '#f3f4f6',
  textInverseColor: '#111827',
  // Toolbar
  barTextColor: '#9ca3af',
  barSelectedColor: '#ac78ff',
  barBg: '#111827',
  // Form colors
  inputBg: '#1f2937',
  inputBorder: '#374151',
  inputTextColor: '#f6f7f9',
  // Accent
  colorPrimary: '#9747ff',
  colorSecondary: '#9747ff',
});

export default lightTheme;
