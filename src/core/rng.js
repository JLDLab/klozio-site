// Générateur pseudo-aléatoire seedé (mulberry32) : même graine, même suite.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Empreinte FNV-1a 32 bits d'une chaîne : graine stable tirée d'un identifiant.
export function hashString(s) {
  let h = 0x811c9dc5;
  for (const ch of s) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// Entier dans [0, n[.
export function randInt(rand, n) {
  return Math.floor(rand() * n);
}
