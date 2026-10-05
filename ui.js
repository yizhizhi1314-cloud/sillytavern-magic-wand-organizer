import { getState, patchState, toggleFavorite } from './state.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const CATEGORY_RULES = [
  ['💬 聊天', /聊天|翻译|输入|回复|消息|chat|translate/i],
  ['🖼 图片', /图片|图像|绘|画|头像|图库|image|stable diffusion/i],
  ['🔊 多媒体', /tts|朗读|语音|音频|视频|media|speech/i],
  ['🧩 脚本', /脚本|script|code|tavern helper/i],
  ['🛠 管理', /管理|变量|日志|数据|备份|正则|token|提示词|楼层|preset/i],
];

export function categoryFor(item) {
  const haystack = `${item.name} ${item.categoryHint || ''} ${item.meta || ''}`;
  return CATEGORY_RULES.find(([, rule]) => rule.test(haystack))?.[0] || '⚙️ 其他';
}

export function ensureStyle() {
  if (document.getElementById('mwo-v2-style')) return;

  const style = document.createElement('style');
  style.id = 'mwo-v2-style';
  style.textContent = `
#mwo-v2 {
  --bg:#f8f8fb; --panel:#fff; --card:#f1f2f6; --text:#20222a;
  --muted:#777b87; --border:#dfe1e8; --accent:#7657f5; --accent2:#eee9ff;
  position:fixed; inset:0; z-index:2147483640; display:none; align-items:center;
  justify-content:center; padding:12px; background:rgba(0,0,0,.48);
  backdrop-filter:blur(8px);
}
#mwo-v2.dark {
  --bg:#17181e; --panel:#1d1f26; --card:#262932; --text:#f3f4f7;
  --muted:#a6a9b3; --border:#393c47; --accent:#9b82ff; --accent2:#30294d;
}
#mwo-v2.system { color-scheme:light; }
@media (prefers-color-scheme:dark) {
  #mwo-v2.system {
    --bg:#17181e; --panel:#1d1f26; --card:#262932; --text:#f3f4f7;
    --muted:#a6a9b3; --border:#393c47; --accent:#9b82ff; --accent2:#30294d;
  }
}
#mwo-v2 .mwo-panel {
  width:min(760px,96vw); height:min(82vh,820px); background:var(--bg);
  color:var(--text); border:1px solid var(--border); border-radius:24px;
  box-shadow:0 28px 90px rgba(0,0,0,.45); display:flex; flex-direction:column;
  overflow:hidden; font-family:system-ui,-apple-system,'Microsoft YaHei',sans-serif;
}
#mwo-v2 .mwo-head { display:flex; align-items:center; gap:10px; padding:16px 17px 10px; }
#mwo-v2 .mwo-title { font-size:20px; font-weight:800; flex:1; }
#mwo-v2 .mwo-sub { font-size:11px; color:var(--muted); font-weight:500; margin-top:3px; }
#mwo-v2 .mwo-btn {
  width:40px; height:40px; border:1px solid var(--border); border-radius:12px;
  background:var(--card); color:var(--text); cursor:pointer; font-size:18px;
}
#mwo-v2 .mwo-search {
  height:44px; margin:0 16px 10px; border:1px solid var(--border);
  border-radius:14px; background:var(--panel); color:var(--text);
  padding:0 14px; font-size:15px; outline:none;
}
#mwo-v2 .mwo-cats {
  display:flex; gap:7px; overflow:auto; padding:0 16px 11px; scrollbar-width:none;
}
#mwo-v2 .mwo-cat {
  white-space:nowrap; padding:8px 12px; border:1px solid var(--border);
  border-radius:999px; background:transparent; color:var(--text); cursor:pointer;
}
#mwo-v2 .mwo-cat.on { background:var(--accent); border-color:var(--accent); color:#fff; }
#mwo-v2 .mwo-grid {
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px;
  overflow:auto; padding:2px 16px 16px;
}
#mwo-v2 .mwo-card {
  position:relative; min-height:78px; padding:12px 38px 11px 12px;
  border:1px solid var(--border); border-radius:17px; background:var(--card);
  color:var(--text); text-align:left; cursor:pointer; transition:.15s;
}
#mwo-v2 .mwo-card:hover { border-color:var(--accent); transform:translateY(-1px); }
#mwo-v2 .mwo-icon {
  width:38px; height:38px; border-radius:12px; background:var(--accent2);
  display:flex; align-items:center; justify-content:center; font-size:19px; margin-bottom:7px;
}
#mwo-v2 .mwo-icon i { font-size:19px; }
#mwo-v2 .mwo-name { font-weight:700; font-size:14px; line-height:1.25; }
#mwo-v2 .mwo-meta { font-size:10px; color:var(--muted); margin-top:4px; }
#mwo-v2 .mwo-star {
  position:absolute; right:8px; top:7px; border:0; background:transparent;
  color:#d59a00; font-size:19px; cursor:pointer;
}
#mwo-v2 .mwo-empty { grid-column:1/-1; text-align:center; padding:55px 20px; color:var(--muted); }
#mwo-v2 .mwo-foot {
  margin-top:auto; border-top:1px solid var(--border); padding:8px 13px;
  display:flex; color:var(--muted); font-size:11px;
}
#mwo-v2 .mwo-count { flex:1; }
@media(max-width:520px) {
  #mwo-v2 { align-items:flex-end; padding:0; }
  #mwo-v2 .mwo-panel { width:100%; height:89vh; border-radius:23px 23px 0 0; }
  #mwo-v2 .mwo-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; padding-left:12px; padding-right:12px; }
  #mwo-v2 .mwo-card { min-height:74px; }
}
@media(max-width:340px) { #mwo-v2 .mwo-grid { grid-template-columns:1fr; } }
`;

  document.head.appendChild(style);
}

export function createUI(handlers) {
  ensureStyle();

  let root = document.getElementById('mwo-v2');
  if (root) return root;

  root = document.createElement('div');
  root.id = 'mwo-v2';
  root.innerHTML = `
    <div class="mwo-panel">
      <div class="mwo-head">
        <div class="mwo-title">
          🪄 魔棒工具库
          <div class="mwo-sub">自动发现 · 原功能直连 · 收藏 · 搜索 · 分类</div>
        </div>
        <button class="mwo-btn" data-act="theme">🌓</button>
        <button class="mwo-btn" data-act="close">×</button>
      </div>
      <input class="mwo-search" placeholder="🔍 搜索工具…">
      <div class="mwo-cats"></div>
      <div class="mwo-grid"></div>
      <div class="mwo-foot">
        <span class="mwo-count"></span>
        <span>⭐ 收藏 · Esc 关闭</span>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  root.querySelector('[data-act="close"]').onclick = handlers.close;
  root.querySelector('[data-act="theme"]').onclick = handlers.theme;

  root.addEventListener('click', event => {
    if (event.target === root) handlers.close();
  });

  root.querySelector('.mwo-search').addEventListener('input', event => {
    patchState({ search: event.target.value });
    handlers.render();
  });

  return root;
}

export function render(root, items, handlers) {
  const state = getState();
  const categories = ['全部', '⭐ 常用', '💬 聊天', '🖼 图片', '🔊 多媒体', '🧩 脚本', '🛠 管理', '⚙️ 其他'];

  const cats = root.querySelector('.mwo-cats');
  cats.innerHTML = '';

  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = `mwo-cat${state.category === category ? ' on' : ''}`;
    button.textContent = category;
    button.onclick = () => {
      patchState({ category });
      handlers.render();
    };
    cats.appendChild(button);
  });

  const query = state.search.toLowerCase().trim();

  const visible = items.filter(item => {
    const category = categoryFor(item);
    const categoryMatch =
      state.category === '全部' ||
      (state.category === '⭐ 常用' && state.favorites.includes(item.id)) ||
      category === state.category;

    const queryMatch = !query ||
      `${item.name} ${item.meta || ''}`.toLowerCase().includes(query);

    return categoryMatch && queryMatch;
  });

  const grid = root.querySelector('.mwo-grid');
  grid.innerHTML = '';

  if (!visible.length) {
    grid.innerHTML = '<div class="mwo-empty">没有找到工具<br><small>工具出现后会自动加入这里</small></div>';
  }

  visible.forEach(item => {
    const card = document.createElement('div');
    card.className = 'mwo-card';
    card.innerHTML = `
      <div class="mwo-icon"></div>
      <div class="mwo-name"></div>
      <div class="mwo-meta"></div>
      <button class="mwo-star" type="button"></button>
    `;

    const icon = card.querySelector('.mwo-icon');
    if (/^fa-/.test(item.icon)) {
      icon.innerHTML = `<i class="${escapeHtml(item.icon)}"></i>`;
    } else {
      icon.textContent = item.icon || '✨';
    }

    card.querySelector('.mwo-name').textContent = item.name;
    card.querySelector('.mwo-meta').textContent =
      `${categoryFor(item)} · ${item.meta || item.source}`;

    const star = card.querySelector('.mwo-star');
    star.textContent = state.favorites.includes(item.id) ? '★' : '☆';
    star.onclick = event => {
      event.stopPropagation();
      toggleFavorite(item.id);
      handlers.render();
    };

    card.onclick = () => handlers.execute(item);
    grid.appendChild(card);
  });

  root.querySelector('.mwo-count').textContent =
    `共 ${items.length} 个工具 · 已显示 ${visible.length} 个`;

  root.className =
    state.theme === 'dark' ? 'dark' :
    state.theme === 'auto' ? 'system' : '';

  root.querySelector('.mwo-search').value = state.search;
}
