import { getState, patchState, toggleFavorite } from './state.js';

const CATEGORY_RULES = [
  ['💬 聊天', /聊天|翻译|输入|回复|消息|chat|translate/i],
  ['🖼 图片', /图片|图像|绘|画|头像|图库|image|stable diffusion/i],
  ['🔊 多媒体', /tts|朗读|语音|音频|视频|media|speech/i],
  ['🧩 脚本', /脚本|script|code|tavern helper/i],
  ['🛠 管理', /管理|变量|日志|数据|备份|正则|token|提示词|楼层|preset/i],
];

export function categoryFor(item) {
  const text = `${item.name} ${item.categoryHint || ''} ${item.meta || ''}`;
  return CATEGORY_RULES.find(([, rule]) => rule.test(text))?.[0] || '⚙️ 其他';
}

function ensureStyle() {
  if (document.getElementById('mwo-v3-style')) return;

  const style = document.createElement('style');
  style.id = 'mwo-v3-style';
  style.textContent = `
#extensionsMenu .mwo-v3 {
  --mwo-bg: var(--SmartThemeBlurTintColor, var(--SmartThemeBodyColor, #1b1d22));
  --mwo-panel: var(--SmartThemeBlurTintColor, #24272f);
  --mwo-card: color-mix(in srgb, var(--mwo-panel) 88%, white 12%);
  --mwo-text: var(--SmartThemeBodyColor, #f2f3f5);
  --mwo-muted: var(--SmartThemeQuoteColor, #9da2ad);
  --mwo-border: color-mix(in srgb, var(--mwo-text) 14%, transparent);
  --mwo-accent: var(--SmartThemeEmColor, #8b6cff);
  box-sizing: border-box;
  width: min(520px, 92vw);
  max-width: 92vw;
  padding: 10px;
  color: var(--mwo-text);
  font-family: system-ui, -apple-system, "Microsoft YaHei", sans-serif;
}
#extensionsMenu .mwo-v3 * { box-sizing: border-box; }
#extensionsMenu .mwo-v3[hidden] { display: none !important; }
#extensionsMenu .mwo-v3-head { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
#extensionsMenu .mwo-v3-title { flex:1; font-size:16px; font-weight:800; }
#extensionsMenu .mwo-v3-count { font-size:11px; color:var(--mwo-muted); }
#extensionsMenu .mwo-v3-btn {
  border:1px solid var(--mwo-border); background:var(--mwo-card); color:var(--mwo-text);
  border-radius:9px; min-width:34px; height:34px; cursor:pointer;
}
#extensionsMenu .mwo-v3-search {
  width:100%; height:38px; border:1px solid var(--mwo-border); border-radius:10px;
  background:var(--mwo-card); color:var(--mwo-text); padding:0 11px; outline:none; margin-bottom:8px;
}
#extensionsMenu .mwo-v3-cats {
  display:flex; gap:6px; overflow-x:auto; padding-bottom:7px; scrollbar-width:none;
}
#extensionsMenu .mwo-v3-cat {
  flex:0 0 auto; border:1px solid var(--mwo-border); background:transparent; color:var(--mwo-text);
  border-radius:999px; padding:6px 10px; cursor:pointer; font-size:12px;
}
#extensionsMenu .mwo-v3-cat.on { background:var(--mwo-accent); border-color:var(--mwo-accent); color:#fff; }
#extensionsMenu .mwo-v3-grid {
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px;
  max-height:min(58vh,420px); overflow:auto; padding-right:2px;
}
#extensionsMenu .mwo-v3-card {
  position:relative; min-width:0; text-align:left; border:1px solid var(--mwo-border);
  border-radius:11px; background:var(--mwo-card); color:var(--mwo-text);
  padding:9px 31px 9px 10px; cursor:pointer;
}
#extensionsMenu .mwo-v3-card:active { transform:scale(.985); }
#extensionsMenu .mwo-v3-icon { font-size:17px; margin-bottom:4px; }
#extensionsMenu .mwo-v3-name { font-size:12px; font-weight:700; line-height:1.25; word-break:break-word; }
#extensionsMenu .mwo-v3-meta { color:var(--mwo-muted); font-size:10px; margin-top:3px; }
#extensionsMenu .mwo-v3-star {
  position:absolute; right:5px; top:4px; border:0; background:transparent;
  color:#e3ae25; font-size:16px; cursor:pointer;
}
#extensionsMenu .mwo-v3-empty { padding:25px 10px; text-align:center; color:var(--mwo-muted); font-size:12px; }
@media (max-width: 380px) {
  #extensionsMenu .mwo-v3-grid { grid-template-columns:1fr; }
}
`;
  document.head.appendChild(style);
}

export function createUI() {
  ensureStyle();
  const root = document.createElement('div');
  root.className = 'mwo-v3';
  root.hidden = true;
  root.innerHTML = `
    <div class="mwo-v3-head">
      <div class="mwo-v3-title">🪄 魔棒工具库</div>
      <div class="mwo-v3-count"></div>
      <button class="mwo-v3-btn" type="button" data-act="theme">🌓</button>
    </div>
    <input class="mwo-v3-search" type="search" placeholder="搜索工具…">
    <div class="mwo-v3-cats"></div>
    <div class="mwo-v3-grid"></div>
  `;

  root.querySelector('[data-act="theme"]').addEventListener('click', event => {
    event.stopPropagation();
    const state = getState();
    patchState({
      theme: state.theme === 'auto' ? 'light' : state.theme === 'light' ? 'dark' : 'auto',
    });
    render(root, window.MagicWandOrganizer ? [] : [], {});
  });

  root.querySelector('.mwo-v3-search').addEventListener('input', event => {
    patchState({ search: event.target.value });
    root.dispatchEvent(new CustomEvent('mwo-render'));
  });

  root.addEventListener('mwo-render', () => {
    const items = root.__mwoItems || [];
    render(root, items, root.__mwoHandlers || {});
  });

  return root;
}

export function render(root, items, handlers) {
  if (!root) return;
  root.__mwoItems = items;
  root.__mwoHandlers = handlers;

  const state = getState();
  const categories = ['全部', '⭐ 常用', '💬 聊天', '🖼 图片', '🔊 多媒体', '🧩 脚本', '🛠 管理', '⚙️ 其他'];
  const cats = root.querySelector('.mwo-v3-cats');
  cats.innerHTML = '';

  for (const category of categories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mwo-v3-cat' + (state.category === category ? ' on' : '');
    button.textContent = category;
    button.addEventListener('click', event => {
      event.stopPropagation();
      patchState({ category });
      render(root, items, handlers);
    });
    cats.appendChild(button);
  }

  const query = state.search.trim().toLowerCase();
  const visible = items.filter(item => {
    const cat = categoryFor(item);
    const categoryMatch =
      state.category === '全部' ||
      (state.category === '⭐ 常用' && state.favorites.includes(item.id)) ||
      cat === state.category;
    const queryMatch = !query || `${item.name} ${item.meta || ''}`.toLowerCase().includes(query);
    return categoryMatch && queryMatch;
  });

  const grid = root.querySelector('.mwo-v3-grid');
  grid.innerHTML = '';

  if (!visible.length) {
    grid.innerHTML = '<div class="mwo-v3-empty">暂时没有发现工具</div>';
  }

  for (const item of visible) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mwo-v3-card';

    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'mwo-v3-star';
    star.textContent = state.favorites.includes(item.id) ? '★' : '☆';

    const icon = document.createElement('div');
    icon.className = 'mwo-v3-icon';
    icon.textContent = item.icon && !item.icon.includes('fa-') ? item.icon : '✨';

    const name = document.createElement('div');
    name.className = 'mwo-v3-name';
    name.textContent = item.name;

    const meta = document.createElement('div');
    meta.className = 'mwo-v3-meta';
    meta.textContent = `${categoryFor(item)} · ${item.meta || item.source}`;

    card.append(icon, name, meta, star);

    star.addEventListener('click', event => {
      event.stopPropagation();
      toggleFavorite(item.id);
      render(root, items, handlers);
    });

    card.addEventListener('click', event => {
      event.stopPropagation();
      handlers.execute(item);
    });

    grid.appendChild(card);
  }

  root.querySelector('.mwo-v3-count').textContent = `${items.length} 个工具`;
  root.querySelector('.mwo-v3-search').value = state.search;
}
