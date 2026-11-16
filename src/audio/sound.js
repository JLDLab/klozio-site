// Sons synthétisés en WebAudio (§7, M18 lot C) : aucun fichier, coupés par défaut (préférence `sound`, mémorisée sur
// l'appareil). Quatre sons de moins de 150 ms : choix, réflexe senior, faute, signé. Rien sur « ça passe » ni sur les
// changements d'écran.
import { config } from '../config.js';

const TAIL_MS = 20; // l'oscillateur s'arrête un peu après la fin de l'enveloppe

// Les notes de chaque son : fréquence de départ et d'arrivée, durée, forme d'onde, retard, volume relatif.
export const soundNotes = Object.freeze({
  click: [{ from: 1400, to: 900, ms: 35, type: 'triangle', gain: 0.5 }], // clic sec
  senior: [{ from: 990, ms: 125, type: 'triangle' }], // note claire
  fault: [{ from: 190, to: 120, ms: 125, type: 'square', gain: 0.6, lowpass: 600 }], // son sourd
  signed: [{ from: 660, ms: 60, type: 'triangle' }, { from: 990, ms: 70, type: 'triangle', delay: 55 }], // deux notes montantes
});

export const soundMs = (name) => Math.max(...soundNotes[name].map((n) => (n.delay || 0) + n.ms)) + TAIL_MS;

// Son du verdict : aucun sur « ça passe » (play(null) ne joue rien).
export function verdictSound(grade, cfg = config) {
  return { [Math.max(...cfg.deal.grades)]: 'senior', [Math.min(...cfg.deal.grades)]: 'fault' }[grade] ?? null;
}

// `options()` renvoie les préférences courantes. Retourne { play(name) } ; play renvoie true si un son part.
export function createSound(options, AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext, cfg = config) {
  let ac = null;
  const startAt = { senior: cfg.feel.verdictDelayMs, fault: cfg.feel.verdictDelayMs }; // avec le verdict, qui paraît après le choix

  function context() {
    if (!AudioCtx) return null;
    ac ||= new AudioCtx();
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }

  function tone(c, { from, to = from, ms, type = 'sine', delay = 0, gain = 1, lowpass = null }) {
    const t0 = c.currentTime + delay / 1000;
    const t1 = t0 + ms / 1000;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t1);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(cfg.audio.volume * gain, t0 + Math.min(0.012, ms / 4000));
    env.gain.exponentialRampToValueAtTime(0.0001, t1);
    let node = osc.connect(env);
    if (lowpass) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lowpass;
      node = node.connect(f);
    }
    node.connect(c.destination);
    osc.start(t0);
    osc.stop(t1 + TAIL_MS / 1000);
  }

  return {
    // Créer le contexte audio prend plusieurs dizaines de ms : à l'ouverture du deal, pas au premier toucher.
    warm() {
      if (options()?.sound) context();
    },
    play(name) {
      if (!options()?.sound || !soundNotes[name]) return false;
      const c = context();
      if (!c) return false;
      try {
        for (const note of soundNotes[name]) tone(c, { ...note, delay: (note.delay || 0) + (startAt[name] || 0) });
        return true;
      } catch {
        return false;
      }
    },
  };
}
