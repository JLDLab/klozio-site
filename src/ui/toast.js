// Toast (M10-A) : message court en bas de l'écran, annoncé aux lecteurs d'écran, qui disparaît seul.
import { config } from '../config.js';
import { h } from './dom.js';

export function toast(text) {
  document.querySelector('.toast')?.remove();
  const node = h('div.toast', { role: 'status' }, text);
  document.body.append(node);
  setTimeout(() => node.remove(), config.ui.toastMs);
  return node;
}
