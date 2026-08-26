import { DEFAULT_SWATCH_PALETTE } from '@4sh/ui-kit/forms/ui-swatch-picker';

/**
 * Rich-text command layer — the only place that talks to the legacy editing API.
 *
 * `document.execCommand` is deprecated but remains the sole cross-browser way to
 * apply inline formatting to a `contenteditable` selection without pulling in an
 * editing engine (ProseMirror, Quill…). It is confined to this file so the kit
 * keeps a single third-party-free dependency surface, and so a future Selection/
 * Range implementation only has to replace these functions.
 */

/**
 * A formatting action the toolbar can trigger.
 *
 * `separator` is purely visual; `fontFamily` renders a dropdown rather than a
 * button, since it picks among values instead of toggling one.
 */
export type EditorTool =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'bulletList'
  | 'orderedList'
  | 'codeBlock'
  | 'blockFormat'
  | 'fontFamily'
  | 'fontSize'
  | 'indent'
  | 'outdent'
  | 'textColor'
  | 'highlightColor'
  | 'link'
  | 'clearFormat'
  | 'separator';

/** Tools rendered as a dropdown: they pick among values instead of toggling one. */
export type EditorSelectTool = 'blockFormat' | 'fontFamily' | 'fontSize';

/** Tools rendered as an icon button. */
export type EditorButtonTool = Exclude<EditorTool, 'separator' | EditorSelectTool>;

export const EDITOR_SELECT_TOOLS: readonly EditorSelectTool[] = [
  'blockFormat',
  'fontFamily',
  'fontSize',
];

/** Commands whose active/inactive state the toolbar reflects via `aria-pressed`. */
export type EditorToggleTool = Extract<
  EditorTool,
  'bold' | 'italic' | 'underline' | 'bulletList' | 'orderedList' | 'codeBlock'
>;

/** Active formatting at the caret, recomputed after every interaction. */
export type EditorState = Record<EditorToggleTool, boolean>;

/**
 * Type families the editor can apply.
 *
 * A closed list on purpose: a free font picker would write an arbitrary family
 * into the value and step outside the `--fontfamily-*` tokens. The system has no
 * serif face, so the list is the three families the tokens actually carry.
 */
export type EditorFont = 'base' | 'title' | 'monospace';

/**
 * Font key → class written into the value, token holding the family, and the
 * fallback label used when the real name cannot be read (SSR, unset token).
 *
 * The dropdown shows the **actual** face name, resolved from the token at runtime
 * (see {@link resolveFontLabel}) rather than hardcoded: a project that rebinds
 * `--fontfamily-base` would otherwise see a menu naming a font it no longer uses.
 */
export const EDITOR_FONTS: readonly {
  key: EditorFont;
  className: string;
  cssVar: string;
  label: string;
}[] = [
  { key: 'base', className: 'ui-editor-font-base', cssVar: '--fontfamily-base', label: 'Standard' },
  {
    key: 'title',
    className: 'ui-editor-font-title',
    cssVar: '--fontfamily-title',
    label: 'Titre',
  },
  {
    key: 'monospace',
    className: 'ui-editor-font-monospace',
    cssVar: '--fontfamily-monospace',
    label: 'Monospace',
  },
];

/**
 * First face named by a font token — what the family dropdown displays.
 *
 * `--fontfamily-base` holds a whole stack (`Inter, system-ui, …`); only the head
 * of it is a name a person recognises.
 */
export function resolveFontLabel(cssVar: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  const first = raw
    .split(',')[0]
    ?.trim()
    .replace(/^["']|["']$/g, '');
  return first || fallback;
}

/** Text sizes the editor can apply, as a step on the typography scale. */
export type EditorSize = 'sm' | 'default' | 'lg' | 'xl';

/** Size key → class written into the value + French label for the dropdown. */
export const EDITOR_SIZES: readonly { key: EditorSize; className: string; label: string }[] = [
  { key: 'sm', className: 'ui-editor-size-sm', label: 'Petit' },
  { key: 'default', className: 'ui-editor-size-default', label: 'Normal' },
  { key: 'lg', className: 'ui-editor-size-lg', label: 'Grand' },
  { key: 'xl', className: 'ui-editor-size-xl', label: 'Très grand' },
];

const SIZE_CLASSES = new Set(EDITOR_SIZES.map((s) => s.className));

/**
 * Block levels the editor can apply — the "Normal / Titre" dropdown.
 *
 * Distinct from the font family: this one sets what the block *is* (a heading
 * carries document structure, and screen readers navigate by it), while the font
 * only changes how it looks.
 */
export type EditorBlock = 'p' | 'h1' | 'h2' | 'h3';

/** Block tag → French label for the dropdown. */
export const EDITOR_BLOCKS: readonly { key: EditorBlock; label: string }[] = [
  { key: 'p', label: 'Normal' },
  { key: 'h1', label: 'Titre 1' },
  { key: 'h2', label: 'Titre 2' },
  { key: 'h3', label: 'Titre 3' },
];

const BLOCK_KEYS = new Set<string>(EDITOR_BLOCKS.map((b) => b.key));

/** Applies a block level to the block under the caret. */
export function applyBlockFormat(tag: EditorBlock): void {
  document.execCommand('formatBlock', false, tag);
}

/**
 * Block level under the caret, or `null` when it is something else.
 *
 * `null` covers the code block and list items, which the dropdown does not offer:
 * showing "Normal" there would misreport what the caret actually sits in.
 */
export function readBlockFormat(): EditorBlock | null {
  try {
    const value = (document.queryCommandValue('formatBlock') || '').toLowerCase();
    return BLOCK_KEYS.has(value) ? (value as EditorBlock) : null;
  } catch {
    return null;
  }
}

const FONT_CLASSES = new Set(EDITOR_FONTS.map((f) => f.className));

/**
 * The tools enabled when the consumer does not provide a `tools` list.
 *
 * `fontSize` is deliberately absent: it would duplicate `blockFormat` on screen —
 * both make text bigger — while only the latter carries document structure.
 * Leaving both in the default bar invites headings made of merely large text.
 * It stays available for a project that explicitly asks for it in `tools`.
 */
export const DEFAULT_EDITOR_TOOLS: readonly EditorTool[] = [
  'blockFormat',
  'fontFamily',
  'separator',
  'bold',
  'italic',
  'underline',
  'separator',
  'bulletList',
  'orderedList',
  'separator',
  'link',
  'codeBlock',
  'clearFormat',
];

/** Toolbar metadata per button tool: icon (FontAwesome) + French accessible name. */
export const EDITOR_TOOL_META: Record<EditorButtonTool, { icon: string; label: string }> = {
  bold: { icon: 'bold', label: 'Gras' },
  italic: { icon: 'italic', label: 'Italique' },
  underline: { icon: 'underline', label: 'Souligné' },
  bulletList: { icon: 'list-ul', label: 'Liste à puces' },
  orderedList: { icon: 'list-ol', label: 'Liste numérotée' },
  codeBlock: { icon: 'code', label: 'Bloc de code' },
  indent: { icon: 'indent', label: 'Augmenter le retrait' },
  outdent: { icon: 'outdent', label: 'Diminuer le retrait' },
  textColor: { icon: 'font', label: 'Couleur du texte' },
  highlightColor: { icon: 'highlighter', label: 'Couleur de surlignage' },
  link: { icon: 'link', label: 'Lien' },
  clearFormat: { icon: 'text-slash', label: 'Effacer le formatage' },
};

/** Tool → legacy command name. */
const NATIVE_COMMAND: Record<
  Exclude<EditorButtonTool, 'link' | 'codeBlock' | 'textColor' | 'highlightColor'>,
  string
> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  bulletList: 'insertUnorderedList',
  orderedList: 'insertOrderedList',
  indent: 'indent',
  outdent: 'outdent',
  clearFormat: 'removeFormat',
};

const TOGGLE_TOOLS: readonly Exclude<EditorToggleTool, 'codeBlock'>[] = [
  'bold',
  'italic',
  'underline',
  'bulletList',
  'orderedList',
];

/** Every state off — the value used before the first render and on SSR. */
export function emptyEditorState(): EditorState {
  return {
    bold: false,
    italic: false,
    underline: false,
    bulletList: false,
    orderedList: false,
    codeBlock: false,
  };
}

/** Applies a formatting command to the current selection. */
export function applyCommand(
  tool: Exclude<EditorButtonTool, 'link' | 'codeBlock' | 'textColor' | 'highlightColor'>,
): void {
  document.execCommand(NATIVE_COMMAND[tool], false);
}

// --- Code block ---------------------------------------------------------

/** Toggles the block under the caret between `<pre>` and a plain paragraph. */
export function toggleCodeBlock(): void {
  document.execCommand('formatBlock', false, isInCodeBlock() ? 'p' : 'pre');
}

/** The caret sits in a code block. */
export function isInCodeBlock(): boolean {
  try {
    return (document.queryCommandValue('formatBlock') || '').toLowerCase() === 'pre';
  } catch {
    return false;
  }
}

// --- Font family --------------------------------------------------------

/**
 * Marker handed to `fontName`, immediately rewritten into a class.
 *
 * `fontName` is the only command that can apply a family to an arbitrary
 * selection, but it emits `<font face="…">` — an obsolete tag carrying a raw
 * family name. We let it run, then convert its output so the value only ever
 * holds a class bound to a `--fontfamily-*` token.
 */
const FONT_MARKER = '__ui-editor-font__';

/** Applies a type family to the selection (see {@link convertFontMarkers}). */
export function applyFontFamily(): void {
  document.execCommand('fontName', false, FONT_MARKER);
}

/** Rewrites the `<font>` elements `fontName` just produced into `<span class>`. */
export function convertFontMarkers(root: ParentNode, className: string): void {
  convertMarkers(root, `font[face="${FONT_MARKER}"]`, className);
}

/** @internal Replaces the matched legacy `<font>` elements with a classed span. */
function convertMarkers(root: ParentNode, selector: string, className: string): void {
  for (const el of Array.from(root.querySelectorAll(selector))) {
    const span = document.createElement('span');
    span.className = className;
    span.append(...Array.from(el.childNodes));
    el.replaceWith(span);
  }
}

/**
 * Type family in force at the caret.
 *
 * Falls back to the family the text is actually rendered with when no class was
 * applied: a heading carries `--fontfamily-title` from its own styling, and
 * reporting the base family there would name a font the reader does not see.
 * `null` only when the computed face matches none of the system families.
 */
export function readFontFamily(node: Node | null): EditorFont | null {
  const tagged = findClassKey(node, EDITOR_FONTS);
  if (tagged) return tagged;

  const el: HTMLElement | null =
    node?.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node?.parentElement ?? null);
  if (!el || typeof getComputedStyle !== 'function') return null;

  const rendered = firstFace(getComputedStyle(el).fontFamily);
  return (
    EDITOR_FONTS.find((f) => firstFace(resolveFontLabel(f.cssVar, '')) === rendered)?.key ?? null
  );
}

/** @internal Head of a font stack, unquoted and lowercased for comparison. */
function firstFace(stack: string): string {
  return (stack.split(',')[0] ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .toLowerCase();
}

// --- Font size ----------------------------------------------------------

/**
 * Marker handed to `fontSize`, immediately rewritten into a class.
 *
 * Same trick as the family: `fontSize` is the only command that can size an
 * arbitrary selection, but it emits `<font size="7">` — a legacy 1-7 scale with
 * no relation to the typography tokens.
 */
const SIZE_MARKER = '7';

/** Applies a text size to the selection (see {@link convertSizeMarkers}). */
export function applyFontSize(): void {
  document.execCommand('fontSize', false, SIZE_MARKER);
}

/** Rewrites the `<font>` elements `fontSize` just produced into `<span class>`. */
export function convertSizeMarkers(root: ParentNode, className: string): void {
  convertMarkers(root, `font[size="${SIZE_MARKER}"]`, className);
}

/** Text size active at the caret, or `null` when the text uses the default. */
export function readFontSize(node: Node | null): EditorSize | null {
  return findClassKey(node, EDITOR_SIZES);
}

// --- Text color / highlight color ---------------------------------------

/**
 * Color key → class written into the value, token holding the swatch, and
 * label, derived from `ui-swatch-picker`'s default palette rather than
 * hand-duplicated: the editor's color tools and the nuancier it opens must
 * always offer the same token set.
 */
export const EDITOR_COLORS: readonly {
  key: string;
  className: string;
  cssVar: string;
  label: string;
}[] = DEFAULT_SWATCH_PALETTE.flatMap((group) =>
  group.swatches.map((swatch) => ({
    key: swatch.key,
    className: `ui-editor-color-${swatch.key}`,
    cssVar: swatch.cssVar,
    label: swatch.label,
  })),
);

/** Same key set as {@link EDITOR_COLORS}, classed separately for the highlight tool. */
export const EDITOR_HIGHLIGHTS: readonly {
  key: string;
  className: string;
  cssVar: string;
  label: string;
}[] = DEFAULT_SWATCH_PALETTE.flatMap((group) =>
  group.swatches.map((swatch) => ({
    key: swatch.key,
    className: `ui-editor-highlight-${swatch.key}`,
    cssVar: swatch.cssVar,
    label: swatch.label,
  })),
);

const COLOR_CLASSES = new Set(EDITOR_COLORS.map((c) => c.className));
const HIGHLIGHT_CLASSES = new Set(EDITOR_HIGHLIGHTS.map((c) => c.className));

/**
 * Marker handed to `foreColor`, immediately rewritten into a class.
 *
 * `foreColor` is the only command that can color an arbitrary selection, but
 * it emits `<font color="…">` — same trick as the family/size markers. Must
 * be a value the browser accepts as a real color (unlike `fontName`'s marker,
 * which is free text): an unparseable string is silently dropped instead of
 * being written to the `color` attribute. A hex triplet unlikely to collide
 * with a real token value is used, and Chromium/Firefox both echo it back
 * verbatim on the `<font color>` attribute (verified empirically).
 */
const COLOR_MARKER = '#010203';

/** Applies a text color to the selection (see {@link convertColorMarkers}). */
export function applyTextColor(): void {
  document.execCommand('foreColor', false, COLOR_MARKER);
}

/** Rewrites the `<font>` elements `foreColor` just produced into `<span class>`. */
export function convertColorMarkers(root: ParentNode, className: string): void {
  convertMarkers(root, `font[color="${COLOR_MARKER}"]`, className);
}

/** Text color active at the caret, or `null` when the text uses the default. */
export function readTextColor(node: Node | null): string | null {
  return findClassKey(node, EDITOR_COLORS);
}

/**
 * Marker handed to `hiliteColor`, immediately rewritten into a class.
 *
 * Unlike `fontName`/`fontSize`/`foreColor`, `hiliteColor` does **not** emit a
 * `<font>` element: verified empirically (Playwright, Chromium + Firefox)
 * that it always produces `<span style="background-color: rgb(r, g, b);">`,
 * converting whatever color is handed to it — including a hex marker — to an
 * `rgb(...)` triplet in the `style` attribute. `HILITE_MARKER` is therefore
 * kept as the hex value passed to the command, and `HILITE_MARKER_RGB` as the
 * exact `rgb(...)` string both browsers echo back for it, used to build the
 * `[style*="…"]` selector `convertHighlightMarkers` matches on.
 */
const HILITE_MARKER = '#040506';
/** @internal `rgb(...)` form both Chromium and Firefox normalize `HILITE_MARKER` to. */
const HILITE_MARKER_RGB = 'rgb(4, 5, 6)';

/** Applies a highlight color to the selection (see {@link convertHighlightMarkers}). */
export function applyHighlightColor(): void {
  document.execCommand('hiliteColor', false, HILITE_MARKER);
}

/** Rewrites the `<span style>` elements `hiliteColor` just produced into `<span class>`. */
export function convertHighlightMarkers(root: ParentNode, className: string): void {
  convertMarkers(root, `[style*="background-color: ${HILITE_MARKER_RGB}"]`, className);
}

/** Highlight color active at the caret, or `null` when the text carries none. */
export function readHighlightColor(node: Node | null): string | null {
  return findClassKey(node, EDITOR_HIGHLIGHTS);
}

/**
 * Strips a color/highlight class from every element carrying it inside
 * `range`, unwrapping the element when nothing else justifies it (a plain
 * `<span>` holding only that class).
 *
 * Used by the pickers' "no color" swatch: `foreColor`/`hiliteColor` can only
 * set a color, there is no native command to remove one, so this undoes what
 * {@link convertColorMarkers}/{@link convertHighlightMarkers} previously wrote.
 */
export function clearMarkerClass(root: ParentNode, range: Range, className: string): void {
  for (const el of Array.from(root.querySelectorAll(`.${className}`))) {
    if (!range.intersectsNode(el)) continue;
    el.classList.remove(className);
    if (el.classList.length > 0) continue;
    el.removeAttribute('class');
    if (el.tagName === 'SPAN' && el.attributes.length === 0) {
      el.replaceWith(...Array.from(el.childNodes));
    }
  }
}

/** @internal Nearest ancestor carrying one of the given classes. */
function findClassKey<T extends string>(
  node: Node | null,
  table: readonly { key: T; className: string }[],
): T | null {
  let el: HTMLElement | null =
    node?.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node?.parentElement ?? null);
  while (el) {
    const match = table.find((entry) => el!.classList?.contains(entry.className));
    if (match) return match.key;
    el = el.parentElement;
  }
  return null;
}

/** Wraps the current selection in a link (`removeFormat` alone cannot unlink). */
export function applyLink(href: string): void {
  document.execCommand('createLink', false, href);
}

/** Removes the link around the caret. */
export function removeLink(): void {
  document.execCommand('unlink', false);
}

/** Reads the formatting active at the caret. */
export function readEditorState(): EditorState {
  const state = emptyEditorState();
  for (const tool of TOGGLE_TOOLS) {
    try {
      state[tool] = document.queryCommandState(NATIVE_COMMAND[tool]);
    } catch {
      // queryCommandState throws when the document has no selection yet.
      state[tool] = false;
    }
  }
  state.codeBlock = isInCodeBlock();
  return state;
}

/** Inserts already-sanitised markup at the caret, replacing the selection. */
export function insertHtml(html: string): void {
  document.execCommand('insertHTML', false, html);
}

/** Inserts plain text at the caret, replacing the selection. */
export function insertText(text: string): void {
  document.execCommand('insertText', false, text);
}

// --- Content normalisation ---------------------------------------------

/** Inline + block tags the editor is allowed to produce or to accept on paste. */
const ALLOWED_TAGS = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'A',
  'UL',
  'OL',
  'LI',
  'P',
  'BR',
  'DIV',
  'SPAN',
  'PRE',
  'CODE',
  'H1',
  'H2',
  'H3',
]);

/**
 * Tags dropped WITH their content, instead of being unwrapped.
 *
 * Unwrapping keeps the text of a rejected element, which is what we want for a
 * heading or a table cell — but a script or stylesheet body would then land in
 * the document as visible text.
 */
const VOIDED_TAGS = 'script, style, noscript, iframe, object, embed, template, title, meta, link';

/** Only `href` survives, and only on a link. */
const ALLOWED_HREF_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Strips everything outside the whitelist, keeping the text of dropped elements.
 *
 * Runs on paste, on top of Angular's `DomSanitizer`: the sanitizer removes what is
 * dangerous, this removes what is merely foreign to the editor (Word spans, inline
 * styles, headings, tables) so the value stays a small, predictable HTML subset.
 */
export function normalizeHtml(html: string): string {
  if (typeof document === 'undefined') return html;
  const template = document.createElement('template');
  template.innerHTML = html;
  scrubNode(template.content);
  return template.innerHTML;
}

/**
 * Applies the same scrubbing to a live element, in place.
 *
 * `insertHTML` re-decorates what it inserts (`style="background-color: transparent"`
 * and friends) *after* our normalisation, so the markup has to be cleaned once more
 * once it is in the document. Attributes are removed node by node rather than by
 * rewriting `innerHTML`, which would drop the caret.
 */
export function scrubInPlace(root: ParentNode): void {
  scrubNode(root);
}

/** @internal Unwraps disallowed elements, voids the unsafe ones, drops attributes. */
function scrubNode(root: ParentNode): void {
  for (const el of Array.from(root.querySelectorAll(VOIDED_TAGS))) el.remove();
  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (!ALLOWED_TAGS.has(el.tagName)) {
      el.replaceWith(...Array.from(el.childNodes));
      continue;
    }
    for (const attr of Array.from(el.attributes)) {
      if (attr.name === 'class') {
        // Only the editor's own font/size/color classes survive — anything else
        // pasted in would style the value against a foreign stylesheet.
        const kept = attr.value
          .split(/\s+/)
          .filter(
            (c) =>
              FONT_CLASSES.has(c) ||
              SIZE_CLASSES.has(c) ||
              COLOR_CLASSES.has(c) ||
              HIGHLIGHT_CLASSES.has(c),
          );
        if (kept.length) el.setAttribute('class', kept.join(' '));
        else el.removeAttribute('class');
        continue;
      }
      const keep = el.tagName === 'A' && attr.name === 'href' && isSafeHref(attr.value);
      if (!keep) el.removeAttribute(attr.name);
    }
  }
}

/** @internal Rejects `javascript:` and other non-navigational schemes. */
function isSafeHref(href: string): boolean {
  try {
    return ALLOWED_HREF_PROTOCOLS.includes(new URL(href, document.baseURI).protocol);
  } catch {
    return false;
  }
}

/** Normalises a browser-produced empty document (`<br>`, empty block) to `''`. */
export function isEmptyHtml(html: string): boolean {
  return htmlToText(html).length === 0 && !/<(img|hr)\b/i.test(html);
}

/** Plain-text projection of the value — what the character counter measures. */
export function htmlToText(html: string): string {
  if (!html) return '';
  if (typeof document === 'undefined') {
    // SSR fallback: good enough for a length, never rendered.
    return html.replace(/<[^>]*>/g, '').trim();
  }
  const template = document.createElement('template');
  template.innerHTML = html;
  return (template.content.textContent ?? '').trim();
}
