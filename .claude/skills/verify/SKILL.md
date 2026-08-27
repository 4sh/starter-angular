---
name: verify
description: Verifies changes to this design system by driving headless Storybook (static build + Playwright/system Chrome) and observing the actual rendering of the stories.
---

# Verifying a change (headless Storybook)

Project surface: **Storybook** (no meaningful app page; `ng serve` shows almost nothing).

## Recipe that works

```bash
pnpm build-storybook          # AOT of all stories → storybook-static/
cd storybook-static && python3 -m http.server 6007 &
```

Drive with Playwright + system Chrome (no browser download):

```js
// `playwright` is now a repo devDependency,
// so there is no temporary install to do any more: run the script through
// `pnpm exec node <script.mjs>` and import it directly.
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
```

`channel: 'chrome'` uses the system Chrome, so no browser download is needed. If it
is missing, `pnpm exec playwright install chromium` fetches the bundled one — at the
version the repo pins, which is also the one `@storybook/test-runner` uses.

- URL of a single story: `http://localhost:6007/iframe.html?id=<story-id>`
- Story IDs: `curl -s localhost:6007/index.json` (`entries`), e.g.
  `components-ui-forms-ui-input--signal-forms` (title `Components/ui/forms/ui-input` → kebab).

## Known pitfalls

- Reading a story's content via `#storybook-root …`: a bare `locator('code')` can match
  an empty element outside the story (SB error template).
- Some stories have **hidden** buttons first in the DOM → use `button:visible`.
- Console noise in **every** story: `NG04002: 'iframe.html'` (the app's Router does not match
  Storybook's iframe URL) — pre-existing, filter it out of captures.

## What to drive depending on the change

- Form component: `--signal-forms` / `--basic` story, type/click, read the
  `value = … · valid = …` line rendered by the demos, check `aria-invalid` on the field.
- Overlays (modal/drawer/select/datepicker): open, check `[role="dialog"]`/options,
  close with `Escape` — sensitive to zoneless.
- Screenshot of the highlighted story (`page.screenshot`).
