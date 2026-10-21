// Options (§10) : son, effets réduits, revoir l'introduction (M8 v2 : plus de choix de thème), effacer la
// sauvegarde de l'édition (confirmation dans la page). Les préférences sont communes à toutes les éditions.
import { config } from '../../config.js';
import { texts } from '../../content/texts.js';
import { h } from '../dom.js';
import { applyOptions } from '../theme.js';

function toggle(label, hint, on, onclick) {
  return h('button.switch', { type: 'button', role: 'switch', 'aria-checked': String(Boolean(on)), onclick },
    h('span', {}, label, h('small', {}, hint)),
    h('span.knob', { 'aria-hidden': 'true' }));
}

export function optionsScreen(root, _params, ctx) {
  const ui = texts.ui;

  function render(message = '') {
    root.replaceChildren();
    const opts = ctx.prefs.options;
    const set = (patch) => {
      Object.assign(ctx.prefs.options, patch);
      ctx.persistPrefs();
      applyOptions(ctx.prefs.options);
      render();
      root.querySelector(`[data-focus="${Object.keys(patch)[0]}"]`)?.focus();
    };

    root.append(h('div.topbar', {},
      h('button.ghost', { type: 'button', onclick: () => history.back() }, ui.back),
      h('h1.page-title', {}, ui.optionsTitle)));

    const sound = toggle(ui.sound, ui.soundHint, opts.sound, () => {
      set({ sound: !opts.sound });
      ctx.sound?.play('click');
    });
    sound.dataset.focus = 'sound';
    const reduced = toggle(ui.reducedMotion, ui.reducedMotionHint, opts.reducedMotion, () => set({ reducedMotion: !opts.reducedMotion }));
    reduced.dataset.focus = 'reducedMotion';
    root.append(h('section.opt-group', {}, sound, reduced));

    root.append(h('section.opt-group', {},
      h('button.ghost', { type: 'button', onclick: () => ctx.go('intro', {}, { push: false }) }, ui.replayIntro)));

    const name = ctx.edition.name;
    const resetZone = h('section.opt-group', {});
    const ask = () => {
      resetZone.replaceChildren(h('div.card.confirm', { role: 'alertdialog', 'aria-label': ui.resetConfirm(name) },
        h('p', {}, ui.resetConfirm(name)),
        h('div.row', {},
          h('button.ghost', { type: 'button', onclick: () => render() }, ui.resetNo),
          h('button.cta', { type: 'button', onclick: () => { ctx.reset(); render(ui.resetDone(name)); } }, ui.resetYes))));
      resetZone.querySelector('.ghost').focus();
    };
    resetZone.append(h('button.ghost.danger', { type: 'button', onclick: ask }, ui.reset(name)));
    if (message) resetZone.append(h('p.muted', { role: 'status' }, message));
    root.append(resetZone);

    root.append(h('p.footer', {}, `${config.brand.name} ${name} · ${ui.publisher(config.brand.publisher)}`));
  }

  render();
  return { onKey(ev) { if (ev.key === 'Escape') history.back(); } };
}
