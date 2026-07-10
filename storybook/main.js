module.exports = {
  stories: [
    './docs/**/*.mdx',
    '../src/app/shared/components/**/*.mdx',
    '../src/app/shared/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/app/shared/motion/**/*.mdx',
    '../src/app/shared/motion/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  staticDirs: ['./public'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-designs',
    '@storybook/addon-a11y',
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
    return config;
  },
};
