# Audit Apply Note — AIAutoBodyCollisionEstimator

Source: `_AUDIT/reports/batch_00.md` § 28.

## Original audit recommendations

### Missing AI counterparts
- AI total loss prediction (is vehicle repairable or salvage?)
- AI paint/interior degradation (age-based depreciation)

### Missing non-AI features
- VIN decoder integration (exact spec retrieval)
- Parts supplier integration (real-time parts availability)
- Insurance API integration (direct claim submission)

### Custom features
- Computer vision damage analysis
- Real-time parts pricing via supplier APIs
- Insurance direct integration
- Recycled parts marketplace
- External integrations: OEM (Ford/GM/Tesla), insurance APIs, parts supplier APIs

## Implemented in this pass (MECHANICAL)

| # | Item | File | Endpoint |
|---|------|------|----------|
| 1 | AI total loss prediction | `backend/routes/ai.js` | `POST /api/ai/total-loss-prediction` |
| 2 | AI paint/interior degradation | `backend/routes/ai.js` | `POST /api/ai/paint-degradation` |

Pattern matches existing AI endpoints: same `queryOpenRouter`/`parseAIJson`/`persist` flow, JSON schema responses, rate limiter inherited via `router.use(aiLimiter)`. `node --check` passes.

## Backlog (not implemented)

| Item | Tag | Why deferred |
|------|-----|---------------|
| VIN decoder integration | NEEDS-CREDS | External API key for NHTSA / commercial VIN service |
| Real-time parts pricing (AutoZone, RockAuto) | NEEDS-CREDS | Vendor partnership / API contracts required |
| Insurance API direct submission | NEEDS-CREDS | Per-carrier API contracts |
| Recycled parts marketplace | NEEDS-PRODUCT-DECISION | New domain; supplier onboarding model |
| Computer vision damage analysis | TOO-RISKY | Requires image-capable model integration & schema changes |
| OEM / Tesla integration | NEEDS-CREDS | Manufacturer APIs |

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS (FE already wired)
- **Why:** `frontend/src/pages/AITools.jsx` already exposes a tabbed UI for all 10 AI tools, including the pass-2 additions `/total-loss-prediction` and `/paint-degradation`. `frontend/src/services/api.js` exposes `totalLossPrediction` and `paintDegradation` helpers (lines 164-165) using the JWT-aware `request()` wrapper. Idempotence rule applied.

## Apply pass 4 (mechanical backlog)

- **Action:** SKIPPED
- **Why:** All remaining backlog items are tagged `NEEDS-CREDS`, `NEEDS-PRODUCT-DECISION`, or `TOO-RISKY` (VIN decoder, parts pricing APIs, insurance API submission, recycled parts marketplace, computer-vision damage analysis, OEM/Tesla integrations). No mechanical text-only AI counterparts remain.
