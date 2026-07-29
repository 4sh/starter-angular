---
name: verify
description: Vérifie les changements de ce design system en pilotant Storybook headless (build statique + Playwright/Chrome système) et en observant le rendu réel des stories.
---

# Vérifier un changement (Storybook headless)

Surface du projet : **Storybook** (pas de page app significative ; `ng serve` ne montre presque rien).

## Recette qui marche

```bash
npm run build-storybook          # AOT de toutes les stories → storybook-static/
cd storybook-static && python3 -m http.server 6007 &
```

Piloter avec Playwright + Chrome système (pas de download de browser) :

```js
// npm i playwright dans un dossier temporaire (ex: /tmp/sb-verify) — pas dans le repo
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
```

- URL d'une story seule : `http://localhost:6007/iframe.html?id=<story-id>`
- IDs de stories : `curl -s localhost:6007/index.json` (`entries`), ex.
  `components-ui-forms-ui-input--signal-forms` (title `Components/ui/forms/ui-input` → kebab).

## Pièges connus

- Lire le contenu d'une story via `#storybook-root …` : un `locator('code')` nu peut matcher
  un élément vide hors story (template d'erreur SB).
- Certaines stories ont des boutons **cachés** en premier dans le DOM → utiliser `button:visible`.
- Bruit console dans **chaque** story : `NG04002: 'iframe.html'` (le Router de l'app ne matche
  pas l'URL iframe de Storybook) — préexistant, à filtrer des captures.
- `rtk grep` (hook) rejette les flags courts isolés et ignore parfois les `.md` → utiliser
  `/usr/bin/grep` pour les balayages.

## Quoi piloter selon le changement

- Composant de formulaire : story `--signal-forms` / `--basic`, taper/cliquer, lire la ligne
  `value = … · valid = …` rendue par les démos, vérifier `aria-invalid` sur le champ.
- Overlays (modal/drawer/select/datepicker) : ouvrir, vérifier `[role="dialog"]`/options,
  fermer par `Escape` — sensible au zoneless.
- Screenshot de la story en évidence (`page.screenshot`).
