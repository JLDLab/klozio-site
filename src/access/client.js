// Accès par code (M10-B lot A), côté jeu : identifiant d'appareil, saisie du code (/unlock), téléchargement d'une
// édition (/deals/:edition) et cache local chiffré pour jouer hors ligne. Pas de compte, pas d'email.
// Stockage : klozio.device.v1 (identifiant aléatoire), klozio.access.v1 (code et ce qu'il ouvre),
// klozio.deals.<édition>.v1 (index de l'édition chiffré en AES-GCM, clé dérivée du code par PBKDF2).
// Le service worker ne met jamais ces réponses en cache (autre origine) ; le Worker les marque no-store.
import { config } from '../config.js';
import { errorMessage } from '../content/texts.js';

const DEVICE_KEY = 'klozio.device.v1';
const ACCESS_KEY = 'klozio.access.v1';
// Cache chiffré d'une édition, par langue (M14) : la clé française ne change pas, l'anglaise porte .en.
const dealsKey = (edition, lang = 'fr') => `klozio.deals.${edition}${lang === 'fr' ? '' : `.${lang}`}.v1`;
// Base64 par tranches : un index d'édition (plusieurs centaines de Ko) dépasse la pile d'un seul appel.
function b64(bytes) {
  const u8 = new Uint8Array(bytes);
  let text = '';
  for (let i = 0; i < u8.length; i += 0x8000) text += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(text);
}
const unb64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const read = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
const write = (storage, key, value) => { try { storage.setItem(key, value); return true; } catch { return false; } };

// Identifiant de l'appareil : tiré au hasard à la première saisie d'un code, lié à rien d'autre.
export function deviceId(storage = globalThis.localStorage) {
  let id = read(storage, DEVICE_KEY);
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id ?? '')) {
    id = b64(crypto.getRandomValues(new Uint8Array(18))).replace(/\+/g, '-').replace(/\//g, '_');
    write(storage, DEVICE_KEY, id);
  }
  return id;
}

export function savedAccess(storage = globalThis.localStorage) {
  try { return JSON.parse(read(storage, ACCESS_KEY)) ?? null; } catch { return null; }
}

// Saisie d'un code → { ok: true, access } ou { ok: false, error, message } (message prêt à afficher, errorMessage).
export async function unlock(code, { storage = globalThis.localStorage, fetch: f = globalThis.fetch, endpoint = config.access.endpoint } = {}) {
  let res;
  try {
    res = await f(`${endpoint}/unlock`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ code, device_id: deviceId(storage) }) });
  } catch {
    return { ok: false, error: 'network', message: errorMessage('network') };
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error ?? 'invalid', message: errorMessage(body.error ?? 'invalid', body.message) };
  const access = { code: body.code, kind: body.kind, editions: body.editions, team_id: body.team_id };
  write(storage, ACCESS_KEY, JSON.stringify(access));
  return { ok: true, access };
}

async function keyFor(code, salt, usage, iterations) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, { name: 'AES-GCM', length: 256 }, false, [usage]);
}

export async function encryptIndex(code, index, iterations = config.access.kdfIterations) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFor(code, salt, 'encrypt', iterations), new TextEncoder().encode(JSON.stringify(index)));
  return JSON.stringify({ v: 1, it: iterations, salt: b64(salt), iv: b64(iv), data: b64(data) });
}

// Index déchiffré, ou null (autre code, données abîmées).
export async function decryptIndex(code, stored) {
  try {
    const { v, it, salt, iv, data } = JSON.parse(stored);
    if (v !== 1) return null;
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await keyFor(code, unb64(salt), 'decrypt', it), unb64(data));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}

// Index complet d'une édition { edition, total, deals } : téléchargé si possible (puis mis en cache chiffré),
// sinon lu du cache local (hors ligne). { ok: false, error, message } si le code ne l'ouvre pas.
// M14 : `lang` (fr par défaut) choisit les deals de cette langue (GET /deals/:edition?lang=en) et leur cache.
export async function loadPaidEdition(edition, { storage = globalThis.localStorage, fetch: f = globalThis.fetch, endpoint = config.access.endpoint, lang = 'fr' } = {}) {
  const access = savedAccess(storage);
  if (!access?.code || !access.editions?.includes(edition)) return { ok: false, error: 'edition', message: errorMessage('edition') };
  const url = `${endpoint}/deals/${encodeURIComponent(edition)}?code=${encodeURIComponent(access.code)}&device_id=${encodeURIComponent(deviceId(storage))}${lang === 'fr' ? '' : `&lang=${lang}`}`;
  let res = null;
  try { res = await f(url, { cache: 'no-store' }); } catch { /* hors ligne : cache local */ }
  if (res?.ok) {
    const index = await res.json();
    write(storage, dealsKey(edition, lang), await encryptIndex(access.code, index));
    return { ok: true, index, offline: false };
  }
  if (res && res.status !== 429 && res.status < 500) {
    const body = await res.json().catch(() => ({}));
    if (body.error === 'revoked' || body.error === 'unknown') { try { storage.removeItem(dealsKey(edition, lang)); } catch { /* sans stockage */ } }
    return { ok: false, error: body.error ?? 'invalid', message: errorMessage(body.error ?? 'invalid', body.message) };
  }
  const cached = read(storage, dealsKey(edition, lang));
  const index = cached && await decryptIndex(access.code, cached);
  return index ? { ok: true, index, offline: true } : { ok: false, error: 'network', message: errorMessage('network') };
}

// Index de deals d'une édition pour le jeu : l'édition complète si le code enregistré l'ouvre (en ligne, ou hors
// ligne depuis le cache chiffré), sinon l'index publié (deals gratuits). `loadFree(edition)` → { deals, total }.
export async function editionIndex(edition, loadFree, opts = {}) {
  if (savedAccess(opts.storage ?? globalThis.localStorage)?.editions?.includes(edition)) {
    const paid = await loadPaidEdition(edition, opts).catch(() => null);
    if (paid?.ok) return { deals: paid.index.deals, total: paid.index.total, full: true };
  }
  return { ...(await loadFree(edition)), full: false };
}
