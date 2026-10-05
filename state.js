const KEY = 'st-magic-wand-organizer-v2';
const DEFAULT = {
  theme: 'auto',
  favorites: [],
  category: '全部',
  search: '',
};

let state = load();

function load() {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT };
  }
}

export const getState = () => state;

export function saveState() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function patchState(patch) {
  state = { ...state, ...patch };
  saveState();
}

export function toggleFavorite(id) {
  const favorites = new Set(state.favorites);
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  state.favorites = [...favorites];
  saveState();
}

export { KEY };
