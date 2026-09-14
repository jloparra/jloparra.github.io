import { createDemoState } from './demo-data.mjs';
const KEY='trackiu-decision-demo-v2'; const MAX_AGE=1000*60*60*24*30;
export function loadState(){try{const parsed=JSON.parse(localStorage.getItem(KEY));if(parsed?.schemaVersion===2&&Date.now()-new Date(parsed.createdAt).getTime()<MAX_AGE)return parsed;}catch{}return createDemoState();}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state));}
export function resetState(){localStorage.removeItem(KEY);return createDemoState();}
export function event(state,type,meta={}){state.events.push({type,timestamp:new Date().toISOString(),profile:state.profile,gymId:state.currentGym,origin:location.hash||'#home',rulesVersion:'demo-rules-2.0.0',...meta});if(state.events.length>200)state.events=state.events.slice(-200);saveState(state);}
