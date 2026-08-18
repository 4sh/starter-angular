/**
 * strip-figma — retire le bloc `design: { type: 'figma', url: … }` des stories
 * copiées (FSHSP-125).
 *
 * 48 des 53 stories du kit pointent, via `parameters.design.url`, vers NOTRE
 * fichier Figma. Chez le consommateur, l'onglet « Design » n'ouvrirait qu'un
 * lien qu'il ne peut pas suivre : on le retire plutôt que de livrer une porte
 * fermée. À lui de rebrancher son propre `node-id` s'il en a un.
 *
 * La suppression compte les accolades au lieu de faire confiance à une
 * expression régulière : une URL Figma porte `?node-id=…&t=…`, et un futur
 * bloc pourrait gagner une clé. Un compteur ne se trompe pas de fermeture.
 */

/** Ligne d'ouverture du bloc, seule sur sa ligne : `    design: {`. */
const DESIGN_OPEN_RE = /^([ \t]*)design:\s*\{[ \t]*$/;

/** `parameters: {}` devenu vide après retrait — plus rien à y lire. */
const EMPTY_PARAMETERS_RE = /^[ \t]*parameters:\s*\{\s*\},?[ \t]*$/;

/**
 * Indice de la ligne qui ferme le bloc ouvert en `start`, ou `-1` si la
 * fermeture n'est jamais atteinte (source malformée : on préfère ne rien
 * toucher). Les accolades des chaînes de caractères ne comptent pas.
 */
function findBlockEnd(lines: string[], start: number): number {
  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    let inString: string | null = null;
    for (const char of lines[i]) {
      if (inString) {
        if (char === inString) inString = null;
        continue;
      }
      if (char === "'" || char === '"' || char === '`') inString = char;
      else if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return -1;
}

/** Retire chaque bloc `design: { … }` d'une story, et le `parameters: {}` qu'il laisserait vide. */
export function stripFigmaDesign(content: string): string {
  const lines = content.split('\n');
  const kept: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!DESIGN_OPEN_RE.test(lines[i])) {
      kept.push(lines[i]);
      continue;
    }
    const end = findBlockEnd(lines, i);
    if (end === -1) {
      kept.push(lines[i]);
      continue;
    }
    i = end; // les lignes du bloc, fermeture comprise, ne sont pas reprises
  }

  return kept.filter((line) => !EMPTY_PARAMETERS_RE.test(line)).join('\n');
}
