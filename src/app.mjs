import { loadState, saveState, resetState, event } from './store.mjs';
import { generateProposal, createDecision, finalSession } from './decision-engine.mjs';

let state = loadState();

const ROLE_NAV = {
  trainer: [
    ['home','Clase de hoy'],
    ['cockpit','Cockpit'],
    ['catalog','Catálogo'],
    ['trainings','Entrenamientos']
  ],
  athlete: [
    ['home','Tu entrenamiento de hoy'],
    ['onboarding','Encuesta inicial'],
    ['pre','Pre-check-in'],
    ['session','Mi sesión'],
    ['feedback','Feedback'],
    ['permissions','Permiso de acceso']
  ],
  manager: [
    ['home','Resumen del gimnasio'],
    ['gym-users','Usuarios'],
    ['limits','Cupo piloto']
  ],
  super_admin: [
    ['home','Estado de la demo'],
    ['gyms','Gimnasios ficticios'],
    ['catalog','Catálogo global'],
    ['events','Eventos de validación']
  ]
};

const PROFILE_LABEL = {
  trainer: 'Coach',
  athlete: 'Atleta',
  manager: 'Manager',
  super_admin: 'Super admin'
};

let viewId = 'home';

function $(selector) { return document.querySelector(selector); }

function mountDemo(profile) {
  state.profile = profile;
  event(state,'role_selected',{profile});
  $('#app').hidden = false;
  document.getElementById('profile-switcher').value = profile;
  renderChrome();
  renderNav();
  renderView();
}

function renderChrome() {
  $('#profile-badge').textContent = PROFILE_LABEL[state.profile];
  $('#context-label').textContent = state.profile === 'super_admin'
    ? 'Demo TrackIU'
    : state.currentGym === 'gym-a'
    ? 'Avenidas Box'
    : 'North Performance';
}

function renderNav() {
  const nav = $('#primary-nav');
  const entries = ROLE_NAV[state.profile] || [];
  nav.innerHTML = entries.map(([id,label]) => `
    <button type="button" class="nav-link ${viewId===id?'active':''}" data-view="${id}">${label}</button>
  `).join('');
}

function renderView() {
  const container = $('#view');
  const workout = state.workout;
  if (state.profile === 'trainer') {
    if (viewId === 'home') {
      const participants = workout.participants.map(id => state.users.find(u => u.id === id));
      container.innerHTML = `
        <section class="section-card">
          <header class="section-header">
            <div>
              <p class="eyebrow">Clase de hoy</p>
              <h2>${workout.name}</h2>
            </div>
            <span class="badge">${workout.date}</span>
          </header>
          <div class="section-body">
            <p class="muted">Hasta tres atletas por gimnasio en esta demo. El entrenador revisa cada propuesta antes de la sesión.</p>
            <ul class="status-list">
              ${participants.map(a => renderTrainerRow(a)).join('')}
            </ul>
          </div>
        </section>
      `;
    } else if (viewId === 'cockpit') {
      const participants = workout.participants.map(id => state.users.find(u => u.id === id));
      container.innerHTML = `
        <section class="section-card">
          <header class="section-header">
            <div>
              <p class="eyebrow">Cockpit</p>
              <h2>${workout.name}</h2>
            </div>
            <span class="badge info">Reglas de demostración ${state.rulesVersion || 'demo-rules-2.1.0'}</span>
          </header>
          <div class="section-body">
            ${participants.map(a => renderTrainerProposal(workout,a)).join('')}
          </div>
          <section class="notice warning">
            Las propuestas no diagnostican ni sustituyen el criterio profesional. El coach acepta, modifica, descarta o escala.
          </section>
        </section>
      `;
    } else if (viewId === 'catalog') {
      container.innerHTML = renderCatalog();
    } else if (viewId === 'trainings') {
      container.innerHTML = renderTrainings();
    }
  } else if (state.profile === 'athlete') {
    if (viewId === 'home') {
      container.innerHTML = renderAthleteHome();
    } else if (viewId === 'onboarding') {
      container.innerHTML = renderOnboarding();
    } else if (viewId === 'pre') {
      container.innerHTML = renderPrecheckForm();
    } else if (viewId === 'session') {
      container.innerHTML = renderAthleteSession();
    } else if (viewId === 'feedback') {
      container.innerHTML = renderFeedbackForm();
    } else if (viewId === 'permissions') {
      container.innerHTML = renderPermissions();
    }
  } else if (state.profile === 'manager') {
    container.innerHTML = renderManagerView();
  } else if (state.profile === 'super_admin') {
    container.innerHTML = renderSuperAdminView();
  }

  bindViewEvents();
}

function renderTrainerRow(athlete) {
  const permission = state.permissions[athlete.id]?.[state.currentGym];
  const proposal = generateProposal({
    workout: state.workout,
    athleteId: athlete.id,
    permission,
    restrictions: state.restrictions,
    precheck: state.prechecks[athlete.id],
    latestFeedback: state.feedback[athlete.id]?.at(-1),
    capacityProfile: state.onboarding[athlete.id]?.capacity?.profile || null
  });
  state.proposals[proposal.id] = proposal;
  const statusLabel = proposal.signal === 'green'
    ? 'Sin novedades con la información disponible'
    : proposal.signal === 'gray'
    ? 'Faltan datos para valorar esta sesión'
    : proposal.signal === 'amber'
    ? 'Hay una propuesta que revisar'
    : 'Revisión necesaria antes de entrenar';
  return `
    <li class="status-row">
      <span class="status-dot ${proposal.signal}"></span>
      <div>
        <strong>${athlete.name}</strong>
        <p>${statusLabel}</p>
      </div>
      <button type="button" class="button secondary" data-action="open-review" data-proposal="${proposal.id}" data-athlete="${athlete.id}">Revisar propuesta</button>
    </li>
  `;
}

function renderTrainerProposal(workout, athlete) {
  const permission = state.permissions[athlete.id]?.[state.currentGym];
  const capacityProfile = state.onboarding[athlete.id]?.capacity?.profile || null;
  const proposal = generateProposal({
    workout,
    athleteId: athlete.id,
    permission,
    restrictions: state.restrictions,
    precheck: state.prechecks[athlete.id],
    latestFeedback: state.feedback[athlete.id]?.at(-1),
    capacityProfile
  });
  state.proposals[proposal.id] = proposal;
  const decision = state.decisions[proposal.id];
  const semaforoText = proposal.signal === 'green'
    ? 'Verde: sin novedades relevantes con la información disponible.'
    : proposal.signal === 'gray'
    ? 'Gris: faltan datos relevantes para valorar esta sesión.'
    : proposal.signal === 'amber'
    ? 'Ámbar: hay una propuesta o señal que revisar.'
    : 'Rojo: la automatización se detiene y requiere intervención.';
  return `
    <article class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">${athlete.name}</p>
          <h3>Propuesta determinista</h3>
        </div>
        <span class="badge ${proposal.signal}">${proposal.signal}</span>
      </header>
      <div class="section-body stack">
        <p class="muted">${semaforoText}</p>
        <ul class="bullet-list">
          ${proposal.changes.map(change => `
            <li>${change.reason}</li>
          `).join('') || '<li>No hay cambios propuestos con los datos disponibles.</li>'}
        </ul>
        <div class="inline">
          <button type="button" class="button" data-action="decide" data-kind="accepted" data-proposal="${proposal.id}">Aceptar</button>
          <button type="button" class="button secondary" data-action="open-edit" data-proposal="${proposal.id}">Modificar</button>
          <button type="button" class="button ghost" data-action="decide" data-kind="discarded" data-proposal="${proposal.id}">Descartar</button>
          <button type="button" class="button danger" data-action="decide" data-kind="escalated" data-proposal="${proposal.id}">Escalar</button>
        </div>
        ${decision
          ? `<p class="muted">Decisión registrada: ${decision.action}.</p>`
          : '<p class="muted">La sesión aún está en estado pendiente para el atleta.</p>'}
      </div>
    </article>
  `;
}

function renderCatalog() {
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">Catálogo mínimo</p>
          <h2>Ejercicios en esta demo</h2>
        </div>
      </header>
      <div class="section-body">
        <p class="muted">Entre 20 y 30 ejercicios dan contexto suficiente sin aparentar una taxonomía clínica completa.</p>
      </div>
    </section>
  `;
}

function renderTrainings() {
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">Clase de demostración</p>
          <h2>${state.workout.name}</h2>
        </div>
      </header>
      <div class="section-body">
        <ul class="bullet-list">
          ${state.workout.items.map(item => {
            const exercise = state.catalog?.find(e => e.id === item.exerciseId) || null;
            const dose = item.dose;
            const doseLabel = dose.durationMinutes
              ? `${dose.durationMinutes} min`
              : `${dose.sets} × ${dose.reps}${dose.loadLabel ? ' · ' + dose.loadLabel : ''}`;
            return `<li>${exercise ? exercise.name : 'Ejercicio'} · ${doseLabel}</li>`;
          }).join('')}
        </ul>
      </div>
    </section>
  `;
}

function renderAthleteHome() {
  const pre = state.prechecks[state.currentAthlete];
  const decision = Object.values(state.decisions).find(d => d.athleteId === state.currentAthlete);
  const status = !decision ? 'proposal_pending' : decision.action;
  let message;
  if (status === 'proposal_pending') message = 'El entrenador está revisando tu sesión.';
  else if (status === 'coach_escalated') message = 'Revisión necesaria antes de entrenar. Habla con tu entrenador.';
  else if (status === 'coach_discarded') message = 'Tu entrenador ha mantenido el entrenamiento.';
  else if (status === 'coach_modified') message = 'Tu entrenador ha ajustado esta parte.';
  else message = 'Tu entrenador ha revisado la sesión.';
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">Tu entrenamiento de hoy</p>
          <h2>${state.workout.name}</h2>
        </div>
      </header>
      <div class="section-body stack">
        <p>${message}</p>
        <p class="muted">Pre-check-in: ${pre ? 'completado' : 'pendiente'}.</p>
        <div class="inline">
          <button type="button" class="button" data-action="goto" data-view="onboarding">Ver encuesta inicial</button>
          <button type="button" class="button" data-action="goto" data-view="pre">Completar pre-check-in</button>
          <button type="button" class="button secondary" data-action="goto" data-view="session">Ver sesión individual</button>
        </div>
      </div>
    </section>
  `;
}

function renderOnboarding() {
  const snapshot = state.onboarding[state.currentAthlete];
  if (!snapshot) {
    return `
      <section class="section-card">
        <header class="section-header">
          <div>
            <p class="eyebrow">Encuesta inicial</p>
            <h2>Perfil de atleta y contexto</h2>
          </div>
        </header>
        <div class="section-body">
          <p class="muted">En esta demo asumimos una encuesta inicial ficticia ya completada. En una aplicación real, aquí viviría la encuesta única de alta.</p>
        </div>
      </section>
    `;
  }
  const profile = snapshot.profile;
  const capacity = snapshot.capacity.profile;
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">Encuesta inicial</p>
          <h2>Perfiles derivados de Lucía</h2>
        </div>
      </header>
      <div class="section-body stack">
        <article>
          <h3>Perfil de atleta</h3>
          <p>${profile.training_experience}</p>
          <p class="muted">Objetivo principal: ${profile.goals}</p>
        </article>
        <article>
          <h3>Restricciones declaradas</h3>
          <p class="muted">${snapshot.restrictions.map(r => r.label).join(' · ')}</p>
        </article>
        <article>
          <h3>Perfil dinámico</h3>
          <p class="muted">Sueño medio: ${profile.habits.sleep_hours} h · fin de semana: ${profile.habits.weekend_alcohol}</p>
        </article>
        <article>
          <h3>Perfil de capacidad</h3>
          <p>Nivel: ${capacity.level} · confianza: ${capacity.confidence}</p>
          <p class="muted">Datos pendientes: ${capacity.missing.join(', ') || 'ninguno'}</p>
        </article>
      </div>
    </section>
  `;
}

function renderPrecheckForm() {
  const pre = state.prechecks[state.currentAthlete] || {};
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">Solo lo que cambia la decisión</p>
          <h2>¿Cómo llegas hoy?</h2>
        </div>
        <span class="badge">3 preguntas</span>
      </header>
      <form id="pre-form" class="section-body form-grid">
        <fieldset class="form-field full">
          <legend>Recuperación general</legend>
          <div class="choice-row">
            ${[1,2,3,4,5].map(n => `
              <span class="choice">
                <input type="radio" id="rec${n}" name="recovery" value="${n}" ${pre.recovery===n ? 'checked' : ''} required>
                <label for="rec${n}">${n}</label>
              </span>
            `).join('')}
          </div>
          <small>1 = muy baja · 5 = muy buena</small>
        </fieldset>
        <div class="form-field">
          <label for="pre-zone">Zona relevante hoy</label>
          <select id="pre-zone" name="zone">
            <option value="">Ninguna</option>
            ${Object.entries(state.zones || {}).map(([key,label]) => `
              <option value="${key}" ${pre.discomfort===key ? 'selected' : ''}>${label}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-field">
          <label for="persistence">¿La molestia persiste?</label>
          <select id="persistence" name="persistence">
            <option value="false">No</option>
            <option value="true" ${pre.persists ? 'selected' : ''}>Sí</option>
          </select>
        </div>
        <fieldset class="form-field full">
          <legend>¿Hay alguna señal que requiera revisión?</legend>
          <div class="choice-row">
            <span class="choice">
              <input type="radio" id="esc-none" name="escalation" value="" ${!pre.escalation ? 'checked' : ''}>
              <label for="esc-none">Sin señales especiales</label>
            </span>
            <span class="choice">
              <input type="radio" id="esc-chest" name="escalation" value="chest_pain" ${pre.escalation==='chest_pain' ? 'checked' : ''}>
              <label for="esc-chest">Dolor torácico declarado</label>
            </span>
            <span class="choice">
              <input type="radio" id="esc-syncope" name="escalation" value="syncope" ${pre.escalation==='syncope' ? 'checked' : ''}>
              <label for="esc-syncope">Síncope o pérdida de conocimiento</label>
            </span>
          </div>
        </fieldset>
        <div class="form-field full">
          <button class="button" type="submit">Guardar check-in</button>
        </div>
      </form>
    </section>
  `;
}

function renderAthleteSession() {
  const proposal = Object.values(state.proposals).find(p => p.athleteId === state.currentAthlete) || null;
  const decision = Object.values(state.decisions).find(d => d.athleteId === state.currentAthlete) || null;
  const session = finalSession({ workout: state.workout, proposal, decision });
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">Sesión final</p>
          <h2>${state.workout.name}</h2>
        </div>
        <span class="badge">${session.status}</span>
      </header>
      <div class="section-body stack">
        ${session.items.map(item => `
          <article class="proposal">
            <div>
              <span class="eyebrow">Original</span>
              <h3>${item.original}</h3>
              <p class="muted">${formatDose(item.dose)}</p>
            </div>
            <div class="arrow">→</div>
            <div>
              <span class="eyebrow">Para ti</span>
              <h3>${item.exercise}</h3>
              <p class="muted">${item.reason}</p>
            </div>
          </article>
        `).join('') || '<p class="muted">Tu entrenador está revisando la sesión.</p>'}
        <button type="button" class="button" data-action="goto" data-view="feedback">Dar feedback al terminar</button>
      </div>
    </section>
  `;
}

function formatDose(dose) {
  if (!dose) return '';
  if (dose.durationMinutes) return `${dose.durationMinutes} min`;
  return `${dose.sets} × ${dose.reps}${dose.loadLabel ? ' · ' + dose.loadLabel : ''}`;
}

function renderFeedbackForm() {
  const feedback = state.feedback[state.currentAthlete]?.at(-1);
  if (feedback) {
    return `
      <section class="section-card">
        <div class="empty">
          <span class="badge">Enviado</span>
          <h2>Feedback registrado</h2>
          <p>RPE ${feedback.rpe}/10 · fatiga ${feedback.fatigue}/10. La respuesta es inmutable y puede condicionar la siguiente pregunta.</p>
        </div>
      </section>
    `;
  }
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">Después de entrenar</p>
          <h2>¿Cómo fue la sesión?</h2>
        </div>
      </header>
      <form id="feedback-form" class="section-body form-grid">
        <div class="form-field">
          <label for="rpe">RPE (1–10)</label>
          <input id="rpe" name="rpe" type="number" min="1" max="10" required>
        </div>
        <div class="form-field">
          <label for="fatigue">Fatiga (1–10)</label>
          <input id="fatigue" name="fatigue" type="number" min="1" max="10" required>
        </div>
        <div class="form-field">
          <label for="discomfort-zone">¿Hubo molestias?</label>
          <select id="discomfort-zone" name="zone">
            <option value="">Sin molestias</option>
            ${Object.entries(state.zones || {}).map(([key,label]) => `
              <option value="${key}">${label}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-field">
          <label for="discomfort-side">Lado</label>
          <select id="discomfort-side" name="side">
            <option value="">No aplica</option>
            <option value="left">Izquierdo</option>
            <option value="right">Derecho</option>
            <option value="both">Ambos</option>
          </select>
        </div>
        <div class="form-field full">
          <label for="note">Nota opcional</label>
          <textarea id="note" name="note" placeholder="Describe solo lo necesario"></textarea>
        </div>
        <div class="form-field full">
          <button class="button" type="submit">Enviar feedback</button>
        </div>
      </form>
    </section>
  `;
}

function renderPermissions() {
  const gyms = state.gyms;
  const permissions = state.permissions[state.currentAthlete] || {};
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">Permiso de acceso</p>
          <h2>Qué gimnasios pueden usar tu contexto</h2>
        </div>
      </header>
      <div class="section-body">
        <p class="muted">Solo tú decides qué gimnasios pueden ver tus restricciones y respuestas ficticias en esta demo.</p>
        <ul class="status-list">
          ${gyms.map(gym => {
            const allowed = Boolean(permissions[gym.id]);
            return `
              <li class="status-row">
                <div>
                  <strong>${gym.name}</strong>
                  <p>${allowed ? 'Este gimnasio tiene permiso de acceso.' : 'Este gimnasio no tiene permiso de acceso.'}</p>
                </div>
                <button type="button" class="button secondary" data-action="toggle-permission" data-gym="${gym.id}">
                  ${allowed ? 'Dejar de compartir' : 'Conceder permiso'}
                </button>
              </li>
            `;
          }).join('')}
        </ul>
        <p class="muted small">Este gimnasio dejará de acceder a tus restricciones y respuestas cuando retires el permiso.</p>
      </div>
    </section>
  `;
}

function renderManagerView() {
  const gymUsers = state.users.filter(u => u.gymId === state.currentGym);
  const athletes = gymUsers.filter(u => u.role === 'athlete');
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">${state.currentGym === 'gym-a' ? 'Avenidas Box' : 'North Performance'}</p>
          <h2>Cupo piloto</h2>
        </div>
        <span class="badge ${athletes.length >= 3 ? 'warning' : ''}">${athletes.length}/3 atletas</span>
      </header>
      <div class="section-body">
        <p class="muted">El manager puede invitar o desactivar atletas ficticios, pero no puede conceder ni revocar permisos de acceso.</p>
      </div>
    </section>
  `;
}

function renderSuperAdminView() {
  return `
    <section class="section-card">
      <header class="section-header">
        <div>
          <p class="eyebrow">Estado de la demo</p>
          <h2>Gimnasios y eventos</h2>
        </div>
      </header>
      <div class="section-body">
        <p class="muted">El superadministrador reinicia la demo y consulta los eventos locales, sin métricas comerciales ni datos reales.</p>
      </div>
    </section>
  `;
}

function bindViewEvents() {
  const preForm = document.getElementById('pre-form');
  if (preForm) {
    preForm.addEventListener('submit', eventPrecheckSubmit);
  }
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', eventFeedbackSubmit);
  }
}

function eventPrecheckSubmit(ev) {
  ev.preventDefault();
  const form = new FormData(ev.target);
  state.prechecks[state.currentAthlete] = {
    recovery: Number(form.get('recovery')),
    discomfort: form.get('zone') || null,
    persists: form.get('persistence') === 'true',
    escalation: form.get('escalation') || null,
    submittedAt: new Date().toISOString()
  };
  event(state,'precheck_completed',{athleteId: state.currentAthlete});
  saveState(state);
  viewId = 'session';
  renderView();
}

function eventFeedbackSubmit(ev) {
  ev.preventDefault();
  const form = new FormData(ev.target);
  const entry = {
    rpe: Number(form.get('rpe')),
    fatigue: Number(form.get('fatigue')),
    zone: form.get('zone') || null,
    side: form.get('side') || null,
    note: form.get('note') || '',
    submittedAt: new Date().toISOString()
  };
  state.feedback[state.currentAthlete] = (state.feedback[state.currentAthlete] || []).concat(entry);
  event(state,'feedback_completed',{athleteId: state.currentAthlete});
  saveState(state);
  renderView();
}

function handleGlobalClick(ev) {
  const target = ev.target;
  if (!(target instanceof HTMLElement)) return;
  const profile = target.dataset.profile;
  if (target.dataset.action === 'open-demo' && profile) {
    mountDemo(profile);
    document.getElementById('inicio').scrollIntoView({behavior:'smooth'});
    return;
  }
  if (target.dataset.view) {
    viewId = target.dataset.view;
    event(state,'class_opened',{view:viewId});
    renderView();
    return;
  }
  if (target.dataset.action === 'goto' && target.dataset.view) {
    viewId = target.dataset.view;
    renderView();
    return;
  }
  if (target.dataset.action === 'toggle-permission' && target.dataset.gym) {
    const gymId = target.dataset.gym;
    const current = state.permissions[state.currentAthlete] || {};
    const allowed = Boolean(current[gymId]);
    current[gymId] = !allowed;
    state.permissions[state.currentAthlete] = current;
    event(state,'permission_changed',{athleteId: state.currentAthlete,gymId,allowed:!allowed});
    saveState(state);
    renderView();
    return;
  }
  if (target.dataset.action === 'decide' && target.dataset.kind && target.dataset.proposal) {
    const proposalId = target.dataset.proposal;
    const proposal = state.proposals[proposalId] || null;
    if (!proposal) return;
    const actionMap = {
      accepted: 'coach_accepted',
      discarded: 'coach_discarded',
      escalated: 'coach_escalated'
    };
    const action = actionMap[target.dataset.kind];
    if (!action) return;
    const decision = createDecision({
      proposal,
      action,
      actorId: 'diego',
      reason: 'Decisión registrada en la demo',
      modifications: []
    });
    state.decisions[proposal.id] = decision;
    event(state,'proposal_'+target.dataset.kind,{athleteId: proposal.athleteId});
    saveState(state);
    renderView();
    return;
  }
}

function bindChrome() {
  document.addEventListener('click', handleGlobalClick);
  const profileSwitcher = document.getElementById('profile-switcher');
  if (profileSwitcher) {
    profileSwitcher.addEventListener('change', ev => {
      const profile = ev.target.value;
      mountDemo(profile);
    });
  }
  const resetButton = document.getElementById('reset-demo');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (confirm('¿Reiniciar todos los datos de esta demo?')) {
        state = resetState();
        viewId = 'home';
        event(state,'demo_reset',{});
        renderChrome();
        renderNav();
        renderView();
      }
    });
  }
}

bindChrome();
