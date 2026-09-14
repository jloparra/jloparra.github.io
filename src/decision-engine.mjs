import { catalog, RULES_VERSION, zones } from './demo-data.mjs';

const escalationLabels = {
  chest_pain: 'Dolor torácico declarado',
  syncope: 'Síncope o pérdida de conocimiento declarada',
  breathlessness: 'Falta de aire desproporcionada declarada',
  acute_pain: 'Dolor agudo incapacitante declarada',
  unexplained_change: 'Cambio relevante no explicable'
};

const byId = id => catalog.find(item => item.id === id);

export function generateProposal({ workout, athleteId, permission, restrictions = [], precheck, latestFeedback, capacityProfile }) {
  const generatedAt = new Date().toISOString();
  const base = {
    id: `proposal-${workout.id}-${athleteId}-${RULES_VERSION}`,
    workoutId: workout.id,
    athleteId,
    rulesVersion: RULES_VERSION,
    generatedAt,
    status: 'proposal_pending',
    sources: ['workout'],
    missing: [],
    changes: [],
    reasons: [],
    snapshot: {
      workoutId: workout.id,
      athleteId,
      capacityProfileLevel: capacityProfile?.level || null
    }
  };

  // No permission: gray, do not use athlete context
  if (!permission) {
    base.missing.push('permiso de acceso');
    return {
      ...base,
      signal: 'gray',
      confidence: 'baja',
      reasons: ['El gimnasio no tiene permiso para utilizar el contexto del atleta.']
    };
  }

  base.sources.push('permission');

  // No precheck: gray, missing daily state
  if (!precheck) {
    base.missing.push('pre-check-in de hoy');
    return {
      ...base,
      signal: 'gray',
      confidence: 'baja',
      reasons: ['Faltan datos para valorar esta sesión.']
    };
  }

  base.sources.push('precheck');

  // Escalation flags: red, stop automation
  if (precheck.escalation) {
    return {
      ...base,
      signal: 'red',
      confidence: 'detenida',
      escalation: true,
      changes: [],
      reasons: [
        escalationLabels[precheck.escalation] ||
          'Señal que requiere revisión antes de entrenar. No se aplica una adaptación automática.'
      ]
    };
  }

  // Active restrictions
  const active = restrictions.filter(r => r.athleteId === athleteId && r.active);
  if (active.length) base.sources.push('active_restrictions');

  // Capacity profile: never increase exposure; mark unknowns
  if (!capacityProfile) {
    base.missing.push('perfil de capacidad');
  } else {
    base.sources.push('capacity_profile');
    if (capacityProfile.missing?.length) {
      base.missing.push(...capacityProfile.missing);
    }
  }

  // Per-exercise conflict
  for (const item of workout.items) {
    const exercise = byId(item.exerciseId);
    if (!exercise) continue;

    const conflict = active.find(
      r => exercise.zones.includes(r.zone) && ['medium', 'high'].includes(exercise.exposure)
    );

    if (!conflict) continue;

    const alternative = exercise.alternative ? byId(exercise.alternative) : null;

    base.changes.push({
      itemId: item.id,
      action: alternative ? 'substitute' : 'review',
      originalExerciseId: exercise.id,
      replacementExerciseId: alternative?.id || null,
      originalDose: item.dose,
      finalDose: item.dose,
      reason: `${zones[conflict.zone]} · exposición ${exercise.exposure}`,
      rule: 'zone-exposure-v3'
    });
  }

  // Recovery-based global volume reduction (never > 1.00)
  if (precheck.recovery <= 2) {
    base.changes.push({
      itemId: 'global',
      action: 'reduce_volume',
      originalExerciseId: null,
      replacementExerciseId: null,
      originalDose: 'Volumen programado',
      finalDose: 'Reducir el volumen un 15%',
      reason: 'Recuperación baja declarada hoy',
      rule: 'recovery-v3'
    });
  }

  // Latest feedback context
  if (latestFeedback?.fatigue >= 8) {
    base.reasons.push(
      'El último feedback registró fatiga alta; conviene confirmarla antes de empezar.'
    );
    base.sources.push('latest_feedback');
  }

  if (!base.changes.length && !base.reasons.length) {
    base.reasons.push('No hay novedades con la información disponible.');
  }

  const hasSignals = base.changes.length || base.reasons.length > 1;

  return {
    ...base,
    signal: hasSignals ? 'amber' : 'green',
    confidence: capacityProfile ? 'media' : 'baja',
    escalation: false
  };
}

export function createDecision({ proposal, action, actorId, reason, modifications = [] }) {
  const allowed = [
    'coach_accepted',
    'coach_modified',
    'coach_discarded',
    'coach_escalated'
  ];

  if (!allowed.includes(action)) throw new Error('Invalid decision action');
  if (action === 'coach_modified' && !modifications.length) {
    throw new Error('A modified decision requires modifications');
  }

  return {
    id: `decision-${proposal.id}-${Date.now()}`,
    proposalId: proposal.id,
    proposalSnapshot: structuredClone(proposal),
    action,
    actorId,
    reason: reason || 'Decisión registrada por el entrenador',
    modifications: structuredClone(modifications),
    rulesVersion: proposal.rulesVersion,
    workoutId: proposal.workoutId,
    athleteId: proposal.athleteId,
    decidedAt: new Date().toISOString()
  };
}

export function finalSession({ workout, proposal, decision }) {
  if (!decision) {
    return {
      status: 'proposal_pending',
      message: 'Tu entrenador está revisando la sesión.',
      items: []
    };
  }

  if (decision.action === 'coach_escalated') {
    return {
      status: 'coach_escalated',
      message:
        'Revisión necesaria antes de entrenar. Habla con tu entrenador. No se ha creado una sesión automática.',
      items: []
    };
  }

  const changes =
    decision.action === 'coach_modified'
      ? decision.modifications
      : decision.action === 'coach_accepted'
      ? proposal.changes
      : [];

  return {
    status: decision.action,
    message:
      decision.action === 'coach_discarded'
        ? 'Tu entrenador ha mantenido el entrenamiento.'
        : decision.action === 'coach_modified'
        ? 'Tu entrenador ha ajustado esta parte.'
        : 'Tu entrenador ha revisado la sesión.',
    items: workout.items.map(item => {
      const change = changes.find(c => c.itemId === item.id);
      const original = byId(item.exerciseId);

      return {
        itemId: item.id,
        original: original?.name,
        exercise: change?.replacementExerciseId
          ? byId(change.replacementExerciseId)?.name
          : original?.name,
        dose: change?.finalDose || item.dose,
        changed: Boolean(change),
        reason: change?.reason || 'Sin cambios'
      };
    })
  };
}
