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

    // GitHub Pages subpath support — 'auto' resolves chunk URLs at runtime
    // based on the script's actual location, works on any deployment path.
    config.output = { ...config.output, publicPath: 'auto' };

    return config;
  },
  managerWebpack: async (config) => {
    config.output = { ...config.output, publicPath: 'auto' };
    return config;
  },
};
