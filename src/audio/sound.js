// Sons synthétisés en WebAudio (§7), sans fichier. Coupés par défaut (préférence `sound`).
// Clic de choix ; révélation : montant (note 3), neutre (note 1), mat (note 0) ; tampon du verdict.
import { config } from '../config.js';

// `options()` renvoie les préférences courantes. Retourne { play(name, arg) } ; play renvoie true si un son part.
export function createSound(options, AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext) {
  let ac = null;
  const a = config.audio;

  function context() {
    if (!AudioCtx) return null;
    ac ||= new AudioCtx();
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }

  // Une note : fréquence de départ et d'arrivée, durée, forme d'onde, retard, volume relatif.
  function tone(c, { from, to = from, ms, type = 'sine', delay = 0, gain = 1, lowpass = null }) {
    const t0 = c.currentTime + delay / 1000;
    const t1 = t0 + ms / 1000;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t1);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(a.volume * gain, t0 + Math.min(0.012, ms / 4000));
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
    osc.stop(t1 + 0.02);
  }

  const sounds = {
    click: (c) => tone(c, { from: 1400, to: 900, ms: 35, type: 'triangle', gain: 0.5 }),
    reveal: (c, grade) => {
      if (grade === 3) {
        tone(c, { from: 660, ms: 110, type: 'triangle', delay: 40 });
        tone(c, { from: 990, ms: 180, type: 'triangle', delay: 140 });
      } else if (grade === 1) {
        tone(c, { from: 520, ms: 150, type: 'sine', delay: 40, gain: 0.8 });
      } else {
        tone(c, { from: 190, to: 120, ms: 220, type: 'square', delay: 40, gain: 0.6, lowpass: 600 });
      }
    },
    stamp: (c) => {
      tone(c, { from: 140, to: 55, ms: 260, type: 'sine', gain: 1.4 });
      tone(c, { from: 2400, to: 300, ms: 70, type: 'square', gain: 0.25, lowpass: 2500 });
    },
  };

  return {
    play(name, arg) {
      if (!options()?.sound || !sounds[name]) return false;
      const c = context();
      if (!c) return false;
      try {
        sounds[name](c, arg);
        return true;
      } catch {
        return false;
      }
    },
  };
}
