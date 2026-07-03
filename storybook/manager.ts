import { addons } from 'storybook/manager-api';
import { darkTheme, lightTheme } from './myTheme';

addons.setConfig({
  theme: lightTheme,
});

addons.ready().then(() => {
  const channel = addons.getChannel();
  channel.on('DARK_MODE', (isDark: boolean) => {
    addons.setConfig({ theme: isDark ? darkTheme : lightTheme });
  });
});
