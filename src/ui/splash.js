// Écran d'ouverture (M8 v2) : une fois par jour (date locale), au-dessus du premier écran, qui se rend dessous.
// Le logo (config.brand.wordmark) est inliné tel quel pour animer ses tracés : « KLO » et « I » en fondu, les 3
// traits du Z dessinés, les 3 parts du camembert une à une, puis studio et tagline ; fondu vers le premier écran.
// Un tap ou une touche le passe. Effets réduits : logo complet d'un coup, tenu 0,8 s, fondus de 200 ms.
import { config } from '../config.js';
import { texts } from '../content/texts.js';
import { dayKey } from '../game/daily.js';
import { h } from './dom.js';

export function splashDue(storage = globalThis.localStorage, today = dayKey(), cfg = config) {
  try {
    return storage.getItem(cfg.splash.storageKey) !== today;
  } catch {
    return false; // stockage bloqué : on ne sait pas s'il a déjà été vu, on ne l'impose pas
  }
}

export function markSplash(storage = globalThis.localStorage, today = dayKey(), cfg = config) {
  try {
    storage.setItem(cfg.splash.storageKey, today);
  } catch {
    // stockage indisponible : l'écran reviendra au prochain lancement
  }
}

// Logo SVG du fichier de marque, chargé une fois (mis en cache par le service worker une fois publié).
let logoText = null;
export function brandSvg(path = config.brand.wordmark) {
  logoText ??= fetch(path).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))));
  return logoText;
}

// Repère les pièces du logo sans le modifier : lettres pleines (K, L, O, I), traits du Z (tracés sans
// remplissage, dans l'ordre du fichier : haut, diagonale, bas), parts du camembert (dans le groupe du O).
export function logoParts(svgEl) {
  const top = [...svgEl.children];
  return {
    letters: top.filter((n) => n.tagName === 'path' && n.getAttribute('fill') !== 'none'),
    strokes: top.filter((n) => n.tagName === 'path' && n.getAttribute('fill') === 'none'),
    parts: [...svgEl.querySelectorAll('g > path')].filter((n) => !n.hasAttribute('stroke')),
    pie: svgEl.querySelector('g'),
  };
}

// `onPartFilled(i)` : appelé quand la part i (0 à 2) du camembert apparaît (crochet pour un son à venir).
export function showSplash({ reduced = false, cfg = config, onPartFilled = () => {} } = {}) {
  const { brand, splash } = cfg;
  const logo = h('div.splash-logo', { 'aria-hidden': 'true' });
  const node = h(`div.splash${reduced ? '.still' : ''}`, { role: 'button', tabindex: '0', 'aria-label': texts.ui.splashAria },
    logo,
    h('p.splash-by', {}, texts.ui.splashBy(brand.studio)),
    h('p.splash-tag', {}, brand.tagline));
  const vars = { fade: reduced ? splash.reducedFadeMs : splash.fadeMs, letters: splash.lettersMs, stroke: splash.zStrokeMs,
    part: splash.partMs, tag: splash.tagMs, 'tag-at': splash.tagStartMs };
  for (const [k, v] of Object.entries(vars)) node.style.setProperty(`--splash-${k}`, `${v}ms`);
  document.body.append(node);
  markSplash();

  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const remove = () => {
    timers.forEach(clearTimeout);
    removeEventListener('keydown', skip, true);
    node.remove();
  };
  // Un tap ou une touche passe l'écran, sans être transmis à l'écran du dessous.
  function skip(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    remove();
  }
  node.addEventListener('click', skip);
  addEventListener('keydown', skip, true);

  const start = (svgText) => {
    if (!node.isConnected) return;
    if (svgText) {
      logo.innerHTML = svgText;
      const svgEl = logo.querySelector('svg');
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
      const { letters, strokes, parts, pie } = logoParts(svgEl);
      letters.forEach((n) => n.classList.add('sp-letter'));
      pie.classList.add('sp-letter'); // contour et séparateurs du O, avec les lettres ; ses parts suivent
      strokes.forEach((n, i) => {
        const len = Math.ceil(n.getTotalLength());
        n.classList.add('sp-stroke');
        n.style.strokeDasharray = len;
        n.style.setProperty('--len', len);
        n.style.animationDelay = `${splash.zStartMs + i * splash.zGapMs}ms`;
      });
      parts.forEach((n, i) => {
        const at = splash.partsStartMs + i * splash.partGapMs;
        n.classList.add('sp-part');
        n.style.animationDelay = `${at}ms`;
        later(() => onPartFilled(i), reduced ? 0 : at);
      });
    } else {
      logo.append(h('p.splash-name', {}, brand.name)); // logo indisponible : le nom en texte
    }
    // Fondus par l'API d'animation : ils restent actifs avec les effets réduits (qui coupent les animations CSS).
    if (reduced) node.animate?.([{ opacity: 0 }, { opacity: 1 }], vars.fade);
    // Départ deux images plus tard : le logo inséré et le premier écran dessous sont déjà mis en page, la première
    // image de l'animation n'est pas sautée.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!node.isConnected) return;
      node.classList.add('go');
      later(() => {
        node.classList.add('out');
        node.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: vars.fade, easing: 'ease-in-out', fill: 'forwards' });
        later(remove, vars.fade);
      }, reduced ? splash.reducedHoldMs : splash.totalMs);
    }));
  };
  brandSvg().then(start, () => start(null));
  return node;
}
