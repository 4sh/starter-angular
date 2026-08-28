module.exports = {
  stories: [
    './docs/**/*.mdx',
    // The `ui-*` kit lives in the `@4sh/ui-kit` package: story + MDX are co-located
    // per entry point, outside its `src/` (Storybook-only, never packaged).
    '../projects/ui-kit/**/*.mdx',
    '../projects/ui-kit/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // App-side components (domain/, project prefix).
    '../src/app/shared/components/**/*.mdx',
    '../src/app/shared/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  staticDirs: ['./public'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-designs',
    '@storybook/addon-a11y',
    './addons/text-search/preset.cjs',
    './addons/copy-as-markdown/preset.cjs',
    './addons/ripple-toggle/preset.cjs',
    '@storybook-community/storybook-dark-mode',
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  webpackFinal: async (config) => {
    const definePlugin = config.plugins.find(
      (p) => p.constructor.name === 'DefinePlugin' && p.definitions['process.env.NODE_ENV'],
    );
    if (definePlugin) {
      delete definePlugin.definitions['process.env.NODE_ENV'];
    }
    return config;
  },
};
