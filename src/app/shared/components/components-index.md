---
name: components-index
description: Sommaire des composants ui-* (réalisés ✅ et feuille de route ⬜). Lire la story pour l'API.
---

# Index des composants

> Chemin des stories : `storybook/stories/components/ui/<catégorie>/<nom>.stories.ts`
> ✅ = implémenté headless · ⬜ = à construire (recopier le patron `ui-button`)

## actions
- ✅ `ui-button` — Bouton (niveaux high/low/success/warning/error, outlined, tailles, icône)
- ⬜ `ui-button-group` — Groupe de boutons
- ⬜ `ui-button-split` — Bouton avec menu déroulant
- ⬜ `ui-link` — Lien textuel

## forms
- ⬜ `ui-input` — Champ texte
- ⬜ `ui-select` — Liste déroulante
- ✅ `ui-checkbox` — Case à cocher (headless, CVA, indeterminate, trueValue/falseValue, erreur auto)
- ✅ `ui-radio` — Bouton radio (headless, CVA, groupe natif par name, erreur auto)
- ✅ `ui-label` — Libellé de champ (requis *, tailles, hook `--ui-label-color`)
- ✅ `ui-toggle` — Interrupteur on/off (headless, `role="switch"`, CVA, trueValue/falseValue, erreur auto)
- ⬜ `ui-toggle-button` — Choix exclusif stylisé
- ⬜ `ui-segment-control` — Sélection segmentée
- ⬜ `ui-datepicker` — Sélecteur de date
- ⬜ `ui-nudger` — Champ numérique +/-
- ⬜ `ui-rating` — Notation étoiles

## informative
- ⬜ `ui-alert` — Message d'alerte (erreur, succès, info)
- ✅ `ui-badge` — Pastille compteur / statut
- ⬜ `ui-tag` — Étiquette colorée
- ✅ `ui-helper` — Texte d'aide sous un champ
- ⬜ `ui-progress-bar` — Barre de progression
- ⬜ `ui-avatar` — Avatar utilisateur
- ⬜ `ui-tooltip` — Infobulle au survol
- ⬜ `ui-separator` — Séparateur visuel

## layout
- ⬜ `ui-card` — Conteneur carte
- ⬜ `ui-modal` — Fenêtre modale

## navigation
- ⬜ `ui-breadcrumb` — Fil d'Ariane
- ⬜ `ui-drawer` — Panneau latéral glissant

## table
- ⬜ `ui-table` — Tableau de données
- ⬜ `ui-paginator` — Pagination

## root
- ✅ `ui-icon` — Icône FontAwesome (size sm|md|default|lg|xl, type solid|outline, accessible)
- ⬜ `ui-image` — Image
