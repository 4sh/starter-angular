import { addons } from 'storybook/manager-api';
import { darkTheme, lightTheme } from './myTheme';

const markTheme = (isDark: boolean) => {
  document.documentElement.dataset['sbTheme'] = isDark ? 'dark' : 'light';
};

addons.setConfig({
  theme: lightTheme,
});
markTheme(false);

addons.ready().then(() => {
  const channel = addons.getChannel();
  channel.on('DARK_MODE', (isDark: boolean) => {
    addons.setConfig({ theme: isDark ? darkTheme : lightTheme });
    markTheme(isDark);
  });
});
