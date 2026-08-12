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
    // Stories host their own demo components (`demo-select-signal-forms`…) to
    // exercise a scenario the kit itself must not ship. They live outside the
    // entry point's `src/`, so they never reach the package — the `ui` prefix,
    // which reserves the kit's public element namespace, would be a lie here.
    // The rule stays fully enforced on everything that IS packaged.
    files: ["**/*.stories.ts"],
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
