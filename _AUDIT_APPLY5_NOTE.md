# Apply Pass 5 — AIAutoBodyCollisionEstimator

- **Date:** 2026-05-08
- **Stack:** Node.js + Express + Postgres (`backend/`), Vite + React (`frontend/`).
- **Audit source:** `_AUDIT/reports/batch_00.md` § 28.
- **Action:** VERIFIED-PRESENT (BE) + IMPLEMENTED-1 (FE wiring).

## Verified-present (existing pre-pass-5 work)

- 22 AI endpoints in `backend/routes/ai.js` (all 20 from audit + pass-2 added
  `/total-loss-prediction` and `/paint-degradation`). All wrapped in
  `aiLimiter`, JWT-authed, persist via `ai_results` table.
- `backend/routes/integrations.js` (334 lines) — implements all 6 pass-5
  backlog items as gated integration endpoints under `/api/ai-integrations/*`.
- All non-AI features in audit (customers, vehicles, damage, estimates, parts,
  work orders, invoices, suppliers, technicians, reports, photos, claims,
  timelines, settings, appointments) are present.

## Implemented this pass

| # | Item | File | Lines |
|---|------|------|-------|
| 1 | Frontend page surfacing the integrations endpoints | `frontend/src/pages/Integrations.jsx` (new) | 95 |

App route `/integrations` added in `frontend/src/App.jsx`. Backend already
fully covered by `integrations.js`:

| BE Endpoint | Backlog tag | Env vars |
|-------------|-------------|----------|
| `POST /api/ai-integrations/vin/decode` | NEEDS-CREDS | `VIN_DECODER_API_KEY` |
| `POST /api/ai-integrations/parts/realtime-pricing` | NEEDS-CREDS | `PARTS_SUPPLIER_API_KEY` |
| `POST /api/ai-integrations/insurance/submit-claim` | NEEDS-CREDS | `INSURANCE_API_KEY` |
| `GET /api/ai-integrations/insurance/submissions` | (read) | — |
| `POST /api/ai-integrations/oem/spec-lookup` | NEEDS-CREDS | `OEM_API_KEY` |
| `GET / POST / DELETE /api/ai-integrations/recycled-parts` | NEEDS-PRODUCT-DECISION (self-hosted) | — |
| `POST /api/ai-integrations/vision/damage-analysis` | TOO-RISKY → text-only | `OPENROUTER_API_KEY` |

## 503-on-no-key

VIN decoder, parts pricing, insurance submit, and OEM all return HTTP 503
when their respective env vars are missing. Vision damage analysis returns
503 if `OPENROUTER_API_KEY` is missing.

## Files written/modified

- `frontend/src/pages/Integrations.jsx` (new, 95 lines)
- `frontend/src/App.jsx` (added 2 lines: import + Route)

## Smoke test

- `node --check backend/routes/integrations.js` PASS
- `node --check backend/server.js` PASS
- FE page `/integrations` mounted; uses existing `localStorage.token` JWT pattern.
- Schema additions are `CREATE TABLE IF NOT EXISTS` (idempotent).

## Deferred

None — all backlog items have either a 503 stub (NEEDS-CREDS) or a
self-hosted/text-only implementation (PRODUCT-DECISION / TOO-RISKY).
