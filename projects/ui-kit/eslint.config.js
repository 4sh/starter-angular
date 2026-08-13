// @ts-check
const { defineConfig } = require("eslint/config");
const rootConfig = require("../../eslint.config.js");

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ["**/*.ts"],
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "ui",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "ui",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    // Stories AND specs host their own demo/test components (`demo-select-signal-forms`,
    // `demo-cva`…) to exercise a scenario the kit itself must not ship. Stories live
    // outside the entry point's `src/`; specs live inside it but are excluded from the
    // packaged output by ng-packagr (default) same as `.stories.ts` — either way the `ui`
    // prefix, which reserves the kit's public element namespace, would be a lie here.
    // The rule stays fully enforced on everything that IS packaged.
    files: ["**/*.stories.ts", "**/*.spec.ts"],
    rules: {
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "demo",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    rules: {},
  },
]);
