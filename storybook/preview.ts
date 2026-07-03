import { applicationConfig, Preview } from '@storybook/angular';
import { setCompodocJson } from '@storybook/addon-docs/angular';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { lightTheme, darkTheme } from './myTheme';
import { addons } from 'storybook/preview-api';
import docJson from '../documentation.json';

setCompodocJson(docJson);

const syncTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (isDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
};

const channel = addons.getChannel();
channel.on('DARK_MODE', (isDark) => {
  setTimeout(() => syncTheme(isDark), 0);
});

const preview: Preview = {
  decorators: [
    (Story, context) => {
      syncTheme(context.globals['darkMode']);
      return Story();
    },
    applicationConfig({
      providers: [provideRouter([]), provideAnimations()],
    }),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      story: { inline: true },
    },
    darkMode: {
      dark: darkTheme,
      light: lightTheme,
      stylePreview: true,
      classTarget: 'html',
      darkClass: 'dark-mode',
      lightClass: 'light-mode',
    },
    backgrounds: { disable: true },
  },
};

export default preview;
