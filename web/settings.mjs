export const DEFAULT_SETTINGS=Object.freeze({volume:.45,sensitivity:1});
const KEY='dao-den-long.settings.v1';
export function normalizeSettings(value){return{
  volume:Number.isFinite(value?.volume)?Math.max(0,Math.min(1,value.volume)):DEFAULT_SETTINGS.volume,
  sensitivity:Number.isFinite(value?.sensitivity)?Math.max(.25,Math.min(3,value.sensitivity)):DEFAULT_SETTINGS.sensitivity
};}
export function loadSettings(storage=globalThis.localStorage){try{return normalizeSettings(JSON.parse(storage.getItem(KEY)));}catch{return{...DEFAULT_SETTINGS};}}
export function saveSettings(value,storage=globalThis.localStorage){const result=normalizeSettings(value);try{storage.setItem(KEY,JSON.stringify(result));}catch{/* Play remains available if storage is disabled. */}return result;}
