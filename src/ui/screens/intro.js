// Introduction (§10) : 3 écrans au plus, passable à tout moment. Vue une fois, revue depuis les options.
import { texts } from '../../content/texts.js';
import { h, svg } from '../dom.js';
import { gradeIcon } from '../icons.js';
import { wheelSvg } from '../wheel.js';
import { langSwitch } from '../lang.js';

export function introScreen(root, _params, ctx) {
  const ui = texts.ui;
  const slides = ctx.et.intro;
  const { edition } = ctx;
  let index = 0;

  const done = () => {
    ctx.prefs.introSeen = true;
    ctx.persistPrefs();
    ctx.go('home', {}, { push: false });
    ctx.afterIntro?.(); // lien profond ?deal= en attente (M9)
  };

  // Illustration de chaque écran : la roue, les trois notes, le montant signé.
  const art = [
    () => svg(wheelSvg(150, {}, edition)), // au repos : aucune part remplie, comme le O du logo
    () => h('ul.intro-grades', {}, [3, 1, 0].map((g) => h(`li.g${g}`, {}, svg(gradeIcon(g, 22)), texts.grades[g]))),
    () => h('p.intro-amount', {}, ui.signedOf(...ctx.et.introAmount, edition.valueUnit)),
  ];

  function render() {
    root.replaceChildren();
    const s = slides[index];
    const last = index === slides.length - 1;
    // M14 : FR / EN en haut à droite dès le premier écran ; changer de langue relance l'introduction dans la langue
    root.append(h('div.intro-top', {},
      h('span.mono.muted', {}, ui.introStep(index + 1, slides.length)),
      h('div.intro-actions', {}, h('button.link', { type: 'button', onclick: done }, ui.introSkip), langSwitch(ctx, { intro: true }))));
    root.append(h('section.intro', { 'aria-live': 'polite' },
      h('div.intro-art', { 'aria-hidden': 'true' }, art[index % art.length]()),
      h('h1', {}, s.title),
      index === 0 ? h('p.intro-voice', {}, ui.introVoice) : null, // M8 : seul vouvoiement hors deals
      h('p', {}, s.body)));
    root.append(h('div.intro-dots', { 'aria-hidden': 'true' }, slides.map((_, i) => h(`i${i === index ? '.on' : ''}`))));
    const next = h('button.cta', { type: 'button', onclick: () => (last ? done() : (index += 1, render())) }, last ? ui.introStart : ui.introNext);
    root.append(next);
    next.focus({ preventScroll: true });
  }

  render();
  return {
    onKey(ev) {
      if (ev.key === 'Escape') done();
    },
  };
}
