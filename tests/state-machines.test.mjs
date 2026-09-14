import test from 'node:test'; import assert from 'node:assert/strict'; import {createDemoState} from '../src/demo-data.mjs';
test('demo has three athletes in gym a and no real domains',()=>{const s=createDemoState();assert.equal(s.users.filter(u=>u.gymId==='gym-a'&&u.role==='athlete'&&u.active).length,3);assert.ok(s.users.every(u=>!('email' in u)))});
test('workout is published before an athlete session can be produced',()=>assert.equal(createDemoState().workout.status,'published'));
