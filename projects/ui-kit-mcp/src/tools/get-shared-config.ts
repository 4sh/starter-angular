import { loadUiConfig } from '../data.js';

export const GET_SHARED_CONFIG_DESCRIPTION =
  'Retourne la configuration structurelle partagée par tout le kit (`_ui-config.scss`) : ' +
  'les variables transverses (épaisseur du focus ring, transitions par défaut…), leur rôle ' +
  'et le token vers lequel elles pointent. Ne pas confondre avec le theming runtime ' +
  '(couleurs/marque, cf. les tokens sémantiques) : ceci documente des choix figés à la compilation.';

export function getSharedConfig() {
  const { groups, shared } = loadUiConfig();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ groups, shared }, null, 2),
      },
    ],
  };
}
