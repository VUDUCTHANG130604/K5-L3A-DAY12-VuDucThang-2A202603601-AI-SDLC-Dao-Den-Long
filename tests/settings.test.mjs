import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,loadSettings,saveSettings} from '../web/settings.mjs';
test('settings persist on reopening, clamp ranges, and tolerate corrupt/blocked storage',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  assert.deepEqual(loadSettings(storage),DEFAULT_SETTINGS);saveSettings({volume:.2,sensitivity:2},storage);assert.deepEqual(loadSettings(storage),{volume:.2,sensitivity:2});
  assert.deepEqual(saveSettings({volume:5,sensitivity:-3},storage),{volume:1,sensitivity:.25});
  assert.deepEqual(loadSettings({getItem(){throw Error('blocked');}}),DEFAULT_SETTINGS);
});
