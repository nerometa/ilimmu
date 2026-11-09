<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte';
  import GameImage from './GameImage.svelte';
  let { kind, item, size=64, label, onclick, compact=false, showInfo=false, children }: {
    kind:'weapons'|'artifacts'; item?:{id:number;name:string;rarity:number;weaponType?:string;stat?:string;effect?:string;effect2?:string;effect4?:string;maxAtk?:string|number;maxStat?:string;wiki?:string};
    size?:number; label?:string; onclick?:()=>void; compact?:boolean; showInfo?:boolean; children?:Snippet;
  }=$props();
  let tooltip:HTMLDivElement,button:HTMLButtonElement;
  let interactive=$state(false);
  let timer:ReturnType<typeof setTimeout>|undefined;
  const uid=$props.id();
  onDestroy(()=>{if(timer)clearTimeout(timer);});
  function hide(){if(timer)clearTimeout(timer);tooltip?.hidePopover();}
  function show(event?:PointerEvent,fromInfo=false){if(!item||event?.pointerType==='touch')return;interactive=fromInfo;if(timer)clearTimeout(timer);tooltip.showPopover();const rect=button.getBoundingClientRect();const width=Math.min(380,window.innerWidth-24);tooltip.style.width=`${width}px`;const height=tooltip.getBoundingClientRect().height;const left=rect.right+12+width<window.innerWidth?rect.right+12:Math.max(12,rect.left-width-12);tooltip.style.left=`${left}px`;tooltip.style.top=`${Math.max(12,Math.min(rect.top,window.innerHeight-height-12))}px`;}
  function enter(event:PointerEvent){if(event.pointerType==='touch')return;if(timer)clearTimeout(timer);timer=setTimeout(()=>show(event),180);}
  function delayedHide(){if(timer)clearTimeout(timer);timer=setTimeout(hide,100);}
</script>
<span class="tile-wrap">
<button bind:this={button} type="button" class="equipment-tile" class:compact style:--tile-size={`${size}px`} aria-label={label??item?.name??`Choose ${kind==='weapons'?'weapon':'artifacts'}`} aria-describedby={item?uid:undefined} onclick={()=>{hide();onclick?.();}} onpointerenter={enter} onpointerleave={delayedHide} onfocus={()=>{if(button.matches(':focus-visible'))show();}} onblur={delayedHide} onkeydown={event=>{if(event.key==='Escape')hide();}}>
  {#if children}{@render children()}{:else if item}<GameImage {kind} id={item.id} {size} rarity={item.rarity} />{:else}<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span class="empty-label">{kind==='weapons'?'Weapon':'Artifacts'}</span>{/if}
</button>
{#if showInfo&&item}<button type="button" class="tile-info" aria-label={`Details for ${item.name}`} onclick={()=>{if(tooltip.matches(':popover-open'))hide();else show(undefined,true);}} onkeydown={event=>{if(event.key==='Escape')hide();}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></svg></button>{/if}
</span>
<div bind:this={tooltip} id={uid} popover="auto" role="tooltip" class="equipment-tooltip" class:interactive onpointerenter={()=>{if(timer)clearTimeout(timer);}} onpointerleave={hide}>
  {#if item}
    <header data-rarity={item.rarity}><strong>{item.name}</strong><span class="rarity">{#each Array.from({length:item.rarity}) as _,i (i)}<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3 6.4 7 1-5 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-5 7-1Z"/></svg>{/each}<span class="sr-only">{item.rarity}-star</span></span>
    {#if item.weaponType}<div class="weapon-facts"><span>{item.weaponType}</span>{#if item.maxAtk}<span>Max ATK: {item.maxAtk}</span>{/if}{#if item.stat}<span>{item.maxStat??item.stat}</span>{/if}</div>{/if}
    </header>
    <div class="tooltip-body">{#if item.effect2}<p><b>2 pieces</b> {item.effect2}</p>{/if}{#if item.effect4}<p><b>4 pieces</b> {item.effect4}</p>{/if}{#if item.effect}<p>{item.effect}</p>{/if}</div>
  {/if}
</div>
<style>
  .tile-wrap{display:inline-flex;position:relative;}.tile-info{display:none;position:absolute;right:-5px;bottom:-5px;min-width:28px;min-height:28px;border-radius:50%;border:1px solid var(--border);background:var(--canvas);color:var(--ink);align-items:center;justify-content:center;cursor:pointer;z-index:1;}@media(hover:none){.tile-info{display:inline-flex;}}
  .equipment-tile{width:var(--tile-size);height:var(--tile-size);border:0;border-radius:10px;padding:0;display:inline-flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;background:var(--canvas);color:var(--muted);cursor:pointer;flex:none;position:relative;}.equipment-tile:hover{outline:2px solid var(--primary);outline-offset:2px;}.empty-label{font-size:10px;}.equipment-tile.compact{border-radius:8px;}
  .equipment-tooltip{position:fixed;inset:auto;margin:0;border:1px solid var(--border);border-radius:12px;padding:0;background:#0d1424;color:var(--ink);width:min(380px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;box-shadow:0 12px 32px #0005;pointer-events:none;z-index:100;}
  .equipment-tooltip.interactive{pointer-events:auto;}
  header{padding:16px;background:var(--rarity-5);display:flex;align-items:flex-start;flex-wrap:wrap;gap:8px;}header[data-rarity='4']{background:var(--rarity-4);}header[data-rarity='3']{background:var(--rarity-3);}header strong{font-size:18px;line-height:1.3;color:#fff;}.rarity{display:inline-flex;gap:1px;color:#ffe06a;min-height:22px;align-items:center;}.weapon-facts{display:flex;flex-wrap:wrap;gap:6px;flex-basis:100%;}.weapon-facts span{padding:4px 7px;border-radius:4px;font-size:11px;background:#17120d66;color:#fff;}.tooltip-body{background:var(--canvas);color:var(--ink);padding:16px;font-size:13px;line-height:1.65;}.tooltip-body p{margin-bottom:12px;}.tooltip-body p:last-child{margin:0;}.tooltip-body b{display:block;color:var(--primary);font-size:11px;margin-bottom:3px;}
</style>
