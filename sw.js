// Service worker de KLOZIO (gabarit : `npm run dist` remplace VERSION et FILES et l'écrit dans dist/sw.js).
// Cache versionné : la version est l'empreinte des fichiers publiés, elle change à chaque modification.
// Fichiers du jeu : cache d'abord (jeu hors ligne) ; navigation : index.html du cache ; anciens caches effacés.
// Index des deals (M9) : hors du précache, mis en cache au premier chargement de chaque édition, puis servis du cache.
const VERSION = '0678de0ac964';
const FILES = [
  "./",
  "./404.html",
  "./assets/fonts/OFL-ibmplexmono.txt",
  "./assets/fonts/OFL-inter.txt",
  "./assets/fonts/OFL-outfit.txt",
  "./assets/fonts/ibm-plex-mono-500-latin.woff2",
  "./assets/fonts/inter-latin.woff2",
  "./assets/fonts/outfit-latin.woff2",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon-32.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./code/index.html",
  "./en/code/index.html",
  "./en/index.html",
  "./en/offres/index.html",
  "./fr/index.html",
  "./i18n/en.json",
  "./i18n/fr.json",
  "./index.html",
  "./manifest.webmanifest",
  "./offres/index.html",
  "./public/brand/klozio_icone_bleu.svg",
  "./public/brand/klozio_icone_creme_bleu.svg",
  "./public/brand/klozio_icone_maskable_512.svg",
  "./public/brand/klozio_icone_soleil.svg",
  "./public/brand/klozio_logo_bleu_creme.svg",
  "./public/brand/klozio_logo_bleu_transparent.svg",
  "./public/brand/klozio_logo_corail_creme.svg",
  "./public/brand/klozio_logo_corail_transparent.svg",
  "./public/brand/klozio_logo_creme_sur_soleil.svg",
  "./public/brand/klozio_wordmark_bleu_mono.svg",
  "./public/brand/klozio_wordmark_chocolat_bleu.svg",
  "./public/brand/klozio_wordmark_chocolat_mono.svg",
  "./public/brand/klozio_wordmark_creme_bleu.svg",
  "./public/brand/klozio_z_bleu.svg",
  "./public/brand/klozio_z_corail.svg",
  "./src/access/client.js",
  "./src/access/team.js",
  "./src/audio/sound.js",
  "./src/config.js",
  "./src/content/arrange.js",
  "./src/content/editions/ae/edition.js",
  "./src/content/editions/ae/texts.js",
  "./src/content/editions/index.js",
  "./src/content/editions/sales-sdr/edition.js",
  "./src/content/editions/sales-sdr/texts.js",
  "./src/content/editions/sales-vp/edition.js",
  "./src/content/editions/sales-vp/texts.js",
  "./src/content/schema.js",
  "./src/content/serialize.js",
  "./src/content/texts.js",
  "./src/core/lang.js",
  "./src/core/play.js",
  "./src/core/rng.js",
  "./src/core/router.js",
  "./src/core/save.js",
  "./src/game/campaign.js",
  "./src/game/daily.js",
  "./src/game/deal.js",
  "./src/game/duel.js",
  "./src/game/pacing.js",
  "./src/game/progress.js",
  "./src/game/rank.js",
  "./src/game/training.js",
  "./src/main.js",
  "./src/measure/beacon.js",
  "./src/share/share.js",
  "./src/ui/app.css",
  "./src/ui/choices.js",
  "./src/ui/contrast.js",
  "./src/ui/desktop.js",
  "./src/ui/dom.js",
  "./src/ui/fonts.css",
  "./src/ui/head.js",
  "./src/ui/icons.js",
  "./src/ui/illustrations.js",
  "./src/ui/lang.js",
  "./src/ui/revenue.js",
  "./src/ui/screens/campaign.js",
  "./src/ui/screens/code.js",
  "./src/ui/screens/debrief-desktop.js",
  "./src/ui/screens/debrief.js",
  "./src/ui/screens/duel.js",
  "./src/ui/screens/first-visit.js",
  "./src/ui/screens/game.js",
  "./src/ui/screens/home-desktop.js",
  "./src/ui/screens/home.js",
  "./src/ui/screens/intro.js",
  "./src/ui/screens/options.js",
  "./src/ui/screens/profile.js",
  "./src/ui/screens/team.js",
  "./src/ui/screens/training.js",
  "./src/ui/splash.js",
  "./src/ui/theme.js",
  "./src/ui/toast.js",
  "./src/ui/tokens.js",
  "./src/ui/wheel.js"
];
const CACHE = `klozio-${VERSION}`;
const DEAL_INDEX = /\/src\/content\/editions\/[^/]+\/deals(-[a-z]{2})?\/index\.js$/; // deals/ et deals-en/ (M14)
const NETWORK_ONLY = /\/confidentialite(\/(index\.html)?)?$/; // confidentialite/ et en/confidentialite/

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('klozio-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Une réponse issue d'une redirection (ex. /index.html → / chez certains hébergeurs) est refusée par le
// navigateur pour une navigation : on la recopie sans son historique de redirection.
async function clean(response) {
  if (!response || !response.redirected) return response;
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers: response.headers });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  // Navigation : la page statique demandée si elle est en cache (offres/ M13, code/ M10-B lot B, et leur version en/
  // M14), sinon le jeu (index.html).
  if (request.mode === 'navigate') {
    const page = new URL(request.url);
    // Liste d'exclusion : confidentialite/ (Google Play) reste au réseau, jamais remplacée par le jeu.
    if (NETWORK_ONLY.test(page.pathname)) return;
    if (/\/(offres|code|en|fr)$/.test(page.pathname)) page.pathname += '/'; // M14 : entrées de langue en/ et fr/
    if (page.pathname.endsWith('/')) page.pathname += 'index.html';
    page.search = '';
    event.respondWith(caches.open(CACHE)
      .then(async (cache) => (await cache.match(page.href)) || (await cache.match('./')) || cache.match('./index.html'))
      .then(clean)
      .then((hit) => hit || fetch(request)));
    return;
  }
  if (DEAL_INDEX.test(new URL(request.url).pathname)) {
    event.respondWith(caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request, { ignoreSearch: true });
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  event.respondWith(caches.match(request, { cacheName: CACHE, ignoreSearch: true }).then((hit) => hit || fetch(request)));
});
