// Les 3 options d'une étape, avant et après révélation (A8, A9, A13). Partagé par la partie et l'entraînement.
import { config } from '../config.js';
import { texts } from '../content/texts.js';
import { h, svg } from './dom.js';
import { gradeIcon } from './icons.js';

// `picked` : indice choisi une fois révélé (null avant) ; `extra(o, i)` : élément ajouté à la ligne de note.
export function choiceList(step, { revealed = false, picked = null, onPick, extra = () => null }) {
  const ui = texts.ui;
  const opts = h(`div.opts${revealed ? '.revealed' : ''}`, { role: 'group', 'aria-labelledby': 'ask' });
  const best = step.options.findIndex((o) => o.grade === Math.max(...config.deal.grades));
  step.options.forEach((o, i) => {
    const isPicked = revealed && picked === i;
    const state = isPicked ? '.picked' : i === best ? '.best' : '.dim'; // M18 : la bonne réponse non choisie, et l'autre, atténuée
    opts.append(h(`button.opt${revealed ? `.g${o.grade}${state}` : ''}`, {
      type: 'button',
      disabled: revealed,
      'aria-label': revealed ? null : ui.optionAria(i + 1, o.text),
      onclick: () => onPick(i),
    },
    h('span.num', { 'aria-hidden': 'true' }, i + 1),
    h('span.txt', {}, o.text),
    h('span.grade', {}, svg(gradeIcon(o.grade, 16)), texts.grades[o.grade], isPicked ? extra(o, i) : null),
    h('span.fb', {}, o.feedback)));
  });
  return opts;
}
