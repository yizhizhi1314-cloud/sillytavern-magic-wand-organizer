import { discoverItems, inspect } from './api.js';
import { getState, patchState } from './state.js';
import { createUI, render } from './ui.js';
import { bindKeyboard } from './events.js';

let initialized = false;
let menuObserver = null;
let refreshTimer = null;
let items = [];
let uiRoot = null;
let originalDisplay = new Map();

const getNativeButton = () => document.getElementById('extensionsMenuButton');
const getNativeMenu = () => document.getElementById('extensionsMenu');

function discover() {
  const next = discoverItems();
  const changed = next.length !== items.length || next.some((x, i) =>
    x.id !== items[i]?.id || x.name !== items[i]?.name
  );
  items = next;
  if (uiRoot && (isMenuOpen() || changed)) render(uiRoot, items, api);
}

function scheduleDiscover() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(discover, 100);
}

function isMenuOpen() {
  const menu = getNativeMenu();
  if (!menu) return false;
  const style = getComputedStyle(menu);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function ensureUI() {
  const menu = getNativeMenu();
  if (!menu) return null;
  if (!uiRoot || !menu.contains(uiRoot)) {
    uiRoot = createUI();
    menu.appendChild(uiRoot);
  }
  return uiRoot;
}

function hideOriginalItems() {
  const menu = getNativeMenu();
  if (!menu) return;
  for (const child of [...menu.children]) {
    if (child === uiRoot) continue;
    if (!originalDisplay.has(child)) {
      originalDisplay.set(child, child.style.display);
    }
    child.style.display = 'none';
  }
}

function restoreOriginalItems() {
  for (const [child, display] of originalDisplay) {
    if (!child.isConnected) continue;
    child.style.display = display;
  }
  originalDisplay.clear();
}

function showOrganizer() {
  const menu = getNativeMenu();
  if (!menu) return;

  try {
    const root = ensureUI();
    if (!root) return;

    discover();
    render(root, items, api);

    // Only hide native items after our own UI rendered successfully.
    hideOriginalItems();
    root.hidden = false;
  } catch (error) {
    console.error('[MagicWandOrganizer] organizer render failed; native menu remains available', error);
    restoreOriginalItems();
    if (uiRoot) uiRoot.hidden = true;
  }
}

function hideOrganizer() {
  restoreOriginalItems();
  if (uiRoot) uiRoot.hidden = true;
}

function watchMenu() {
  const menu = getNativeMenu();
  if (!menu) return false;

  if (menuObserver) menuObserver.disconnect();

  menuObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        if (isMenuOpen()) showOrganizer();
        else hideOrganizer();
        return;
      }

      if (mutation.type === 'childList') {
        // Never intercept the native button. Just wait for native items to settle.
        scheduleDiscover();
        if (isMenuOpen()) showOrganizer();
      }
    }
  });

  menuObserver.observe(menu, {
    attributes: true,
    attributeFilter: ['style'],
    childList: true,
    subtree: true,
  });

  // If the menu was already created and open before this extension initialized.
  if (isMenuOpen()) showOrganizer();
  return true;
}

function watchPage() {
  const observer = new MutationObserver(() => {
    const menu = getNativeMenu();
    if (menu && !menuObserver) watchMenu();
    scheduleDiscover();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function theme() {
  const current = getState().theme;
  patchState({
    theme: current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto',
  });
  if (uiRoot) render(uiRoot, items, api);
}

function closeOrganizer() {
  // The native button remains in charge of opening/closing the menu.
  // A close action here simply restores the native menu contents.
  restoreOriginalItems();
  if (uiRoot) uiRoot.hidden = true;
  const menu = getNativeMenu();
  if (menu && isMenuOpen()) {
    if (window.jQuery) window.jQuery(menu).fadeOut(120);
    else menu.style.display = 'none';
  }
}

async function execute(item) {
  try {
    restoreOriginalItems();
    if (uiRoot) uiRoot.hidden = true;
    await item.execute();
  } catch (error) {
    console.error('[MagicWandOrganizer] execute failed', item, error);
  }
}

function refresh() {
  discover();
  if (isMenuOpen()) showOrganizer();
}

const api = {
  theme,
  close: closeOrganizer,
  render: () => uiRoot && render(uiRoot, items, api),
  execute,
  isOpen: isMenuOpen,
};

export function init() {
  if (initialized) return;
  initialized = true;

  watchPage();
  watchMenu();
  discover();
  bindKeyboard(api);

  window.MagicWandOrganizer = {
    refresh,
    inspect: () => ({
      ...inspect(),
      organizerVisible: !!uiRoot && !uiRoot.hidden,
      nativeButtonUntouched: true,
    }),
  };

  console.info('[MagicWandOrganizer] passive native-menu integration ready', window.MagicWandOrganizer.inspect());
}

if (window.jQuery) window.jQuery(() => init());
else setTimeout(init, 0);
