let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;

  // Safety-first build: do not touch the native magic-wand button/menu yet.
  // This build intentionally performs no DOM mutation or MutationObserver work.
  window.MagicWandOrganizer = {
    refresh() {},
    inspect() {
      return {
        buttonFound: !!document.getElementById('extensionsMenuButton'),
        menuFound: !!document.getElementById('extensionsMenu'),
        nativeItems: 0,
        tavernHelperItems: 0,
        registeredItems: 0,
        total: 0,
        mode: 'safe-passive'
      };
    }
  };

  console.info('[MagicWandOrganizer] safe passive build loaded; native menu untouched');
}

if (window.jQuery) {
  window.jQuery(() => init());
} else {
  setTimeout(init, 0);
}
