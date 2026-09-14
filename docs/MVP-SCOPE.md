# TrackIU decision-loop validation MVP — second reconstruction

This document tracks the scope of the decision-loop demo published in `jloparra/jloparra.github.io` and the additional cuts implemented in the second reconstruction.

The demo is a static, synthetic environment for validation with coaches, not a production SaaS.

## Included in this demo

- Class of the day and structured workout items.
- Three fictitious athletes per gym, with two gyms in the demo.
- Synthetic onboarding snapshot for Lucía, with four derived profiles:
  - Athlete profile (experience and goals).
  - Restrictions profile (zones and side).
  - Dynamic profile (habits).
  - Capacity profile (tests and missing data).
- Pre-check-in with recovery, zone, persistence and escalation flags.
- Deterministic decision engine that:
  - Maintains or reduces exposure.
  - Uses only synthetic data.
  - Stops automation on escalation.
  - Marks missing context explicitly.
- Coach cockpit with proposals and decisions:
  - Accept.
  - Modify (prepared in engine, editor to be extended).
  - Discard.
  - Escalate.
- Athlete views:
  - Onboarding snapshot.
  - Pre-check-in.
  - Final session.
  - Feedback form with RPE, fatigue and discomfort.
  - Access-permission screen per gym.
- Manager view for pilot capacity.
- Super admin view for demo state.

## Explicitly out of scope

- Real authentication, backend, database or encryption.
- Real onboarding flow and full survey structure.
- Production-ready consent trail and legal texts.
- Periodization plan, schedules, bookings and calendar.
- Payments, memberships, invoices and contracts.
- Tracks, conversational assistant and wearables.

All future functionality is referenced only in documentation, not in the main navigation.
