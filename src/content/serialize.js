// Écriture canonique des deals d'une édition : un fichier par deal (editions/<id>/deals/<deal>.js)
// et un index ordonné (deals/index.js). Ordre des clés fixe, pour des diffs lisibles.
// Utilisé par l'atelier (via le serveur de dev) et par l'import du prototype.

function canonicalOption(o) {
  const out = { grade: o.grade, text: o.text, feedback: o.feedback };
  if (o.event) out.event = { text: o.event.text, temp: o.event.temp };
  if (o.valueImpact !== undefined) out.valueImpact = o.valueImpact;
  if (o.valueReason !== undefined) out.valueReason = o.valueReason;
  return out;
}

export function canonicalDeal(d) {
  return {
    id: d.id,
    edition: d.edition,
    num: d.num,
    title: d.title,
    contact: { role: d.contact?.role, org: d.contact?.org },
    value: d.value,
    sector: d.sector,
    saleType: d.saleType,
    difficulty: d.difficulty,
    status: d.status,
    author: d.author,
    ...(d.vecu === true ? { vecu: true } : {}),
    steps: (d.steps || []).map((s) => ({
      context: s.context,
      question: s.question,
      options: (s.options || []).map(canonicalOption),
      ...(s.post ? { post: { t: s.post.t, h: s.post.h } } : {}),
    })),
  };
}

export function serializeDeal(d) {
  return '// Deal KLOZIO. Format : voir src/content/schema.js. Seul Jordan passe un deal en status "valide".\n'
    + '// Fichier écrit par l\'atelier de contenu (src/tools/editor.html) : éditer de préférence avec lui.\n'
    + `export default ${JSON.stringify(canonicalDeal(d), null, 2)};\n`;
}

const binding = (id) => `d_${id.replace(/-/g, '_')}`;

// Index des deals d'une édition, dans l'ordre de la liste (ordre de la campagne à difficulté égale).
export function serializeIndex(ids) {
  return '// Deals de l\'édition, dans l\'ordre. Fichier écrit par l\'atelier de contenu : ne pas éditer à la main.\n'
    + ids.map((id) => `import ${binding(id)} from './${id}.js';\n`).join('')
    + `\nexport const deals = [\n${ids.map((id) => `  ${binding(id)},\n`).join('')}];\n\nexport default deals;\n`;
}

// Tous les fichiers d'une liste de deals : { 'index.js': …, '<id>.js': … }.
export function serializeDealFiles(deals) {
  const files = { 'index.js': serializeIndex(deals.map((d) => d.id)) };
  for (const d of deals) files[`${d.id}.js`] = serializeDeal(d);
  return files;
}
