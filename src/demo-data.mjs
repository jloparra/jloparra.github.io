export const RULES_VERSION = 'demo-rules-2.0.0';

export const zones = {
  chest: 'Pecho', shoulder: 'Hombro', wrist: 'Muñeca / mano', lumbar: 'Zona lumbar',
  hip: 'Cadera / ingle', knee: 'Rodilla', ankle: 'Tobillo / pie'
};

const rows = [
  ['back-squat','Back squat','squat',['knee','hip','lumbar'],'high','goblet-squat'],
  ['goblet-squat','Goblet squat','squat',['knee','hip'],'medium','box-squat'],
  ['box-squat','Box squat','squat',['knee','hip'],'low',null],
  ['deadlift','Deadlift','hinge',['lumbar','hip'],'high','kb-deadlift'],
  ['kb-deadlift','Kettlebell deadlift','hinge',['lumbar','hip'],'medium','glute-bridge'],
  ['glute-bridge','Glute bridge','hinge',['hip'],'low',null],
  ['box-jump','Box jump','jump',['knee','ankle'],'high','box-step-up'],
  ['box-step-up','Box step-up','locomotion',['knee','ankle'],'low',null],
  ['burpee','Burpee','push',['shoulder','wrist','knee'],'high','elevated-burpee'],
  ['elevated-burpee','Burpee elevado','push',['shoulder','wrist'],'medium','bike'],
  ['push-up','Push-up','push',['shoulder','wrist'],'medium','incline-push-up'],
  ['incline-push-up','Push-up inclinado','push',['shoulder'],'low',null],
  ['strict-press','Strict press','overhead',['shoulder'],'high','landmine-press'],
  ['push-press','Push press','overhead',['shoulder','lumbar'],'high','landmine-press'],
  ['landmine-press','Landmine press','push',['shoulder'],'low',null],
  ['pull-up','Pull-up','pull',['shoulder'],'high','ring-row'],
  ['ring-row','Ring row','pull',['shoulder'],'medium','band-row'],
  ['band-row','Remo con banda','pull',['shoulder'],'low',null],
  ['toes-to-bar','Toes-to-bar','core',['shoulder','lumbar','hip'],'high','dead-bug'],
  ['dead-bug','Dead bug','core',['lumbar'],'low',null],
  ['run','Carrera','cyclical',['knee','ankle'],'high','bike'],
  ['row','Remo ergómetro','cyclical',['lumbar','knee'],'medium','bike'],
  ['bike','Bicicleta','cyclical',['knee'],'low',null],
  ['double-under','Double-under','jump',['ankle','knee'],'high','single-under'],
  ['single-under','Single-under','jump',['ankle'],'medium','bike'],
  ['farmer-carry','Farmer carry','carry',['wrist','shoulder'],'medium','sled-drag'],
  ['sled-drag','Arrastre de trineo','locomotion',['knee','hip'],'medium','bike']
];

export const catalog = rows.map(([id,name,pattern,zones,exposure,alternative]) => ({id,name,pattern,zones,exposure,alternative,active:true}));

export function createDemoState() {
  return {
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    profile: 'visitor', currentGym: 'gym-a', currentAthlete: 'lucia',
    gyms: [{id:'gym-a',name:'Avenidas Box',city:'Madrid'},{id:'gym-b',name:'North Performance',city:'Bilbao'}],
    users: [
      {id:'jose',name:'Jose',role:'super_admin'},
      {id:'ana',name:'Ana Martín',role:'manager',gymId:'gym-a',active:true},
      {id:'diego',name:'Diego Ramos',role:'trainer',gymId:'gym-a',active:true},
      {id:'lucia',name:'Lucía Vega',role:'athlete',gymId:'gym-a',active:true},
      {id:'marco',name:'Marco Gil',role:'athlete',gymId:'gym-a',active:true},
      {id:'sara',name:'Sara León',role:'athlete',gymId:'gym-a',active:true},
      {id:'nora',name:'Nora Pérez',role:'trainer',gymId:'gym-b',active:true},
      {id:'iker',name:'Iker Ruiz',role:'athlete',gymId:'gym-b',active:true}
    ],
    permissions: {lucia:{'gym-a':true},marco:{'gym-a':true},sara:{'gym-a':false},iker:{'gym-b':true}},
    restrictions: [
      {id:'r1',athleteId:'lucia',zone:'knee',side:'right',level:6,label:'Molestia declarada al aterrizar',active:true},
      {id:'r2',athleteId:'marco',zone:'shoulder',side:'left',level:4,label:'Molestia declarada en movimientos overhead',active:true}
    ],
    prechecks: {
      lucia:{recovery:3,discomfort:'knee',persists:true,escalation:null,submittedAt:new Date().toISOString()},
      marco:{recovery:4,discomfort:'shoulder',persists:true,escalation:null,submittedAt:new Date().toISOString()}
    },
    workout: {id:'workout-1',gymId:'gym-a',name:'Clase de hoy · Pierna y motor',status:'published',date:new Date().toISOString().slice(0,10),participants:['lucia','marco','sara'],items:[
      {id:'item-1',exerciseId:'back-squat',dose:'5 × 5 · carga moderada'},
      {id:'item-2',exerciseId:'box-jump',dose:'4 × 8'},
      {id:'item-3',exerciseId:'strict-press',dose:'4 × 6'},
      {id:'item-4',exerciseId:'row',dose:'10 min'}
    ]},
    proposals: {}, decisions: {}, feedback: {}, events: []
  };
}
