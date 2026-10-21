// Campagne (§4.9) : deals rangés par type de vente. Tous ouverts, sauf si campaign.lockEnabled.
import { config } from '../config.js';

// Ordre dans un type : difficulté croissante (si content.showDifficulty), puis ordre de l'index de contenu.
export function campaignOrder(deals, cfg = config) {
  const diff = (d) => (cfg.content.showDifficulty ? d.difficulty : 0);
  return deals.map((d, i) => ({ d, i })).sort((a, b) => diff(a.d) - diff(b.d) || a.i - b.i).map((x) => x.d);
}

// Groupes par type de vente : [{ type, entries: [{ deal, unlocked, best }], signed, total }].
// Verrouillage (campaign.lockEnabled) : dans un type, `openAtStart` deals ouverts, puis `unlockPerSigned`
// de plus par deal signé. Le mode développeur ouvre tout.
export function campaignGroups(deals, save, edition, { dev = false } = {}, cfg = config) {
  return edition.saleTypes.map((type) => {
    const ordered = campaignOrder(deals.filter((d) => d.saleType === type), cfg);
    const signed = ordered.filter((d) => save.best[d.id]?.verdict === 'signed').length;
    const open = cfg.campaign.openAtStart + signed * cfg.campaign.unlockPerSigned;
    return {
      type,
      signed,
      total: ordered.length,
      entries: ordered.map((deal, i) => ({ deal, unlocked: dev || !cfg.campaign.lockEnabled || i < open, best: save.best[deal.id] || null })),
    };
  }).filter((g) => g.total > 0);
}

// Deal suivant après `id` : le prochain ouvert du même type, sinon le premier ouvert d'un autre type.
export function nextDealId(deals, save, id, edition, opts = {}, cfg = config) {
  const groups = campaignGroups(deals, save, edition, opts, cfg);
  const flat = groups.flatMap((g) => g.entries.filter((e) => e.unlocked).map((e) => e.deal.id));
  if (flat.length === 0) return null;
  const at = flat.indexOf(id);
  return flat[(at + 1) % flat.length];
}
