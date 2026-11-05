// Pictogrammes SVG : forme de chaque note (A9 : la note ne dépend pas que de la couleur), étapes, cadenas.
const box = (size, body, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;

// 3 : disque plein · 1 : demi-disque · 0 : cercle vide barré
export function gradeIcon(grade, size = 18) {
  const ring = '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5"/>';
  if (grade === 3) return box(size, '<circle cx="12" cy="12" r="10" fill="currentColor"/>');
  if (grade === 1) return box(size, `${ring}<path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>`);
  return box(size, `${ring}<path d="M6.5 17.5l11-11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`);
}

// Pictogramme d'une étape : tracé fourni par l'édition (edition.stages[i].icon).
export function stageIcon(stage, size = 16) {
  return box(size, stage.icon || '');
}

// Coche : étape faite (pastilles, A12 : l'état ne dépend pas que de la couleur).
export function checkIcon(size = 12) {
  return box(size, '<path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>');
}

// Haut-parleur : son activé (ondes) ou coupé (croix).
export function soundIcon(on, size = 18) {
  const body = '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>';
  const waves = on
    ? '<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    : '<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  return box(size, body + waves);
}

// Cadenas : édition à venir.
export function lockIcon(size = 16) {
  return box(size, '<rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/>'
    + '<path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/>');
}
