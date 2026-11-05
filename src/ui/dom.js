// Rendu typographique de tout texte affiché : espace insécable avant le guillemet fermant (jamais de » seul en
// début de ligne). Le texte source n'est pas modifié.
export const typo = (s) => String(s).replace(/ »/g, '\u00a0»');

// Création d'éléments : h('button.cta', { onclick }, 'texte', enfant…).
export function h(spec, attrs = {}, ...children) {
  const [tag, ...classes] = spec.split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v; // réservé aux SVG générés par le code
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(typo(c)));
  }
  return node;
}

export function svg(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstChild;
}
