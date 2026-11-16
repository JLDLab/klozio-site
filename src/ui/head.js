// En-tête d'écran de deal. Pour un brouillon, le bandeau BROUILLON et la barre du haut forment un seul
// bloc collé en haut de l'écran : la barre est décalée de la hauteur du bandeau, jamais recouverte.
import { config } from '../config.js';
import { texts } from '../content/texts.js';
import { h } from './dom.js';

export function dealHead(deal, topbar) {
  if (deal.status === config.content.publicStatus) return topbar;
  return h('header.gamehead', {}, h('div.banner.draft', { role: 'note' }, texts.ui.draftBanner), topbar);
}
