export function can({profile, action}) {
  const matrix = {
    visitor: [], athlete: ['view_own_session','submit_precheck','submit_feedback','change_own_permission'],
    trainer: ['view_cockpit','decide_proposal','view_permitted_context','edit_workout'],
    manager: ['view_gym_operations','invite_demo_athlete','deactivate_demo_athlete'],
    super_admin: ['view_platform_demo','reset_demo']
  };
  return (matrix[profile] || []).includes(action);
}

export function canChangePermission({profile, actorId, athleteId}) {
  return profile === 'athlete' && actorId === athleteId;
}

export function gymUsers(state, gymId) {
  return state.users.filter(user => user.gymId === gymId);
}

export function permittedContext(state, {profile, gymId, athleteId}) {
  if (profile !== 'trainer' || !state.permissions[athleteId]?.[gymId]) return null;
  const athlete = state.users.find(user => user.id === athleteId && user.gymId === gymId);
  if (!athlete) return null;
  return {
    athlete:{id:athlete.id,name:athlete.name},
    restrictions:state.restrictions.filter(item=>item.athleteId===athleteId&&item.active).map(({zone,side,level,label})=>({zone,side,level,label})),
    precheck:state.prechecks[athleteId] || null,
    feedback:state.feedback[athleteId]?.at(-1) || null
  };
}
