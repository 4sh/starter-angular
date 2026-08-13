/**
 * FSHSP-93 — a11y in CI. Runs against the *static* Storybook build
 * (`storybook-static/`, served locally in CI — see `pr-checks.yml`'s `a11y`
 * job), one axe-core pass per story, reusing whatever `parameters.a11y` a
 * story already sets (disable/scope rules) in the browser panel.
 *
 * `@storybook/addon-a11y`'s newer auto-test mode (`parameters.a11y.test`) only
 * works with the Vitest addon, which itself only works with a Vite-powered
 * Storybook framework — this repo's `@storybook/angular` runs on webpack
 * (`storybook/main.js`), so `@storybook/test-runner` + `axe-playwright` is the
 * supported path here, not a downgrade.
 */
import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import { checkA11y, configureAxe, injectAxe } from 'axe-playwright';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    if (storyContext.parameters?.['a11y']?.disable) return;

    await configureAxe(page, {
      rules: storyContext.parameters?.['a11y']?.config?.rules,
    });
    await checkA11y(page, storyContext.parameters?.['a11y']?.element ?? '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  },
};

export default config;
