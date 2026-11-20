import test from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,inBounds,groundBelow,topHeight,rampHeight,padAt,blockedByWall} from '../src/maps.mjs';
test('Phase 2 exact lamp layouts and spawn point counts',()=>{
  assert.deepEqual(MAPS[1].lanterns.map(l=>l.pos),[[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]]);
  assert.deepEqual([1,2,3].map(n=>MAPS[n].lanterns.length),[5,6,7]);
  assert.deepEqual([1,2,3].map(n=>MAPS[n].motePoints.length),[24,24,30]);
  assert.deepEqual([1,2,3].map(n=>MAPS[n].shadePoints.length),[12,16,16]);
  assert.ok(Math.abs(MAPS[1].shadePoints[0][0]-37*Math.cos(Math.PI/12))<1e-9);
});
test('round boundaries and narrow bridge include their edges and exclude open sea',()=>{
  assert.equal(inBounds(1,40,0),true);assert.equal(inBounds(1,40.001,0),false);
  assert.equal(inBounds(2,35,2),true);assert.equal(inBounds(2,35,2.001),false);
  assert.equal(inBounds(2,98,0),true);assert.equal(inBounds(2,45,18),false);
});
test('night 3 levels, half-annulus, ramps, and descending ground queries',()=>{
  assert.equal(topHeight(3,0,6),6);assert.equal(topHeight(3,0,18),3);assert.equal(topHeight(3,0,-18),0);
  assert.equal(groundBelow(3,0,18,2),0);assert.equal(groundBelow(3,0,18,4),3);assert.equal(topHeight(3,46,0),null);
  for(const deg of [30,150]){const a=deg*Math.PI/180;assert.ok(Math.abs(rampHeight(Math.cos(a)*27,Math.sin(a)*27)-1.5)<1e-9);}
  assert.equal(rampHeight(0,27),null);
});
test('pads have exact launch values and only trigger at their elevation',()=>{
  assert.equal(padAt(2,20,0,18).vy,14);assert.equal(padAt(2,20,2,18),null);
  assert.equal(padAt(3,0,3,13).speed,8);assert.deepEqual(padAt(3,0,3,13).direction,[0,-1]);
});
test('vertical ledges block walking up, allow stepping down; bell tower is solid at level 2',()=>{
  assert.equal(blockedByWall(3,{x:0,y:0,z:25},{x:0,y:0,z:24}),true);
  assert.equal(blockedByWall(3,{x:0,y:3,z:24},{x:0,y:3,z:25}),false);
  assert.equal(blockedByWall(3,{x:2.1,y:6,z:0},{x:1.9,y:6,z:0}),true);
});
