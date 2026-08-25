/**
 * Rich-text command layer — the only place that talks to the legacy editing API.
 *
 * `document.execCommand` is deprecated but remains the sole cross-browser way to
 * apply inline formatting to a `contenteditable` selection without pulling in an
 * editing engine (ProseMirror, Quill…). It is confined to this file so the kit
 * keeps a single third-party-free dependency surface, and so a future Selection/
 * Range implementation only has to replace these functions.
 */

/** A formatting action the toolbar can trigger. `separator` is purely visual. */
export type EditorTool =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'bulletList'
  | 'orderedList'
  | 'link'
  | 'clearFormat'
  | 'separator';

/** Commands whose active/inactive state the toolbar reflects via `aria-pressed`. */
export type EditorToggleTool = Extract<
  EditorTool,
  'bold' | 'italic' | 'underline' | 'bulletList' | 'orderedList'
>;

/** Active formatting at the caret, recomputed after every interaction. */
export type EditorState = Record<EditorToggleTool, boolean>;

/** The tools enabled when the consumer does not provide a `tools` list. */
export const DEFAULT_EDITOR_TOOLS: readonly EditorTool[] = [
  'bold',
  'italic',
  'underline',
  'separator',
  'bulletList',
  'orderedList',
  'separator',
  'link',
  'clearFormat',
];

/** Toolbar metadata per tool: icon (FontAwesome) + French accessible name. */
export const EDITOR_TOOL_META: Record<
  Exclude<EditorTool, 'separator'>,
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
  link: { icon: 'link', label: 'Lien' },
  clearFormat: { icon: 'text-slash', label: 'Effacer le formatage' },
};

/** Tool → legacy command name. */
const NATIVE_COMMAND: Record<Exclude<EditorTool, 'separator' | 'link'>, string> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  bulletList: 'insertUnorderedList',
  orderedList: 'insertOrderedList',
  clearFormat: 'removeFormat',
};

const TOGGLE_TOOLS: readonly EditorToggleTool[] = [
  'bold',
  'italic',
  'underline',
  'bulletList',
  'orderedList',
];

/** Every state off — the value used before the first render and on SSR. */
export function emptyEditorState(): EditorState {
  return { bold: false, italic: false, underline: false, bulletList: false, orderedList: false };
}

/** Applies a formatting command to the current selection. */
export function applyCommand(tool: Exclude<EditorTool, 'separator' | 'link'>): void {
  document.execCommand(NATIVE_COMMAND[tool], false);
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
