import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,loadSettings,saveSettings} from '../web/settings.mjs';
test('settings persist on reopening, clamp ranges, and tolerate corrupt/blocked storage',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  assert.deepEqual(loadSettings(storage),DEFAULT_SETTINGS);saveSettings({volume:.2,sensitivity:2,colorblind:false},storage);assert.deepEqual(loadSettings(storage),{...DEFAULT_SETTINGS,volume:.2,sensitivity:2,colorblind:false});
  assert.deepEqual(saveSettings({volume:5,sensitivity:-3},storage),{...DEFAULT_SETTINGS,volume:1,sensitivity:.25,colorblind:false});
  assert.deepEqual(loadSettings({getItem(){throw Error('blocked');}}),DEFAULT_SETTINGS);
});
test('accessible palette persists, defaults off for old saves, and malformed values do not enable it',()=>{
  let text='{"volume":0.3,"sensitivity":1.2}';const storage={getItem:()=>text,setItem:(_,v)=>text=v};assert.equal(loadSettings(storage).colorblind,false);saveSettings({volume:.3,sensitivity:1.2,colorblind:true},storage);assert.equal(loadSettings(storage).colorblind,true);saveSettings({colorblind:'true'},storage);assert.equal(loadSettings(storage).colorblind,false);
});
