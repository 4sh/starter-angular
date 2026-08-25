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
  | 'fontFamily'
  | 'link'
  | 'clearFormat'
  | 'separator';

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
 * into the value and step outside the `--fontfamily-*` tokens.
 */
export type EditorFont = 'base' | 'title' | 'monospace';

/** Font key → class written into the value + French label for the dropdown. */
export const EDITOR_FONTS: readonly { key: EditorFont; className: string; label: string }[] = [
  { key: 'base', className: 'ui-editor-font-base', label: 'Standard' },
  { key: 'title', className: 'ui-editor-font-title', label: 'Titre' },
  { key: 'monospace', className: 'ui-editor-font-monospace', label: 'Monospace' },
];

const FONT_CLASSES = new Set(EDITOR_FONTS.map((f) => f.className));

/** The tools enabled when the consumer does not provide a `tools` list. */
export const DEFAULT_EDITOR_TOOLS: readonly EditorTool[] = [
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
export const EDITOR_TOOL_META: Record<
  Exclude<EditorTool, 'separator' | 'fontFamily'>,
  {
    icon: string;
    label: string;
  }
> = {
  bold: { icon: 'bold', label: 'Gras' },
  italic: { icon: 'italic', label: 'Italique' },
  underline: { icon: 'underline', label: 'Souligné' },
  bulletList: { icon: 'list-ul', label: 'Liste à puces' },
  orderedList: { icon: 'list-ol', label: 'Liste numérotée' },
  codeBlock: { icon: 'code', label: 'Bloc de code' },
  link: { icon: 'link', label: 'Lien' },
  clearFormat: { icon: 'text-slash', label: 'Effacer le formatage' },
};

/** Tool → legacy command name. */
const NATIVE_COMMAND: Record<
  Exclude<EditorTool, 'separator' | 'link' | 'fontFamily' | 'codeBlock'>,
  string
> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  bulletList: 'insertUnorderedList',
  orderedList: 'insertOrderedList',
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
  tool: Exclude<EditorTool, 'separator' | 'link' | 'fontFamily' | 'codeBlock'>,
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
  for (const el of Array.from(root.querySelectorAll(`font[face="${FONT_MARKER}"]`))) {
    const span = document.createElement('span');
    span.className = className;
    span.append(...Array.from(el.childNodes));
    el.replaceWith(span);
  }
}

/** Type family active at the caret, or `null` when the text uses the default. */
export function readFontFamily(node: Node | null): EditorFont | null {
  let el: HTMLElement | null =
    node?.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : (node?.parentElement ?? null);
  while (el) {
    const match = EDITOR_FONTS.find((f) => el!.classList?.contains(f.className));
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
        // Only the editor's own font classes survive — anything else pasted in
        // would style the value against a foreign stylesheet.
        const kept = attr.value.split(/\s+/).filter((c) => FONT_CLASSES.has(c));
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
