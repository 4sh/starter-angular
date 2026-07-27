const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: ["ui", "sp", "app"],
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: ["ui", "sp", "app"],
          style: "kebab-case",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Le pattern `cond ? fnA() : fnB()` en statement est idiomatique dans ce repo.
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      // Garde-fou : OnPush (défaut Angular 22) pour tout nouveau composant.
      "@angular-eslint/prefer-on-push-component-change-detection": "error",
      // TEMPORAIRE : renommer les outputs `onXxx` / natifs = breaking change de
      // l'API publique du design system. À traiter dans un chantier dédié.
      "@angular-eslint/no-output-on-prefix": "off",
      "@angular-eslint/no-output-native": "off",
    },
  },
  {
    // Les composants de démo des stories ne font pas partie de l'API du design
    // system : pas de contrainte de préfixe de sélecteur.
    files: ["**/*.stories.ts"],
    rules: {
      "@angular-eslint/component-selector": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // `x != null` couvre volontairement null ET undefined.
      "@angular-eslint/template/eqeqeq": [
        "error",
        { allowNullOrUndefined: true },
      ],
      // TEMPORAIRE (migration Angular 22) : règles a11y à traiter dans un
      // chantier accessibilité dédié (focus/clavier sur les éléments interactifs).
      "@angular-eslint/template/interactive-supports-focus": "off",
      "@angular-eslint/template/click-events-have-key-events": "off",
      // L'auto-fix de no-autofocus supprime le binding [attr.autofocus] alors que
      // c'est un input opt-in délibéré (ui-rating). À réévaluer avec le chantier a11y.
      "@angular-eslint/template/no-autofocus": "off",
    },
  }
);
