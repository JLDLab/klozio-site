// Illustrations plates, une par type de vente, générées en SVG (décoratives : aria-hidden).
// Tons : variables du thème, donc correctes en clair comme en sombre.
const frame = (body) =>
  `<svg class="illus" viewBox="0 0 120 64" width="120" height="64" aria-hidden="true" focusable="false">`
  + `<path d="M4 60h112" stroke="var(--line)" stroke-width="2" stroke-linecap="round"/>${body}</svg>`;

const windows = (x0, y0, cols, rows, dx, dy, w = 5, hh = 5) => {
  let out = '';
  for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) {
    out += `<rect x="${x0 + c * dx}" y="${y0 + r * dy}" width="${w}" height="${hh}" rx="1" fill="var(--surface)"/>`;
  }
  return out;
};

const art = {
  // Immeubles de bureaux
  corporate: frame(
    `<rect x="30" y="10" width="30" height="50" rx="2" fill="var(--muted)"/>${windows(35, 15, 3, 6, 8, 7)}`
    + `<rect x="64" y="24" width="26" height="36" rx="2" fill="var(--accent)"/>${windows(69, 29, 3, 4, 7, 7)}`
    + `<rect x="44" y="52" width="6" height="8" fill="var(--surface)"/>`),
  // Bâtiment administratif à colonnes
  public: frame(
    `<path d="M28 24L60 8l32 16z" fill="var(--accent)"/><rect x="30" y="24" width="60" height="5" fill="var(--muted)"/>`
    + [36, 48, 60, 72, 84].map((x) => `<rect x="${x - 3}" y="31" width="6" height="23" fill="var(--muted)"/>`).join('')
    + `<rect x="28" y="54" width="64" height="6" fill="var(--muted)"/>`),
  // Usine à toit en sheds
  'eti-pme': frame(
    `<path d="M24 60V34l14-10v10l14-10v10l14-10v36z" fill="var(--muted)"/>`
    + `<rect x="72" y="14" width="8" height="46" fill="var(--accent)"/><rect x="66" y="40" width="30" height="20" fill="var(--muted)"/>`
    + `${windows(30, 44, 4, 1, 8, 0, 5, 7)}<rect x="74" y="48" width="8" height="12" fill="var(--surface)"/>`),
  // Tableau de présentation et pupitre
  conseil: frame(
    `<rect x="26" y="8" width="56" height="36" rx="3" fill="var(--muted)"/>`
    + `<path d="M34 36l10-10 8 6 12-14 10 8" fill="none" stroke="var(--surface)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="M54 44v16M44 60l10-8 10 8" stroke="var(--muted)" stroke-width="3" fill="none" stroke-linecap="round"/>`
    + `<rect x="86" y="34" width="14" height="26" rx="2" fill="var(--accent)"/>`),
  // Coffre et pièces
  finance: frame(
    `<rect x="26" y="18" width="42" height="42" rx="4" fill="var(--muted)"/><circle cx="47" cy="39" r="11" fill="var(--surface)"/>`
    + `<circle cx="47" cy="39" r="5" fill="var(--muted)"/><path d="M47 28v-0M47 50v0" stroke="var(--muted)"/>`
    + [0, 1, 2, 3].map((i) => `<rect x="76" y="${52 - i * 7}" width="24" height="6" rx="3" fill="var(--accent)"/>`).join('')),
};

export function saleTypeIllustration(type) {
  return art[type] || frame('');
}
