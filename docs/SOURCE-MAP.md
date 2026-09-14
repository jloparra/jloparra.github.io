# TrackIU demo — source map

This file maps demo behaviors to their implementation files and to the immutable specs in `TrackIU/web`.

## Repositories

- Demo implementation: `jloparra/jloparra.github.io`.
- Specs and product decisions (read-only): `TrackIU/web`, branch `specs`.

## Core flows

- Landing and public shell:
  - `index.html`.
- State and demo data:
  - `src/store.mjs` — localStorage persistence.
  - `src/demo-data.mjs` — synthetic gyms, users, permissions, onboarding snapshot and workout.
- Decision engine:
  - `src/decision-engine.mjs`.
- Permissions:
  - `src/permissions.mjs`.
- Role-specific UI:
  - `src/app.mjs`.

## Specs referenced

- Metaspec and cross-cutting rules:
  - `TrackIU/web/docs/specs/README.md`.
- Athlete onboarding and profiles:
  - `TrackIU/web/docs/specs/002-athlete-onboarding.md` (in the repo, read-only).
- Exercise catalog:
  - `TrackIU/web/docs/specs/003-exercise-catalog.md` (draft, reference only).
- Injuries and adaptations:
  - `TrackIU/web/docs/specs/004-injuries-and-adaptations.md` (draft, reference only).
- Class feedback:
  - `TrackIU/web/docs/specs/008-class-feedback.md` (draft, reference only).

The demo does not modify any file in `TrackIU/web`.
