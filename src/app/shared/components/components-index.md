# Index des composants

> Story & doc **co-localisées** dans le dossier du composant : `src/app/shared/components/ui/<catégorie>/ui-<nom>/ui-<nom>.stories.ts` + `ui-<nom>.mdx`
> ✅ = implémenté headless · ⬜ = à construire (recopier le patron `ui-button`)

## actions
- ✅ `ui-button` — Bouton (niveaux high/low/success/warning/error, outlined, tailles, icône)
- ⬜ `ui-button-group` — Groupe de boutons
- ⬜ `ui-button-split` — Bouton avec menu déroulant
- ⬜ `ui-link` — Lien textuel

## forms
- ✅ `ui-field` — Shell partagé des champs (label + boîte + helper + états) via projection
- ✅ `ui-input` — Champ texte (headless, CVA ; label + helper, icônes, unité, zone d'action, niveaux)
- ✅ `ui-input-number` — Champ numérique (min/max/step, spinner, clamp, `role="spinbutton"`)
- ✅ `ui-input-mask` — Champ masqué (tokens 9/a/*, littéraux auto, unmask)
- ⬜ `ui-select` — Liste déroulante
- ✅ `ui-checkbox` — Case à cocher (headless, CVA, indeterminate, trueValue/falseValue, erreur auto)
- ✅ `ui-radio` — Bouton radio (headless, CVA, groupe natif par name, erreur auto)
- ✅ `ui-label` — Libellé de champ (requis *, tailles, hook `--ui-label-color`)
- ✅ `ui-toggle` — Interrupteur on/off (headless, `role="switch"`, CVA, trueValue/falseValue, erreur auto)
- ⬜ `ui-toggle-button` — Choix exclusif stylisé
- ✅ `ui-segment-control` — Sélection segmentée (headless, CVA ; simple/`multiple`, options primitives/objets + mapping de champs, indicateur glissant motion, tailles, `fluid`, `orientation` horizontal/vertical, template de segment, clavier roving radiogroup/group, erreur auto)
- ✅ `ui-datepicker` — Sélecteur de date/heure (headless, CVA, overlay CDK ou inline, min/max, jours désactivés, showTime 12/24h, inline, focus roving clavier)
- ⬜ `ui-nudger` — Champ numérique +/-
- ✅ `ui-rating` — Notation étoiles (headless, CVA, clavier natif range, focus)
- ⬜ `ui-file-upload` — Téléversement de fichiers
- ✅ `ui-textarea` — Zone de texte multiligne (headless, CVA ; label + helper, niveaux/états, `rows`, `maxlength`, `autoResize`, poignée native)
- ⬜ `ui-slider` — Curseur de sélection de valeur

## informative
- ⬜ `ui-alert` — Message d'alerte (erreur, succès, info)
- ✅ `ui-badge` — Pastille compteur / statut
- ✅ `ui-tag` — Étiquette colorée / pilule (level × sub-level × size, icônes gauche/droite, forme pill/rounded, tokens informative)
- ✅ `ui-helper` — Texte d'aide sous un champ
- ⬜ `ui-progress-bar` — Barre de progression
- ✅ `ui-avatar` — Avatar utilisateur (image / initiales / icône, tailles, forme, badge projeté, repli image)
- ✅ `ui-avatar-group` — Empilement d'avatars avec chevauchement (débordement « +N » par avatar Label)
- ✅ `ui-tooltip` — Infobulle headless (directive `[uiTooltip]` + CDK Overlay ; placement 4 côtés avec retournement auto `fitContent`, hover/focus/both, délais, `escape` HTML/`TemplateRef`, `autoHide`/`hideOnEscape`/`life`, `tooltipStyleClass`)
- ✅ `ui-separator` — Séparateur visuel (horizontal/vertical, solid/dashed, épaisseur, libellé start/center/end)
- ✅ `ui-accordion` — Accordéon (composition `ui-accordion` + `ui-accordion-panel` ; single/multiple, en-tête bouton WAI-ARIA, clavier roving ↑↓/Début/Fin, `selectOnFocus`, collapse animé grid-rows via motion system, `disabled`, chevron/séparateur optionnels)
- ⬜ `ui-empty-state` — État vide (illustration, titre, description, actions)
- ⬜ `ui-skeleton` — Placeholder de chargement
- ⬜ `ui-spinner` — Indicateur de chargement
- ✅ `ui-toast` — Notification éphémère (carte `ui-toast` + `UiToastService` `add`/`clear`/`remove` + `ui-toast-container` ; 7 positions, niveaux `informative`, auto-fermeture pausable au survol/focus, `sticky`, mode bannière `expanded`, contenu `template` custom + actions, entrée/sortie via motion system, région live a11y)

## layout
- ✅ `ui-card` — Conteneur flexible (slots média/titre/sous-titre/contenu/pied via directives marqueurs + raccourcis `header`/`subheader`, variantes outlined/elevated/flat)
- ⬜ `ui-modal` — Fenêtre modale

## navigation
- ⬜ `ui-breadcrumb` — Fil d'Ariane
- ⬜ `ui-drawer` — Panneau latéral glissant

## table
- ⬜ `ui-table` — Tableau de données
- ⬜ `ui-paginator` — Pagination

## root
- ✅ `ui-icon` — Icône FontAwesome (size sm|md|default|lg|xl, type solid|outline, accessible)
- ✅ `ui-image` — Image
