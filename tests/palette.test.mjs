import test from 'node:test';import assert from 'node:assert/strict';
import {HEX,C,ACCESSIBLE,ACCESSIBLE_RIM} from '../web/palette.mjs';
test('standard material and UI palette uses exact ticket RGB values',()=>{
  assert.deepEqual(HEX,{sky:'#0E1430',fog:'#1B2350',grass:'#2F5D50',sand:'#C9B48A',wood:'#6B4A2F',sea:'#12384A',lamp:'#FFB347',core:'#FFE9B0',unlit:'#5B5F6E',mote:'#FFF6C2',halo:'#FFE58A',shade:'#120A1A',rim:'#7A3CFF',stunned:'#3A3450',coat:'#E8E2D0',red:'#C8102E',gold:'#F2C14E',drifter:'#8FA3B8',danger:'#FF5A5F',text:'#F5F1E6'});
  assert.deepEqual(C.coat.map(v=>Math.round(v*255)),[232,226,208]);
});
test('accessible shade rim/eyes and warning use exact v1.2 replacements',()=>{assert.deepEqual(ACCESSIBLE,{rim:'#00B3FF',danger:'#FFFFFF'});assert.deepEqual(ACCESSIBLE_RIM.map(v=>Math.round(v*255)),[0,179,255]);});
