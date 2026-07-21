# Completeness Review: AIAutoBodyCollisionEstimator

- **Review date:** 2026-07-18
- **Assessment basis:** Static source and configuration inspection only. Dependencies were not installed, and no build, database migration, external integration, or runtime workflow was executed.

## Classification

**Prototype-demo**

## Verdict

The repository presents a broad collision estimating surface (91 source files and 37 route modules), but the static evidence is characteristic of a generated prototype. Pages and endpoints demonstrate concepts; they do not establish a verified execution path for turn photos, VIN/build data, damage observations, parts, labor, and supplements into reviewer-approved estimates.

## Why it is not complete

- 23 files are explicitly named as gap/gap-feature implementations; route/page count therefore overstates completed product capability.
- 19 files reference model-provider or chat-completion behavior; these generic LLM paths are not a substitute for deterministic domain execution, grounding, or evaluation.
- 26 files contain mock, sample, placeholder, or random-data signals, leaving important outcomes disconnected from authoritative systems.
- Only 2 recognizable test files were found, insufficient to prove the full workflow and failure modes.
- No CI workflow was found to continuously verify builds, tests, migrations, or security checks.
- No environment example/template was found, so required configuration and secret boundaries are undocumented.

## Needed features

- 1. Implement a workflow to turn photos, VIN/build data, damage observations, parts, labor, and supplements into reviewer-approved estimates.
- 2. Connect OEM repair procedures, parts/pricing, estimating systems, insurers, and shop management; replace seed/demo records with durable, synchronized data and explicit failure handling.
- 3. Validate damage detection, repair-vs-replace choices, quantities, and estimate variance.
- 4. Enforce safety-procedure compliance, photo privacy, provenance, and estimator approval.
- 5. Add contract, integration, authorization, migration, and end-to-end tests in CI, plus a documented non-destructive deployment/run path.

## Risks or launch blockers

- Credential/secret fallback or demo-password patterns occur in 3 files and must be removed or made development-only.
- The root launcher can terminate unrelated processes occupying configured ports.
- The root launcher seeds, creates, migrates, or otherwise mutates database state during startup.
- The root launcher installs dependencies at run time, reducing reproducibility and expanding supply-chain risk.
- Ungrounded or malformed model output can become a domain action unless schemas, evidence, evaluations, and approval gates are added.

## Evidence inspected

- `backend/package.json` — declared scripts, runtime dependencies, and application boundaries.
- `frontend/package.json` — declared scripts, runtime dependencies, and application boundaries.
- `backend/server.js` — service composition, middleware, and registered routes.
- `frontend/src/App.jsx` — front-end navigation and visible workflow surface.
- `backend/routes/ai.js` — implemented API surface and domain/AI request handling.
- `backend/routes/appointments.js` — implemented API surface and domain/AI request handling.

## Recommended next action

Treat this as a prototype: select one narrow collision estimating outcome, remove or quarantine generated gap routes, and implement that outcome end to end with real data, deterministic rules, and tests before adding features.

## Implementation progress

**Local status:** The locally actionable governed-estimate foundation is implemented. This does not claim OEM, insurer, supplier, estimator, or repair-safety validation.

- **Needed feature 1 — implemented locally:** `backend/routes/governedEstimates.js`, `backend/domain/estimateWorkflow.js`, and `backend/db/migrations/002_governed_estimates.sql` accept VIN, hashed photo provenance, damage observations, OEM procedure references, parts/labor lines, supplements, deterministic integer-cent totals, idempotency, version conflicts, reviewer approval, and immutable decision history.
- **Needed feature 2 — bounded, externally blocked:** `/api/estimate-cases/external-capabilities` reports VIN, OEM procedure, parts/pricing, and carrier adapters as unavailable. Real synchronization requires licensed repair data, supplier/carrier contracts, credentials, certification, and shop-system test environments.
- **Needed feature 3 — local validation implemented; estimator validation blocked:** validators enforce VIN format, photo hashes/timestamps, positive quantities, and OEM evidence for structural/restraint/ADAS repairs; deterministic cost fixtures are in `backend/tests/estimateWorkflow.test.js`. Damage detection and repair-vs-replace accuracy still require estimator-reviewed cases.
- **Needed feature 4 — implemented locally:** API-wide authentication, tenant scoping, estimator-role gates, estimator/reviewer separation, safety-procedure gating, approval attribution, immutable events, and explicit privacy/provenance fields provide the local control boundary.
- **Needed feature 5 — implemented locally:** `.env.example`, strict runtime config, explicit bootstrap/migrate/guarded-seed scripts, non-destructive startup, `OPERATIONS.md`, tests, and CI definitions for unit tests, idempotent migrations, and frontend build are present.
- **Risk closure:** JWT/database credential fallbacks, port termination, runtime installs/seeding/database creation, displayed demo credentials, and mounted AI/gap/payment/carrier/OEM/CV/provider routes were removed from the runtime path.
- **Validation performed:** 4/4 domain tests passed; JavaScript syntax, shell syntax, and Git whitespace checks passed. Dependencies were absent, so no local frontend build ran. No database, storage, payment, insurer, supplier, or OEM provider was executed.
