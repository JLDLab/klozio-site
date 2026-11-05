// Routeur d'écrans : un écran remplace le contenu de #app. Clavier délégué à l'écran courant.
// Bouton retour du téléphone : revient à l'accueil.
export function createRouter(root, screens, ctx) {
  let current = null;

  function go(name, params = {}, { push = true } = {}) {
    if (current?.cleanup) current.cleanup();
    root.replaceChildren();
    const screen = screens[name];
    current = screen(root, params, ctx) || {};
    current.name = name;
    if (push && name !== 'home') history.pushState({ screen: name }, '');
    window.scrollTo(0, 0);
    // A9 : si l'écran n'a pas placé le focus, il va au titre (annoncé par les lecteurs d'écran)
    if (!root.contains(document.activeElement)) {
      const title = root.querySelector('h1, h2');
      if (title) {
        title.setAttribute('tabindex', '-1');
        title.focus({ preventScroll: true });
      }
    }
  }

  window.addEventListener('popstate', () => go('home', {}, { push: false }));
  document.addEventListener('keydown', (ev) => {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    current?.onKey?.(ev);
  });

  return { go, get current() { return current?.name; } };
}
