// Bouton FR / EN (M14) : accueil et options. La langue en cours est marquée (aria-pressed, pas seulement la couleur) ;
// l'autre relance le jeu dans sa langue (ctx.setLang). `intro` : depuis l'introduction, elle reprend au début.
import { config } from '../config.js';
import { texts } from '../content/texts.js';
import { h } from './dom.js';

export function langSwitch(ctx, { intro = false } = {}) {
  const ui = texts.ui;
  const names = { fr: ui.langFr, en: ui.langEn };
  return h('div.lang-switch', { role: 'group', 'aria-label': ui.langTitle },
    config.i18n.langs.map((l) => h('button.ghost', {
      type: 'button',
      lang: l,
      'aria-pressed': String(l === ctx.lang),
      'aria-label': names[l],
      onclick: () => ctx.setLang(l, { intro }),
    }, l.toUpperCase())));
}
