import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoState } from '../src/demo-data.mjs';
import { generateProposal, createDecision, finalSession } from '../src/decision-engine.mjs';

const state = createDemoState();

const baseArgs = {
  workout: state.workout,
  athleteId: 'lucia',
  permission: true,
  restrictions: state.restrictions,
  precheck: state.prechecks.lucia,
  latestFeedback: null,
  capacityProfile: state.onboarding.lucia.capacity.profile
};

test('same input produces equivalent business output', () => {
  const a = generateProposal(baseArgs);
  const b = generateProposal(baseArgs);
  delete a.generatedAt;
  delete b.generatedAt;
  assert.deepEqual(a, b);
});

test('missing permission is gray', () => {
  assert.equal(generateProposal({ ...baseArgs, permission: false }).signal, 'gray');
});

test('missing precheck is gray', () => {
  assert.equal(generateProposal({ ...baseArgs, precheck: null }).signal, 'gray');
});

test('conflict is amber with directed alternative', () => {
  const p = generateProposal(baseArgs);
  assert.equal(p.signal, 'amber');
  assert.ok(
    p.changes.some(c => c.replacementExerciseId === 'box-step-up')
  );
});

test('escalation is red and stops alternatives', () => {
  const p = generateProposal({
    ...baseArgs,
    precheck: { ...baseArgs.precheck, escalation: 'chest_pain' }
  });
  assert.equal(p.signal, 'red');
  assert.equal(p.changes.length, 0);
});

test('pending proposal is not a final session', () => {
  const p = generateProposal(baseArgs);
  assert.equal(
    finalSession({ workout: state.workout, proposal: p }).status,
    'proposal_pending'
  );
});

test('modified decision requires and publishes modifications', () => {
  const p = generateProposal(baseArgs);
  const mod = [
    {
      itemId: 'item-2',
      replacementExerciseId: 'box-step-up',
      finalDose: state.workout.items.find(i => i.id === 'item-2').dose,
      reason: 'Ajuste del coach'
    }
  ];
  const d = createDecision({
    proposal: p,
    action: 'coach_modified',
    actorId: 'diego',
    modifications: mod
  });
  const s = finalSession({ workout: state.workout, proposal: p, decision: d });
  assert.ok(s.items.find(i => i.itemId === 'item-2').changed);
  assert.equal(d.proposalSnapshot.id, p.id);
});
