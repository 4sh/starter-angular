const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: ['ui', 'sp', 'app'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['ui', 'sp', 'app'],
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Le pattern `cond ? fnA() : fnB()` en statement est idiomatique dans ce repo.
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],

      // ─── Sécurité (FSHSP-177) ────────────────────────────────────────────
      // Les API qui désactivent les protections natives d'Angular sont
      // interdites PAR DÉFAUT. Une exception se lève avec un
      // `eslint-disable-next-line` qui PORTE SA JUSTIFICATION (`-- raison`), et
      // elle est inscrite au registre de `docs/SECURITY-PRACTICES.md`.
      // Le grep qui liste les exceptions du dépôt :
      //   grep -rn 'eslint-disable.*no-restricted-syntax' projects src
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[property.name=/^bypassSecurityTrust/]',
          message:
            "DomSanitizer.bypassSecurityTrust*() désactive l'assainissement d'Angular : interdit par défaut. Utiliser sanitize(SecurityContext.X, value). Une exception doit être assainie en amont, justifiée par un eslint-disable commenté, et inscrite dans docs/SECURITY-PRACTICES.md.",
        },
        {
          // L'assainissement d'Angular ne couvre QUE les liaisons de template :
          // une écriture directe dans le DOM passe à côté.
          selector:
            'AssignmentExpression > MemberExpression.left[property.name=/^(innerHTML|outerHTML)$/]',
          message:
            "Écrire innerHTML/outerHTML dans le DOM contourne l'assainissement d'Angular (il ne s'applique qu'aux liaisons de template). Assainir la valeur avant l'écriture, puis justifier par un eslint-disable commenté.",
        },
        {
          selector:
            "CallExpression > MemberExpression[property.name='insertAdjacentHTML'], CallExpression > MemberExpression[property.name='write'][object.name='document']",
          message:
            'insertAdjacentHTML()/document.write() injectent du markup sans passer par Angular : interdit par défaut.',
        },
      ],
      // Les autres portes d'exécution de chaîne, hors périmètre Angular.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },
  {
    // Les composants de démo des stories ne font pas partie de l'API du design
    // system : pas de contrainte de préfixe de sélecteur.
    files: ['**/*.stories.ts'],
    rules: {
      '@angular-eslint/component-selector': 'off',
    },
  },
  {
    // Les tests d'assainissement ont besoin d'écrire les charges qu'ils
    // vérifient être retirées (`javascript:alert(1)`…) : `no-script-url` les
    // refuserait alors qu'elles sont précisément l'objet du test.
    files: ['**/*.spec.ts'],
    rules: {
      'no-script-url': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // Sécurité (FSHSP-177). `[innerHTML]` passe, lui, par l'assainisseur
      // d'Angular : ce n'est pas un contournement. Mais c'est la seule liaison
      // capable d'injecter du markup, donc la seule à mériter une revue — et
      // celle qui accompagne systématiquement un bypass côté TS. Même
      // discipline : `<!-- eslint-disable-next-line … -- raison -->`.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'BoundAttribute[name=/^(innerHTML|outerHTML)$/]',
          message:
            "[innerHTML]/[outerHTML] injecte du markup : à réserver aux cas revus. Justifier par un eslint-disable commenté et l'inscrire dans docs/SECURITY-PRACTICES.md.",
        },
      ],
    },
  },
);
