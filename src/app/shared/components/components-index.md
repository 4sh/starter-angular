# Index des composants

> Story & doc **co-localisées** dans le dossier du composant : `src/app/shared/components/ui/<catégorie>/ui-<nom>/ui-<nom>.stories.ts` + `ui-<nom>.mdx`
> ✅ = implémenté headless · ⬜ = à construire (recopier le patron `ui-button`)

## actions
- ✅ `ui-button` — Bouton (niveaux high/low/success/warning/error, outlined, tailles, icône, **mode lien** `href`/`routerLink` → rend un `<a>`)
- ⬜ `ui-button-group` — Groupe de boutons
- ✅ `ui-button-split` — Bouton d'action accolé à un déclencheur déroulant (composition `ui-button` × 2 + `ui-menu` popup ; modèle `UiMenuItem[]` : commandes, `routerLink`/`url`, sous-menus, séparateurs, icônes ; niveaux high/low/success/warning/error, tailles default/small, désactivation indépendante `buttonDisabled`/`menuButtonDisabled`, `aria-haspopup`/`aria-expanded`, clavier hérité du menu)
- ✅ `ui-link` — Lien textuel inline (vrai `<a>`, `href`/`routerLink`/`external`, icônes gauche/droite, tailles, icon-only, souligné a11y)

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
- ✅ `ui-nudger` — Incrémenteur numérique `[−] valeur [+]` (headless, CVA ; deux `ui-button` icon-only, min/max/step, bornes dérivées désactivant le bouton, tailles, niveaux, `formatValue`, valeur en région live)
- ✅ `ui-rating` — Notation étoiles (headless, CVA, clavier natif range, focus)
- ✅ `ui-file-upload` — Téléversement de fichiers (headless ; modes `field`/`drag` + glisser-déposer, `multiple`, validation `accept`/`maxFileSize`/`fileLimit`, `auto`, `customUpload` + `uploadHandler`, upload XHR avec suivi de progression, templates `file`/`content`/`toolbar`, région d'erreurs live, aperçus image révoqués ; compose `ui-file-upload-list`)
- ✅ `ui-file-upload-list` — Ligne de fichier (unité répétée : vignette/icône, nom + taille/état, suppression ; bascule sur `ui-spinner` pendant le téléversement + barre de progression)
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
- ✅ `ui-empty-state` — État vide (headless ; visuel optionnel `showMedia` = illustration projetée `uiEmptyStateMedia` **ou** raccourci `icon` rendu en grand, titre + description, corps libre projeté, slot d'actions `uiEmptyStateActions` ; tailles default/small, densités via custom properties `--ui-empty-state-media-size/-color`, région nommée `role="region"` sur `ariaLabel`/`ariaLabelledBy`, visuel décoratif, 100 % tokens `global`/metrics/typography)
- ⬜ `ui-skeleton` — Placeholder de chargement
- ✅ `ui-spinner` — Indicateur de chargement indéterminé (cercle SVG token-coloré par défaut, marqueur **remplaçable** image/icône FontAwesome/template libre, tailles default/small + `--ui-spinner-size`, `orientation` + libellé, réglages `strokeWidth`/`fill`/`animationDuration`, `delay` anti-flash, `role="status"` live region, reduced-motion)
- ✅ `ui-toast` — Notification éphémère (carte `ui-toast` + `UiToastService` `add`/`clear`/`remove` + `ui-toast-container` ; 7 positions, niveaux `informative`, auto-fermeture pausable au survol/focus, `sticky`, mode bannière `expanded`, contenu `template` custom + actions, entrée/sortie via motion system, région live a11y)

## layout
- ✅ `ui-card` — Conteneur flexible (slots média/titre/sous-titre/contenu/pied via directives marqueurs + raccourcis `header`/`subheader`, variantes outlined/elevated/flat)
- ✅ `ui-modal` — Fenêtre modale headless (two-way `visible`, masque modal / non-modal, `dismissableMask`, blocage du scroll de fond, piège + restauration de focus CDK, `Échap`, déplaçable, agrandissable, redimensionnable, `contained` (embarqué), 9 positions, `breakpoints`, motion `zoom`/fondu, templates en-tête/pied)
- ✅ `ui-drawer` — Panneau latéral glissant headless (two-way `visible`, 4 bords `position` + `fullScreen`, glissement directionnel dérivé de la position via le système de motion, masque modal/non-modal, `dismissableMask`, blocage du scroll, piège + restauration de focus CDK, `Échap`, `contained` (embarqué), templates en-tête/contenu/pied + `#headless`)

## navigation
- ✅ `ui-breadcrumb` — Fil d'Ariane (modèle déclaratif `UiBreadcrumbItem[]` : `url`/`routerLink`/`command`, éléments rendus en instances `ui-link`, dernier élément `aria-current="page"` ; séparateur string ou template `#separator`, repli `maxItems` derrière un bouton ellipsis accessible qui révèle les éléments masqués, template `#item`, tailles default/small, landmark `nav` + `ol`)
- ✅ `ui-context-menu` — Menu contextuel (clic droit / `triggerEvent` custom sur un `target` ou `global` document, ouvert aux coordonnées du pointeur en overlay CDK avec repli sur les bords du viewport, repositionnement au clic droit répété ; panneau = `ui-menu` embarqué : `UiMenuItem[]` imbriqués en **sous-menus flyout** (cascade latérale, défaut) ou inline, clavier, tokens `navigation.*`, densité `small` par défaut, fermeture au `pointerdown` extérieur ; méthodes `show`/`hide`/`toggle`, templates `#item`/`#submenuheader` transmis, motion `zoom`, focus premier item + retour focus cible à `Échap`)
- ✅ `ui-menu` — Menu de navigation / commandes (modèle déclaratif `UiMenuItem[]` : groupes à en-tête + séparateurs, sous-menus `submenus` inline (repliables `toggleable`, contrôlables via `expandedKeys` two-way) ou **flyout** (panneaux latéraux en cascade), `command`, `routerLink`/`url` ; mode `popup` en overlay CDK ancré au déclencheur, motion `slide-down` + repli grid-rows, clavier roving WAI-ARIA, templates `#item`/`#submenuheader`/`#start`/`#end`, familles `navigation.high`/`low`, densités `size` default/small, panneau borderless à fond `global` opaque, coque partagée `overlay-panel`)
- ✅ `ui-tabs` — Onglets (composition `ui-tabs` + `ui-tab-list`/`ui-tab` + `ui-tab-panels`/`ui-tab-panel` ; two-way `value`, orientation horizontale/verticale, `scrollable` + navigateurs, `lazy` (groupe/panneau, template `#content`), `selectOnFocus`, boutons `role="tab"` natifs + clavier roving WAI-ARIA, indicateur actif glissant motion personnalisable `--ui-tabs-active-bar-*`, panneaux en fondu, mode menu de navigation)

## table
- ⬜ `ui-table` — Tableau de données
- ⬜ `ui-paginator` — Pagination

## root
- ✅ `ui-icon` — Icône FontAwesome (size sm|md|default|lg|xl, type solid|outline, accessible)
- ✅ `ui-image` — Image
