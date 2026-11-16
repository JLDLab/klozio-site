// Position de la meilleure réponse dans un deal (A6 par deal). Le jeu affiche les options dans l'ordre des
// données : cet ordre est donc le même pour tous (duel, deal du jour). Règle : une même position porte la
// meilleure réponse au plus `fairness.maxSamePosition` fois sur le deal, et jamais à deux étapes consécutives.
import { config } from '../config.js';
import { hashString } from '../core/rng.js';

const bestPosition = (step) => step.options.findIndex((o) => o.grade === Math.max(...config.deal.grades)) + 1;

export function bestPositions(deal) {
  return deal.steps.map(bestPosition);
}

// Non-conformités à la règle, en phrases (vide si conforme).
export function positionIssues(deal, cfg = config) {
  const p = bestPositions(deal);
  const out = [];
  for (let pos = 1; pos <= cfg.deal.optionsPerStep; pos += 1) {
    const n = p.filter((x) => x === pos).length;
    if (n > cfg.fairness.maxSamePosition) out.push(`A6 meilleure réponse ${n} fois en position ${pos} (max ${cfg.fairness.maxSamePosition})`);
  }
  const consec = p.findIndex((x, i) => i > 0 && x === p[i - 1]);
  if (consec > 0) out.push(`A6 meilleure réponse en position ${p[consec]} aux étapes ${consec} et ${consec + 1}`);
  return out;
}

// Toutes les suites de positions conformes pour `steps` étapes, dans l'ordre lexicographique.
export function validSequences(steps, cfg = config) {
  const out = [];
  const walk = (seq) => {
    if (seq.length === steps) { out.push(seq); return; }
    for (let pos = 1; pos <= cfg.deal.optionsPerStep; pos += 1) {
      if (seq.at(-1) === pos || seq.filter((x) => x === pos).length >= cfg.fairness.maxSamePosition) continue;
      walk([...seq, pos]);
    }
  };
  walk([]);
  return out;
}

// Copie du deal où la meilleure réponse de chaque étape est déplacée à la position d'une suite conforme,
// choisie par l'empreinte de l'identifiant (déterministe). Les deux autres options gardent leur ordre relatif.
// Aucun texte n'est modifié.
export function arrangeBest(deal, cfg = config) {
  const seqs = validSequences(deal.steps.length, cfg);
  const seq = seqs[hashString(deal.id) % seqs.length];
  return {
    ...deal,
    steps: deal.steps.map((step, i) => {
      const b = bestPosition(step) - 1;
      const others = step.options.filter((_, j) => j !== b);
      const options = [...others];
      options.splice(seq[i] - 1, 0, step.options[b]);
      return { ...step, options };
    }),
  };
}
