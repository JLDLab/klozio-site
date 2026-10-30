// « J'ai un code » (M12, test fermé ; repris au lot B) : le code ouvre l'édition complète sur cet appareil. Le Worker
// vérifie le code et compte l'appareil ; l'édition est ensuite téléchargée au chargement des deals.
// Lot B : la page code/ du site (après un achat) ouvre cet écran avec le code déjà saisi (?code=).
import { texts } from '../../content/texts.js';
import { catalogue } from '../../content/editions/index.js';
import { unlock } from '../../access/client.js';
import { teamState } from '../../access/team.js';
import { pseudoForm } from './team.js';
import { h } from '../dom.js';

export function codeScreen(root, params, ctx) {
  const ui = texts.ui;
  root.append(h('div.topbar', {},
    h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.home),
    h('h1.page-title', {}, ui.codeTitle)));
  root.append(h('p.muted', {}, ui.codeHint));

  const input = h('input.code-input', {
    type: 'text', placeholder: ui.codePlaceholder, autocomplete: 'off', autocapitalize: 'characters',
    spellcheck: 'false', 'aria-label': ui.codeInputAria, enterkeyhint: 'go', maxlength: 20, value: params?.code ?? '',
  });
  const submit = h('button.cta', { type: 'button' }, ui.codeSubmit);
  const message = h('p.duel-msg', { role: 'status' });
  const card = h('section.card.duel', {}, input, submit, message);
  let busy = false;
  const go = async () => {
    if (busy || !input.value.trim()) return;
    busy = true;
    submit.disabled = true;
    message.className = 'duel-msg';
    message.textContent = ui.codeChecking;
    const r = await unlock(input.value);
    busy = false;
    submit.disabled = false;
    if (!r.ok) {
      message.textContent = r.message;
      message.className = 'duel-msg bad';
      input.focus();
      return;
    }
    // Ouvert : on recharge le jeu, qui télécharge alors l'édition complète (et la garde pour le hors ligne).
    const names = r.access.editions.map((id) => catalogue.find((e) => e.id === id)?.name ?? id).join(', ');
    message.textContent = ui.codeOpened(names);
    const play = h('button.cta', { type: 'button', onclick: () => location.replace(location.pathname) }, ui.codePlay);
    input.disabled = true;
    // M11 lot C : un joueur d'équipe choisit son pseudo à la première saisie (déjà choisi : rien à demander).
    if (r.access.kind === 'team' && !teamState().pseudo) {
      submit.remove();
      const pseudo = pseudoForm(() => pseudo.replaceWith(play));
      card.after(pseudo);
    } else {
      submit.replaceWith(play);
      if (r.access.kind === 'manager') card.after(h('p.muted', {}, ui.managerHint));
    }
  };
  submit.addEventListener('click', go);
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } });
  root.append(card);
  queueMicrotask(() => input.focus());
  return { onKey(ev) { if (ev.key === 'Escape') history.back(); } };
}
