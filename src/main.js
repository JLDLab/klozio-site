// Point d'entrée : édition en cours, sauvegarde, thème, écrans. L'accueil s'affiche sans les deals (M9) : leur
// index se charge juste après, à la demande, et les écrans qui en ont besoin l'attendent.
import { config } from './config.js';
import { catalogue, activeEditions, loadEditionMeta, loadDeals, loadDealIndex, duelSegment } from './content/editions/index.js';
import { playableDeals } from './content/schema.js';
import { texts, applyVocab, setLang } from './content/texts.js';
import { pickLang, loadDict } from './core/lang.js';
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
import { duelScreen, resolveDuel } from './ui/screens/duel.js';
import { decodeDuel } from './game/duel.js';
import { trainingScreen, drillScreen } from './ui/screens/training.js';
import { introScreen } from './ui/screens/intro.js';
import { codeScreen } from './ui/screens/code.js';
import { teamScreen } from './ui/screens/team.js';
import { editionIndex } from './access/client.js';
import { isPlayApp } from './core/play.js';
import { createSound } from './audio/sound.js';
import { h } from './ui/dom.js';
import { toast } from './ui/toast.js';
import { track } from './measure/beacon.js';

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

// Langue (M14) : ?lang= est retenu sur l'appareil puis retiré de l'adresse, comme ?deal= et ?code=.
const langParam = query.get(config.i18n.param);
// M17-B : un lien de défi porte la langue de l'émetteur (?from=), retenue seulement si le receveur n'a pas choisi
const langHint = query.get(config.i18n.hintParam);
const lang = pickLang({ param: langParam, saved: prefs.lang, hint: langHint, browser: navigator.language });
if (langHint !== null) query.delete(config.i18n.hintParam);
if (langParam !== null) {
  if (lang === langParam) prefs.lang = lang;
  query.delete(config.i18n.param);
  const rest = query.toString();
  history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`);
}
setLang(lang, await loadDict(lang));
document.documentElement.lang = lang;

// M17-B : lien de défi ?defi=KLZ-AE-XXXXX : ouvre directement le deal du défi (dans son édition), avant l'introduction ;
// le paramètre est retiré de l'adresse.
const deepDuel = query.get(config.pwa.duelParam);
if (deepDuel !== null || langHint !== null) {
  query.delete(config.pwa.duelParam);
  const rest = query.toString();
  history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`);
}
const duelEdition = deepDuel ? decodeDuel(deepDuel).edition : null;
if (duelEdition && activeEditions().some((e) => e.id === duelEdition)) prefs.edition = duelEdition;

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

// Lien de la page code/ (M10-B lot B) : ?code=KLZ-… ouvre « J'ai un code », code saisi, après l'introduction. Le
// paramètre est retiré de l'adresse (il ne reste ni dans l'historique ni dans un partage).
const deepCode = query.get(config.pwa.codeParam);
if (deepCode !== null) {
  query.delete(config.pwa.codeParam);
  const rest = query.toString();
  history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`);
}

track('visit', edition.id); // mesure (M9 lot 4) : un chargement de page

const ctx = {
  dev,
  play: isPlayApp(), // app Google Play (M12) : pas d'offres ni de prix dans l'app (M13)
  catalogue,
  edition,
  et, // textes de l'édition
  deals: null, // deals jouables, null tant que l'index n'est pas chargé (ctx.whenDeals)
  allDeals: null,
  invalid: [],
  dealsTotal: 0, // deals de l'édition complète (M10-A) ; plus que ctx.deals.length quand seuls les gratuits sont publiés
  offer: null, // M13 : { edition, all } deals de l'édition à son prix et de Tout KLOZIO (index publié) ; null sinon
  partial() { return ctx.dealsTotal > ctx.deals.length; },
  prefs,
  lang,
  // Changer de langue : retenue sur l'appareil, le jeu redémarre dans la langue choisie ; depuis l'introduction
  // (`intro`), il la relance au début.
  setLang(next, { intro = false } = {}) {
    if (next === lang) return;
    ctx.prefs.lang = next;
    if (intro) ctx.prefs.introSeen = false;
    ctx.persistPrefs();
    location.reload();
  },
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
// Avec un code qui ouvre l'édition (M12) : l'édition complète, servie par le Worker ou lue du cache chiffré.
// M14 : les deals de la langue en cours ; un deal sans version dans cette langue n'apparaît nulle part.
// M16 : avec un code, les chiffres des offres (accès affiché sur l'accueil ordinateur) viennent de l'index publié.
ctx.whenDeals = () => (dealsLoad ??= editionIndex(edition.id, (id) => loadDealIndex(id, undefined, lang), { lang }).then(async ({ deals: all, total, offer: given, nums, full }) => {
  const offer = given ?? (full ? (await loadDealIndex(edition.id, undefined, lang).catch(() => null))?.offer : null);
  const { deals, invalid } = playableDeals(all, edition, { dev });
  if (dev) for (const bad of invalid) console.warn(`deal ignoré : ${bad.id}`, bad.errors);
  Object.assign(ctx, { allDeals: all, deals, invalid, dealsTotal: Math.max(total ?? 0, deals.length), offer: offer ?? null, nums: nums ?? null });
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
if (prefs.edition !== edition.id || (langParam !== null && prefs.lang === lang)) {
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
  code: codeScreen,
  team: teamScreen,
}, ctx);
ctx.go = (name, ...rest) => (reloadPending && !inDeal.includes(name) ? location.reload() : router.go(name, ...rest));
// M16 : la fenêtre passe sous ou au-dessus de config.ui.desktopMinPx : l'accueil se redessine (mobile ↔ ordinateur).
matchMedia(`(min-width: ${config.ui.desktopMinPx}px)`).addEventListener('change', () => { if (router.current === 'home') ctx.go('home', {}, { push: false }); });
window.addEventListener('popstate', () => { if (reloadPending) location.reload(); });

// Lien profond : le deal de l'édition en cours, sinon celui d'une autre édition active (on bascule sur elle et on
// recharge avec le même lien). Rien trouvé : l'accueil, avec un toast si seuls les deals gratuits sont publiés
// (M10-A : le deal est sans doute dans l'édition complète ; ses identifiants ne sont pas publiés).
async function openDeepLink(id) {
  await ctx.whenDeals();
  if (ctx.deals.some((d) => d.id === id)) return ctx.go('game', { id });
  for (const other of activeEditions().filter((e) => e.id !== edition.id)) {
    const [{ edition: ed }, all] = await Promise.all([loadEditionMeta(other.id), loadDeals(other.id, undefined, lang)]);
    if (playableDeals(all, ed, { dev }).deals.some((d) => d.id === id)) {
      ctx.prefs.edition = other.id;
      ctx.persistPrefs();
      query.set(config.pwa.dealParam, id);
      return location.replace(`${location.pathname}?${query}`);
    }
  }
  if (ctx.partial()) toast(texts.ui.inFullEdition(duelSegment(edition.id)));
  return undefined;
}
if (deepDeal) ctx.afterIntro = () => { ctx.afterIntro = null; openDeepLink(deepDeal).catch(() => {}); };
if (deepCode) ctx.afterIntro = () => { ctx.afterIntro = null; ctx.go('code', { code: deepCode.slice(0, 20) }); };
// M17-B : le deal du défi, tout de suite ; un code invalide ouvre « Relever un défi », code saisi
if (deepDuel) {
  ctx.afterIntro = () => {
    ctx.afterIntro = null;
    ctx.whenDeals().then(() => {
      const r = resolveDuel(deepDuel, ctx);
      if (r.error) return ctx.go('duel', { code: deepDuel.slice(0, 20) });
      return ctx.go('game', { id: r.deal.id, duel: { code: deepDuel.trim().toUpperCase(), grades: r.grades } }, { push: false });
    }).catch(() => {});
  };
}

if (splashDue()) showSplash({ reduced: reducedMotion(prefs.options) }); // une fois par jour, au-dessus du premier écran
router.go(prefs.introSeen ? 'home' : 'intro', {}, { push: false });
performance.mark('klozio-ready'); // premier écran utilisable (mesuré par npm run check:browser)
// Écran de démarrage (index.html) : retiré quand le jeu est prêt, mais pas avant config.splash.bootMinMs depuis le début
// du chargement ; l'écran d'ouverture du jour, s'il est dû, est déjà au-dessus.
const boot = document.getElementById('boot');
if (boot) {
  setTimeout(() => {
    boot.classList.add('out');
    setTimeout(() => boot.remove(), 300);
  }, Math.max(0, config.splash.bootMinMs - performance.now()));
}
if ((prefs.introSeen || deepDuel) && ctx.afterIntro) ctx.afterIntro();
else requestAnimationFrame(() => setTimeout(() => ctx.whenDeals().catch(() => {}))); // après le premier affichage
