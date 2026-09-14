# TrackIU demo — decisions for the second reconstruction

This document records product and technical decisions taken for the second reconstruction of the decision-loop demo.

## Product decisions

- Focus on the adaptation loop, not on full gym management.
- Represent onboarding and capacity via a synthetic snapshot for a single athlete.
- Show four profiles (athlete, restrictions, dynamic, capacity) as derived context.
- Keep all data fictitious and local to the browser.
- Avoid any wording that suggests medical diagnosis or guaranteed prevention.

## Technical decisions

- Keep the app static and published via GitHub Pages.
- Use ES modules and simple HTML/CSS.
- Persist state in versioned `localStorage` with a reset button.
- Structure workout dose in fields (sets, reps, duration) instead of opaque strings.
- Make the decision engine pure and deterministic at the business layer.

## Open questions (not closed in this demo)

- Battery and caducity of physical tests for a real pilot.
- Exact wording and scope of escalation flags for Phase 0.
- Aggregated metrics and coach-facing longitudinal views.

These questions remain governed by Specs and the business decisions documents, not by this demo.
