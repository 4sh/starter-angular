/**
 * Canal manager → preview de la recherche plein texte.
 *
 * Le manager ne peut pas faire défiler l'iframe de preview : le hash de son
 * URL ne s'y propage pas (vérifié — `?path=/docs/x--docs#tailles` laisse la
 * page en haut). Il envoie donc l'ancre sur le canal Storybook, et
 * `storybook/preview.ts` fait le `scrollIntoView` de son côté.
 */
export const DOCS_SCROLL_TO_ANCHOR = '4sh/docs-scroll-to-anchor';

export interface DocsScrollToAnchorPayload {
  anchor: string;
}
