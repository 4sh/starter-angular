---
name: qa-component-methodology
description: Méthodologie de test fonctionnel d'un composant ui-* du design system, pour clôturer un ticket "Tester le composant ui-X" de l'épic FSHSP-24 (test des ~54 composants du kit UI). Déclencher quand l'utilisateur demande de tester/auditer un composant ui-* dans le cadre du QA du kit, ou référence un ticket FSHSP-2x à FSHSP-79 de type "Tester le composant".
---

# QA Component Methodology

Méthodologie pour éprouver fonctionnellement un composant `ui-*` du design system
(épic [FSHSP-24](https://4sh-toolkit.atlassian.net/browse/FSHSP-24)) et clôturer son
ticket de test associé.

## 1. Récupération du contexte

- **Ticket Jira** : `getJiraIssue` (fields `["description"]`) **une seule fois** pour
  récupérer la checklist exacte — ne pas refetch en boucle, ça pollue la conversation
  avec du JSON.
- **Fichiers du composant** : lire systématiquement `.ts`, `.html`, `.scss`,
  `.stories.ts`, `.mdx` (et `.model.ts` s'il existe) — co-localisés, jamais un sans
  les autres.
- **Fichiers partagés consommés** par le composant (ex. `base-form-field.ts`,
  `option-resolver.ts`, mixins SCSS partagés, `mask-engine.ts`…) pour repérer les
  bugs qui viennent d'un mixin/util commun plutôt que du composant lui-même.
- **Jumeau déjà audité et fermé** : si le composant en a un (ex. `ui-chip` /
  `ui-input-tags`, `ui-select` / `ui-autocomplete`), comparer les deux pour repérer
  les écarts de traitement entre composants censés se comporter pareil.

## 2. Revue de code, point par point contre la checklist

Parcourir chaque item de la checklist Jira et vérifier **dans le code source**, pas
juste à l'œil :

- **Props/inputs** : valeur par défaut correcte, forwardée au bon endroit, cohérente
  avec les composants jumeaux.
- **Outputs** : émis au bon moment, jamais en double (ex. bug trouvé : double
  `completeMethod` sur focus+clic simultanés dans `ui-autocomplete`), jamais quand
  désactivé/readonly.
- **États dérivés vs props directes** : vérifier que les états comme "désactivé à la
  borne" sont calculés, pas câblés en dur.
- **Symétrie** : quand deux éléments sont censés être équivalents (deux boutons, deux
  poignées), vérifier qu'une prop forwardée à l'un l'est aussi à l'autre (bug trouvé :
  `tabindex` sur un seul des deux boutons de `ui-nudger`).
- **CVA / Signal Forms** : `writeValue`, intégration `[(ngModel)]`/`FormControl`/
  `[formField]`.
- **Garde-fous dev** (`isDevMode()` + `console.warn`) : présents et bien formés quand
  un nom accessible manque, ou qu'une combinaison de props n'a pas de sens.

## 3. Vérifications statiques

```bash
npx eslint <dossier> --max-warnings 0
npx tsc --noEmit -p tsconfig.app.json | grep <composant>
```

## 4. Vérification visuelle/interactive dans Storybook

- Démarrer/attacher Storybook (`preview_start`, port 6006) et ouvrir chaque story
  attendue par la checklist.
- Comparer la liste des stories présentes à celle listée dans le ticket — une story
  manquante, ou une story qui ne démontre pas réellement ce qu'elle prétend (ex. bug
  trouvé : story "Nested" pas vraiment collapsible), est un signal.
- Pour les interactions, privilégier `javascript_tool` (`querySelector` dans l'iframe
  `storybook-preview-iframe`, dispatch d'événements, lecture d'attributs
  ARIA/classes/signaux via `ng.getComponent`) plutôt que des clics par coordonnées —
  beaucoup plus fiable dans ce canvas imbriqué.
- Vérifier clavier (flèches, Home/End, Entrée/Échap), focus (déplacement, anneau
  visible), états hover/focus/pressed/disabled, et les cas limites (bornes min/max,
  doublons, dépassement de limite).
- Vérifier light/dark mode et, si pertinent, les 3 thèmes de marque.

## 5. Points de vigilance récurrents (calibrés sur les bugs déjà trouvés)

- Token de taille/couleur erroné mais syntaxiquement valide.
- État `:hover`/`:focus-visible` absent alors que les tokens existent.
- Attribut ARIA statique contredisant un input booléen.
- Enum invalide passée à un sous-composant (`ui-icon` notamment).
- Section `## Theming` du MDX absente (très fréquent).
- Élément décoratif/annexe oublié dans l'arbre d'accessibilité (`aria-hidden` mal
  posé, `aria-describedby` incomplet).
- Node-id Figma générique (`0-1`) — à vérifier si le ticket l'accepte explicitement
  ou pas.

## 6. Clôture

- **Si bug réel** : fix ciblé et minimal, cohérent avec les patterns existants
  (jamais de refactor large) + entrée `CHANGELOG.md` + commit
  `type(scope): [TICKET] description`.
- **Commentaire Jira détaillé** : points vérifiés OK + bug/fix avec hash de commit,
  ou mention explicite "aucun bug trouvé".
- **Transition** :
  - *Fermée* si tout est clean/corrigé.
  - *Waiting for design* si un écart nécessite une décision produit qu'on ne peut pas
    trancher seul (jamais deviner/corriger à l'aveugle dans ce cas).
