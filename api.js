// api.js - Discovery + execution adapters
const NATIVE_SELECTOR = '#extensionsMenu .extensionsMenuExtensionButton';

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

function getIcon(el) {
  const icon = el?.className && typeof el.className === 'string' ? el.className : '';
  const fa = icon.split(/\s+/).filter(x => /^fa-/.test(x));
  return fa.length ? fa.join(' ') : 'fa-solid fa-puzzle-piece';
}

function nativeItems() {
  const root = document.querySelector('#extensionsMenu');
  if (!root) return [];
  const seen = new Set();
  const result = [];

  root.querySelectorAll(NATIVE_SELECTOR).forEach((iconEl, index) => {
    const clickable = iconEl.closest('a, button, [role="button"], .list-group-item') || iconEl.parentElement || iconEl;
    if (!clickable || seen.has(clickable)) return;

    const style = getComputedStyle(clickable);
    if (style.display === 'none' || style.visibility === 'hidden') return;

    const name = clean(
      clickable.querySelector('span')?.textContent ||
      clickable.innerText ||
      iconEl.title ||
      iconEl.getAttribute('aria-label')
    );
    if (!name) return;

    seen.add(clickable);
    result.push({
      id: `native:${clickable.id || index}`,
      name,
      icon: getIcon(iconEl),
      source: 'native',
      categoryHint: name,
      originalElement: clickable,
      execute: () => clickable.click(),
    });
  });

  return result;
}

function flattenScriptData(items) {
  if (!Array.isArray(items)) return [];
  const out = [];

  for (const item of items) {
    if (!item) continue;
    if (item.type === 'folder') {
      out.push(...flattenScriptData(item.scripts || item.value || []));
    } else if (item.type === 'script' && item.value) {
      out.push(item.value);
    } else if (item.id) {
      out.push(item);
    }
  }

  return out;
}

function scriptNameMap() {
  const map = new Map();

  try {
    const ctx = window.SillyTavern?.getContext?.();
    const settings = ctx?.extensionSettings?.tavern_helper;
    const scripts = settings?.script?.scripts || settings?.scripts;
    flattenScriptData(scripts).forEach(script => {
      map.set(script.id, script.name || script.id);
    });
  } catch {}

  return map;
}

function tavernHelperItems() {
  const fn = window.TavernHelper?.getAllEnabledScriptButtons;
  if (typeof fn !== 'function') return [];

  try {
    const buttonsMap = fn();
    if (!buttonsMap || typeof buttonsMap !== 'object') return [];

    const names = scriptNameMap();
    const result = [];

    for (const [scriptId, buttons] of Object.entries(buttonsMap)) {
      if (!Array.isArray(buttons)) continue;

      for (const button of buttons) {
        const label = clean(button?.button_name);
        const buttonId = button?.button_id;
        if (!label || !buttonId) continue;

        result.push({
          id: `jsr:${scriptId}:${buttonId}`,
          name: label,
          icon: 'fa-solid fa-code',
          source: 'tavern-helper',
          categoryHint: names.get(scriptId) || '脚本工具',
          meta: names.get(scriptId) || 'Tavern Helper',
          execute: () => window.SillyTavern?.getContext?.()?.eventSource?.emit(buttonId),
        });
      }
    }

    return result;
  } catch (error) {
    console.warn('[MagicWandOrganizer] Tavern Helper discovery failed', error);
    return [];
  }
}

function registeredItems() {
  const registry = Array.isArray(window.magicWandOrganizerExtensions)
    ? window.magicWandOrganizerExtensions
    : [];

  return registry.flatMap((entry, index) => {
    try {
      if (!entry?.name || typeof entry.execute !== 'function') return [];

      return [{
        id: entry.id || `registered:${index}:${entry.name}`,
        name: clean(entry.name),
        icon: entry.icon || 'fa-solid fa-puzzle-piece',
        source: 'registered',
        categoryHint: entry.category || entry.name,
        meta: entry.source || '第三方',
        execute: entry.execute,
      }];
    } catch {
      return [];
    }
  });
}

export function discoverItems() {
  const all = [...nativeItems(), ...tavernHelperItems(), ...registeredItems()];
  const seen = new Set();

  return all.filter(item => {
    const key = `${item.source}|${item.id}|${item.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function inspect() {
  const menu = document.querySelector('#extensionsMenu');
  const native = nativeItems();
  const jsr = tavernHelperItems();
  const registered = registeredItems();

  return {
    buttonFound: !!document.querySelector('#extensionsMenuButton'),
    menuFound: !!menu,
    nativeItems: native.length,
    tavernHelperItems: jsr.length,
    registeredItems: registered.length,
    total: native.length + jsr.length + registered.length,
  };
}
