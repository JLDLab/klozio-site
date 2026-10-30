// App Google Play (M12) : l'app ouvre le site sur ?source=play. Retenu pour la session (sessionStorage) : le
// stockage local est partagé avec Chrome sur le même site, il dirait « Play » aussi dans le navigateur.
// M13 : dans l'app Play, ni offres ni prix (politique de paiement de Google Play).
const KEY = 'klozio.play';

export function isPlayApp(search = globalThis.location?.search ?? '', storage = globalThis.sessionStorage) {
  try {
    if (new URLSearchParams(search).get('source') === 'play') storage.setItem(KEY, '1');
    return storage.getItem(KEY) === '1';
  } catch {
    return new URLSearchParams(search).get('source') === 'play';
  }
}
