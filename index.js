import { discoverItems, inspect } from './api.js';
import { getState, patchState } from './state.js';
import { createUI, render } from './ui.js';
import { bindKeyboard } from './events.js';

let initialized=false, root=null, items=[], openState=false, observer=null, refreshTimer=null;
const nativeButton=()=>document.getElementById('extensionsMenuButton');
const nativeMenu=()=>document.getElementById('extensionsMenu');

function refresh(){
  const next=discoverItems();
  const changed=next.length!==items.length || next.some((x,i)=>x.id!==items[i]?.id || x.name!==items[i]?.name);
  items=next;
  if(root && (openState||changed)) render(root,items,api);
}
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,120)}
function hideNativeMenu(){const m=nativeMenu();if(m){m.dataset.mwoHidden='1';m.style.setProperty('display','none','important')}}
function restoreNativeMenu(){const m=nativeMenu();if(m?.dataset.mwoHidden==='1'){m.style.removeProperty('display');delete m.dataset.mwoHidden}}
function open(){
  if(!root) root=createUI(api);
  refresh(); openState=true; root.style.display='flex'; hideNativeMenu();
  setTimeout(()=>root.querySelector('.mwo-search')?.focus(),20);
}
function close(){openState=false;if(root)root.style.display='none';restoreNativeMenu()}
function theme(){const t=getState().theme;patchState({theme:t==='auto'?'light':t==='light'?'dark':'auto'});render(root,items,api)}
async function execute(item){close();try{await item.execute()}catch(e){console.error('[MagicWandOrganizer] execute failed',item,e);}}
const api={open,close,theme,render:()=>render(root,items,api),execute,isOpen:()=>openState};

function hookNativeButton(){
  const b=nativeButton(); if(!b) return false;
  if(b.dataset.mwoBound==='1') return true;
  b.dataset.mwoBound='1';
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()},{capture:true});
  return true;
}
function observe(){
  if(observer) return;
  observer=new MutationObserver(muts=>{hookNativeButton();for(const m of muts){if(m.type==='childList' && (m.addedNodes.length||m.removedNodes.length)){scheduleRefresh();break}}});
  observer.observe(document.body,{subtree:true,childList:true});
}
export function init(){
  if(initialized)return;initialized=true;
  observe(); hookNativeButton(); refresh(); bindKeyboard(api);
  window.MagicWandOrganizer={open,close,refresh,inspect:()=>({...inspect(),discovered:items.map(x=>({id:x.id,name:x.name,source:x.source,category:x.categoryHint||''}))})};
  console.info('[MagicWandOrganizer] ready',window.MagicWandOrganizer.inspect());
}
if(window.jQuery) window.jQuery(()=>init()); else setTimeout(init,0);