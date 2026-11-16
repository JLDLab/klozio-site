// M22 — héros de l'accueil, « le jeu qui joue » : une vraie étape d'un deal gratuit (config.content.hero), sa question
// et ses trois options, exactement comme dans le jeu. Une boucle sans son la rejoue : lecture, toucher sur l'option
// « ça passe », verdict miel sous la carte, bonne option en bleu, température qui monte de la vraie valeur du jeu,
// puis fondu et reprise. Un clic sur une option arrête la boucle et lance ce deal, l'option prise en compte.
//
// Le balisage est une chaîne, la même au build (index.html et en/index.html, lisibles sans JavaScript) et en jeu :
// le premier écran publié et celui que dessine le jeu sont identiques. La boucle ne démarre que si html.js, ne lit ni
// n'écrit la sauvegarde, et n'envoie aucun événement de mesure (le deal_start part de l'écran de partie, au clic).
import { config } from '../config.js';
import { contactLine } from '../content/contact.js';
import { countTo } from './feel.js';

const typo = (s) => String(s).replace(/ »/g, ' »');
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => typo(s).replace(/[&<>"]/g, (c) => ESC[c]);

// Arbre neutre : n('tag.classe', { attributs }, ...enfants). Rendu en chaîne au build (toHtml), en nœuds en jeu (toDom,
// avec dom.js h) : le même balisage des deux côtés.
const n = (spec, attrs = {}, ...children) => ({ spec, attrs, children: children.flat().filter((c) => c !== null && c !== undefined && c !== false) });
export function toHtml(node) {
  if (typeof node !== 'object') return esc(node);
  const [tag, ...classes] = node.spec.split('.');
  const attrs = { ...(classes.length ? { class: classes.join(' ') } : {}), ...node.attrs };
  const list = Object.entries(attrs).filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`)).join('');
  return `<${tag}${list}>${node.children.map(toHtml).join('')}</${tag}>`;
}
export const toDom = (node, h) => (typeof node !== 'object' ? String(node) : h(node.spec, node.attrs, ...node.children.map((c) => toDom(c, h))));

// Option « ça passe » rejouée par la boucle, bonne option, et variation réelle de température (config.deal).
export function heroPlan(data, cfg = config) {
  const grades = data.options.map((o) => o.grade);
  const pick = grades.indexOf(1);
  const best = grades.indexOf(Math.max(...cfg.deal.grades));
  const option = data.options[pick];
  const raw = cfg.deal.startTemp + cfg.deal.delta[option.grade] + (option.event?.temp ?? 0);
  const to = Math.min(cfg.deal.maxTemp, Math.max(cfg.deal.minTemp, raw));
  return { pick, best, from: cfg.deal.startTemp, to, delta: to - cfg.deal.startTemp };
}

// La carte du héros. `t` : les textes de la langue (texts en jeu, textsFor au build). `compact` : visite suivante.
export function heroCard(data, t, { compact = false, cfg = config } = {}) {
  const ui = t.ui;
  return n(`section.card.hero${compact ? '.compact' : ''}`, { 'aria-label': ui.heroAria, 'data-hero': data.id },
    n('div.hero-top', {}, n('span.eyebrow', {}, data.title),
      n('span.hero-temp', {}, ui.temperature, n('b.mono.hero-num', {}, String(cfg.deal.startTemp)), n('span.delta.up.hero-delta', { 'aria-hidden': 'true' }))),
    n('p.hero-who', {}, contactLine(data.contact)),
    n('p.hero-ctx', {}, data.context),
    n('h3.hero-ask', { id: 'hero-ask' }, data.question),
    n('div.opts.hero-opts', { role: 'group', 'aria-labelledby': 'hero-ask' }, data.options.map((o, i) => n('button.opt.hero-opt', {
      type: 'button', 'data-i': String(i), 'aria-label': ui.optionAria(i + 1, o.text),
    }, n('span.num', { 'aria-hidden': 'true' }, String(i + 1)), n('span.txt', {}, o.text)))),
    n('div.hero-verdict', { 'aria-live': 'polite' }),
    n('p.hero-note', {}, ui.heroExample));
}

// Première visite : titre, carte, bouton « Jouer » (premier deal, inchangé), ligne de crédibilité, « Voir tous les
// deals ». Sur ordinateur, la carte à gauche, le reste à droite (app.css).
export function heroPage(data, t, { cred = '', cfg = config } = {}) {
  const ui = t.ui;
  return n('div.hero-page', {},
    n('h2.hero-title', { id: 'fv-title' }, ui.fvLead(cfg.ui.dealMinutes)),
    heroCard(data, t, { cfg }),
    n('div.hero-actions', {},
      n('button.cta.hero-play', { type: 'button' }, ui.fvPlay),
      n('div.cred-slot', {}, cred ? n('p.cred', {}, cred) : null),
      n('button.link.fv-all', { type: 'button' }, ui.fvAll)));
}

// Moments de la boucle, en ms depuis son début (config.hero) ; « out » : fondu, puis reprise à loopMs.
export function heroTimeline(cfg = config) {
  const x = cfg.hero;
  const touch = x.readMs;
  const pick = touch + x.touchMs;
  const best = pick + x.pressMs + x.verdictMs + x.bestAfterMs;
  const temp = best + x.revealMs + x.tempAfterMs;
  const out = x.loopMs - x.fadeMs;
  return [{ at: touch, name: 'touch' }, { at: pick, name: 'pick' }, { at: best, name: 'best' }, { at: temp, name: 'temp' }, { at: out, name: 'out' }, { at: x.loopMs, name: 'in' }];
}

// Anime la carte `card` (balisage de heroCard) ; le clic sur une option est géré par l'accueil (hero-home.js).
// Après config.hero.loops passages, la boucle s'arrête seule, figée sur l'état révélé (verdict, bonne option, +2).
// Pause : survol à la souris seulement (jamais au toucher), focus dans la carte, onglet caché, carte hors écran.
export function mountHero(card, data, t, { options = {}, cfg = config } = {}) {
  const plan = heroPlan(data, cfg);
  const steps = heroTimeline(cfg);
  const q = (sel) => card.querySelector(sel);
  const buttons = card.querySelectorAll('.hero-opt');
  const [verdict, number, delta, doc] = [q('.hero-verdict'), q('.hero-num'), q('.hero-delta'), card.ownerDocument];
  const stopper = new AbortController();
  const on = (target, type, fn) => target?.addEventListener?.(type, fn, { signal: stopper.signal });
  const holds = new Set();
  let index = 0;
  let elapsed = 0;
  let since = 0;
  let timer = null;
  let loops = 0;
  const line = (o, cls) => { // verdict, annoncé à la première boucle seulement
    const p = doc.createElement('p');
    const pill = doc.createElement('span');
    p.className = `hero-v g${o.grade} ${cls}`;
    if (loops > 0 || cls === 'probe') p.setAttribute('aria-hidden', 'true');
    pill.className = 'pill';
    pill.textContent = t.grades[o.grade];
    p.append(pill, doc.createTextNode(` ${typo(o.feedback)}`));
    return p;
  };
  const reserve = () => { // la place du verdict final, pour que rien ne bouge sous la carte pendant la boucle
    verdict.style.minHeight = '';
    verdict.replaceChildren(line(data.options[plan.pick], 'probe'), line(data.options[plan.best], 'probe'));
    verdict.style.minHeight = `${verdict.offsetHeight}px`;
    verdict.replaceChildren();
  };
  const reset = () => {
    for (const x of steps) card.classList.remove(`h-${x.name}`);
    buttons.forEach((b) => b.classList.remove('picked', 'best', 'dim'));
    verdict.replaceChildren();
    number.textContent = String(plan.from);
    delta.textContent = '';
  };
  const apply = (name) => {
    if (name === 'in') {
      loops += 1;
      reset();
      setTimeout(() => card.classList.remove('h-in'), cfg.hero.fadeMs);
    }
    card.classList.add(`h-${name}`);
    if (name === 'pick') {
      buttons[plan.pick].classList.add('picked');
      verdict.append(line(data.options[plan.pick], 'first'));
    }
    if (name === 'best') {
      buttons.forEach((b, i) => { if (i !== plan.pick) b.classList.add(i === plan.best ? 'best' : 'dim'); });
      verdict.append(line(data.options[plan.best], 'second'));
    }
    if (name === 'temp') {
      number.textContent = String(plan.to);
      delta.textContent = t.ui.tempDelta(plan.delta);
      countTo(number, { from: plan.from, to: plan.to, ms: cfg.feel.tempCountMs, options });
      if (loops + 1 >= cfg.hero.loops) {
        card.classList.add('h-done');
        stop();
      }
    }
  };
  const schedule = () => {
    if (stopper.signal.aborted || holds.size || timer) return;
    if (!card.isConnected) return stop();
    const step = steps[index];
    since = performance.now();
    timer = setTimeout(() => {
      timer = null;
      apply(step.name);
      if (stopper.signal.aborted) return;
      index = (index + 1) % steps.length;
      elapsed = index === 0 ? 0 : step.at;
      schedule();
    }, Math.max(0, step.at - elapsed));
  };
  const hold = (why, yes) => {
    if (yes === holds.has(why)) return;
    if (yes) holds.add(why); else holds.delete(why);
    if (yes && timer) {
      clearTimeout(timer);
      timer = null;
      elapsed += performance.now() - since;
    }
    schedule();
  };
  function stop() {
    stopper.abort();
    clearTimeout(timer);
    timer = null;
    if (!card.classList.contains('h-done')) touch.remove();
  }
  on(card, 'pointerenter', (e) => { if (e.pointerType === 'mouse') hold('hover', true); });
  on(card, 'pointerleave', (e) => { if (e.pointerType === 'mouse') hold('hover', false); });
  on(card, 'focusin', () => hold('focus', true));
  on(card, 'focusout', (e) => { if (!card.contains(e.relatedTarget)) hold('focus', false); });
  on(doc, 'visibilitychange', () => hold('hidden', doc.visibilityState === 'hidden'));
  on(globalThis, 'resize', () => { if (!card.classList.contains('h-pick')) reserve(); });
  if (globalThis.IntersectionObserver) {
    const io = new IntersectionObserver(([en]) => hold('away', !en.isIntersecting));
    io.observe(card);
    stopper.signal.addEventListener('abort', () => io.disconnect());
  }
  const touch = doc.createElement('span'); // empreinte du toucher, sur l'option « ça passe »
  touch.className = 'hero-touch';
  touch.setAttribute('aria-hidden', 'true');
  buttons[plan.pick].append(touch);
  reset();
  reserve();
  schedule();
  return { stop, get loops() { return loops; } };
}
