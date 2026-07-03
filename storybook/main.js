module.exports = {
  stories: ['./**/*.mdx', './stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['./public'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-designs',
    '@storybook-community/storybook-dark-mode',
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  webpackFinal: async (config) => {
    const definePlugin = config.plugins.find(
      (p) => p.constructor.name === 'DefinePlugin' && p.definitions['process.env.NODE_ENV']
    );
    if (definePlugin) {
      delete definePlugin.definitions['process.env.NODE_ENV'];
    }

    // GitHub Pages subpath support — set STORYBOOK_PUBLIC_PATH in CI
    const publicPath = process.env.STORYBOOK_PUBLIC_PATH || '/';
    config.output = { ...config.output, publicPath };

    return config;
  },
};
