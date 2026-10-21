// Point d'entrée : édition en cours, sauvegarde, thème, écrans. L'accueil s'affiche sans les deals (M9) : leur
// index se charge juste après, à la demande, et les écrans qui en ont besoin l'attendent.
import { config } from './config.js';
import { catalogue, activeEditions, loadEditionMeta, loadDeals, loadDealIndex } from './content/editions/index.js';
import { playableDeals } from './content/schema.js';
import { texts, applyVocab } from './content/texts.js';
import { load, store, clear, loadPrefs, storePrefs, needsMigration } from './core/save.js';
import { createRouter } from './core/router.js';
import { installTokens, applyOptions, reducedMotion } from './ui/theme.js';
import { splashDue, showSplash } from './ui/splash.js';
import { homeScreen } from './ui/screens/home.js';
import { gameScreen } from './ui/screens/game.js';
import { debriefScreen } from './ui/screens/debrief.js';
import { optionsScreen } from './ui/screens/options.js';
import { campaignScreen } from './ui/screens/campaign.js';
import { profileScreen } from './ui/screens/profile.js';
import { duelScreen } from './ui/screens/duel.js';
import { trainingScreen, drillScreen } from './ui/screens/training.js';
import { introScreen } from './ui/screens/intro.js';
import { createSound } from './audio/sound.js';
import { h } from './ui/dom.js';
import { toast } from './ui/toast.js';

const query = new URLSearchParams(location.search);
const dev = query.has(config.content.devFlag);

// PWA : service worker en HTTPS seulement (jamais pendant le développement en http), ou sur localhost avec ?sw.
// Le fichier sw.js n'existe que dans dist/ (npm run dist).
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
// Nouvelle version publiée : le nouveau service worker prend la main (skipWaiting + claim) et efface l'ancien cache,
// mais la page ouverte reste l'ancienne. On recharge alors une fois : tout de suite, ou, pendant une partie, au
// premier changement d'écran après sa fin de deal (la partie et son débrief ne sont jamais coupés).
// L'app installée revient souvent du second plan sans nouvelle navigation : on cherche une mise à jour à ce moment.
let router = null;
let reloadPending = false;
const inDeal = ['game', 'debrief'];
if ('serviceWorker' in navigator && (location.protocol === 'https:' || (local && query.has(config.pwa.testFlag)))) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register('sw.js').then((reg) => {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloadPending) return;
    reloadPending = true;
    if (!inDeal.includes(router?.current)) location.reload();
  });
}
const prefs = loadPrefs();
applyOptions(prefs.options);

const active = activeEditions();
const editionId = active.find((e) => e.id === prefs.edition)?.id
  ?? active.find((e) => e.id === config.editions.default)?.id ?? active[0].id;
const { edition, texts: et } = await loadEditionMeta(editionId);
applyVocab(et.vocab); // vocabulaire de l'édition (« Trimestre », verdicts, notes…)
installTokens(edition);

// Lien profond ?deal=<id> (M9) : ouvre ce deal, après l'introduction si elle n'a jamais été vue. Le paramètre est
// retiré de l'adresse ; un identifiant inconnu laisse sur l'accueil.
const deepDeal = query.get(config.pwa.dealParam);
if (deepDeal !== null) {
  query.delete(config.pwa.dealParam);
  const rest = query.toString();
  history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`);
}

const ctx = {
  dev,
  catalogue,
  edition,
  et, // textes de l'édition
  deals: null, // deals jouables, null tant que l'index n'est pas chargé (ctx.whenDeals)
  allDeals: null,
  invalid: [],
  dealsTotal: 0, // deals de l'édition complète (M10-A) ; plus que ctx.deals.length quand seuls les gratuits sont publiés
  partial() { return ctx.dealsTotal > ctx.deals.length; },
  prefs,
  save: null,
  money: (v) => texts.ui.money(v, edition.valueUnit),
  persist() { store(edition.id, ctx.save); },
  persistPrefs() { storePrefs(ctx.prefs); },
  reset() { ctx.save = clear(edition.id); },
};

// Index des deals de l'édition : une seule requête, lancée après le premier écran (ou avant, si la sauvegarde
// doit être migrée). Le service worker le garde en cache après le premier chargement.
// `whenDeals()` lance le chargement ; `onDeals(ok, fail)` attend son issue sans le lancer (accueil).
let dealsLoad = null;
const listeners = [];
ctx.whenDeals = () => (dealsLoad ??= loadDealIndex(edition.id).then(({ deals: all, total }) => {
  const { deals, invalid } = playableDeals(all, edition, { dev });
  if (dev) for (const bad of invalid) console.warn(`deal ignoré : ${bad.id}`, bad.errors);
  Object.assign(ctx, { allDeals: all, deals, invalid, dealsTotal: Math.max(total ?? 0, deals.length) });
  for (const l of listeners.splice(0)) l.ok();
  return ctx;
}).catch((err) => {
  dealsLoad = null; // nouvel essai au prochain appel (hors ligne avant le premier chargement)
  for (const l of listeners.splice(0)) l.fail();
  throw err;
}));
ctx.onDeals = (ok, fail) => (ctx.deals ? ok() : listeners.push({ ok, fail }));
const loadSave = () => load(edition.id, globalThis.localStorage, config, { dealValue: (id) => ctx.allDeals?.find((d) => d.id === id)?.value });
if (needsMigration(edition.id)) await ctx.whenDeals().catch(() => {});
ctx.save = loadSave();
ctx.sound = createSound(() => ctx.prefs.options);
if (prefs.edition !== edition.id) {
  prefs.edition = edition.id;
  ctx.persistPrefs();
}

document.title = `${config.brand.name} ${edition.name}`;
// Écrans qui ont besoin des deals : tant que l'index n'est pas là, une ligne d'attente, puis l'écran demandé.
function withDeals(name, screen) {
  return (root, params, c) => {
    if (c.deals) return screen(root, params, c);
    const wait = h('p.muted.loading', { role: 'status' }, texts.ui.dealsLoading);
    root.append(wait);
    c.whenDeals().then(
      () => { if (root.contains(wait)) c.go(name, params, { push: false }); },
      () => { if (root.contains(wait)) wait.replaceWith(dealsFailed()); },
    );
    return {};
  };
}
function dealsFailed() {
  return h('div.stack', { role: 'alert' }, h('p', {}, texts.ui.dealsFailed),
    h('button.ghost', { type: 'button', onclick: () => location.reload() }, texts.ui.dealsRetry));
}
ctx.dealsFailed = dealsFailed;

router = createRouter(document.getElementById('app'), {
  home: homeScreen,
  game: withDeals('game', gameScreen),
  debrief: withDeals('debrief', debriefScreen),
  options: optionsScreen,
  campaign: withDeals('campaign', campaignScreen),
  profile: withDeals('profile', profileScreen),
  duel: withDeals('duel', duelScreen),
  training: withDeals('training', trainingScreen),
  drill: withDeals('drill', drillScreen),
  intro: introScreen,
}, ctx);
ctx.go = (name, ...rest) => (reloadPending && !inDeal.includes(name) ? location.reload() : router.go(name, ...rest));
window.addEventListener('popstate', () => { if (reloadPending) location.reload(); });

// Lien profond : le deal de l'édition en cours, sinon celui d'une autre édition active (on bascule sur elle et on
// recharge avec le même lien). Rien trouvé : l'accueil, avec un toast si seuls les deals gratuits sont publiés
// (M10-A : le deal est sans doute dans l'édition complète ; ses identifiants ne sont pas publiés).
async function openDeepLink(id) {
  await ctx.whenDeals();
  if (ctx.deals.some((d) => d.id === id)) return ctx.go('game', { id });
  for (const other of activeEditions().filter((e) => e.id !== edition.id)) {
    const [{ edition: ed }, all] = await Promise.all([loadEditionMeta(other.id), loadDeals(other.id)]);
    if (playableDeals(all, ed, { dev }).deals.some((d) => d.id === id)) {
      ctx.prefs.edition = other.id;
      ctx.persistPrefs();
      query.set(config.pwa.dealParam, id);
      return location.replace(`${location.pathname}?${query}`);
    }
  }
  if (ctx.partial()) toast(texts.ui.inFullEdition);
  return undefined;
}
if (deepDeal) ctx.afterIntro = () => { ctx.afterIntro = null; openDeepLink(deepDeal).catch(() => {}); };

if (splashDue()) showSplash({ reduced: reducedMotion(prefs.options) }); // une fois par jour, au-dessus du premier écran
router.go(prefs.introSeen ? 'home' : 'intro', {}, { push: false });
performance.mark('klozio-ready'); // premier écran utilisable (mesuré par npm run check:browser)
if (prefs.introSeen && ctx.afterIntro) ctx.afterIntro();
else requestAnimationFrame(() => setTimeout(() => ctx.whenDeals().catch(() => {}))); // après le premier affichage
