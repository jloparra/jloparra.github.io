import { catalog, RULES_VERSION, zones } from './demo-data.mjs';

const escalationLabels = {
  chest_pain: 'Dolor torácico declarado', syncope: 'Síncope o pérdida de conocimiento declarada',
  breathlessness: 'Falta de aire desproporcionada declarada', acute_pain: 'Dolor agudo incapacitante declarado',
  unexplained_change: 'Cambio relevante no explicable'
};

const byId = id => catalog.find(item => item.id === id);

export function generateProposal({ workout, athleteId, permission, restrictions = [], precheck, latestFeedback }) {
  const generatedAt = new Date().toISOString();
  const base = {id:`proposal-${workout.id}-${athleteId}-${RULES_VERSION}`,workoutId:workout.id,athleteId,rulesVersion:RULES_VERSION,generatedAt,status:'proposal_pending',sources:['workout'],missing:[],changes:[],reasons:[],snapshot:{workoutId:workout.id,athleteId}};
  if (!permission) return {...base,signal:'gray',confidence:'baja',missing:['permiso de acceso'],reasons:['El gimnasio no tiene permiso para utilizar el contexto del atleta.']};
  base.sources.push('permission');
  if (!precheck) {
    base.missing.push('pre-check-in de hoy');
    return {...base,signal:'gray',confidence:'baja',reasons:['Faltan datos para valorar esta sesión.']};
  }
  base.sources.push('precheck');
  if (precheck.escalation) return {...base,signal:'red',confidence:'detenida',escalation:true,changes:[],reasons:[escalationLabels[precheck.escalation] || 'Señal que requiere revisión antes de entrenar.']};
  const active = restrictions.filter(r => r.athleteId === athleteId && r.active);
  if (active.length) base.sources.push('active_restrictions');
  for (const item of workout.items) {
    const exercise = byId(item.exerciseId);
    const conflict = active.find(r => exercise?.zones.includes(r.zone) && ['medium','high'].includes(exercise.exposure));
    if (!conflict) continue;
    const alternative = exercise.alternative ? byId(exercise.alternative) : null;
    base.changes.push({itemId:item.id,action:alternative?'substitute':'review',originalExerciseId:exercise.id,replacementExerciseId:alternative?.id || null,originalDose:item.dose,finalDose:item.dose,reason:`${zones[conflict.zone]} · exposición ${exercise.exposure}`,rule:'zone-exposure-v2'});
  }
  if (precheck.recovery <= 2) {
    base.changes.push({itemId:'global',action:'reduce_volume',originalExerciseId:null,replacementExerciseId:null,originalDose:'Volumen programado',finalDose:'Reducir el volumen un 15%',reason:'Recuperación baja declarada hoy',rule:'recovery-v2'});
  }
  if (latestFeedback?.fatigue >= 8) {
    base.reasons.push('El último feedback registró fatiga alta; conviene confirmarla antes de empezar.');
    base.sources.push('latest_feedback');
  }
  if (!base.changes.length && !base.reasons.length) base.reasons.push('No hay novedades con la información disponible.');
  return {...base,signal:base.changes.length||base.reasons.length>1?'amber':'green',confidence:'media',escalation:false};
}

export function createDecision({proposal,action,actorId,reason,modifications=[]}) {
  const allowed = ['coach_accepted','coach_modified','coach_discarded','coach_escalated'];
  if (!allowed.includes(action)) throw new Error('Invalid decision action');
  if (action === 'coach_modified' && !modifications.length) throw new Error('A modified decision requires modifications');
  return {id:`decision-${proposal.id}-${Date.now()}`,proposalId:proposal.id,proposalSnapshot:structuredClone(proposal),action,actorId,reason:reason || 'Decisión registrada por el entrenador',modifications:structuredClone(modifications),rulesVersion:proposal.rulesVersion,workoutId:proposal.workoutId,athleteId:proposal.athleteId,decidedAt:new Date().toISOString()};
}

export function finalSession({workout,proposal,decision}) {
  if (!decision) return {status:'proposal_pending',message:'Tu entrenador está revisando la sesión.',items:[]};
  if (decision.action === 'coach_escalated') return {status:'coach_escalated',message:'Revisión necesaria antes de entrenar. Habla con tu entrenador.',items:[]};
  const changes = decision.action === 'coach_modified' ? decision.modifications : decision.action === 'coach_accepted' ? proposal.changes : [];
  return {status:decision.action,message:decision.action==='coach_discarded'?'Tu entrenador ha mantenido el entrenamiento.':decision.action==='coach_modified'?'Tu entrenador ha ajustado esta parte.':'Tu entrenador ha revisado la sesión.',items:workout.items.map(item=>{
    const change=changes.find(c=>c.itemId===item.id); const original=byId(item.exerciseId);
    return {itemId:item.id,original:original?.name,exercise:change?.replacementExerciseId?byId(change.replacementExerciseId)?.name:original?.name,dose:change?.finalDose||item.dose,changed:Boolean(change),reason:change?.reason||'Sin cambios'};
  })};
}
