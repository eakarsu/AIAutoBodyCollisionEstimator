CREATE TABLE IF NOT EXISTS governed_estimates (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, vin TEXT NOT NULL,
 payload JSONB NOT NULL, totals JSONB NOT NULL, status TEXT NOT NULL DEFAULT 'inspection_ready'
 CHECK(status IN ('inspection_ready','estimate_ready','review_pending','approved','rejected','supplement_requested')),
 version INTEGER NOT NULL DEFAULT 1, created_by TEXT NOT NULL, approved_by TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS governed_estimate_events (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, estimate_id BIGINT NOT NULL REFERENCES governed_estimates(id), actor_id TEXT NOT NULL,
 event_type TEXT NOT NULL, from_status TEXT, to_status TEXT, event_data JSONB NOT NULL DEFAULT '{}'::jsonb, occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION reject_estimate_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'estimate history is append-only'; END $$;
DROP TRIGGER IF EXISTS governed_estimate_events_immutable ON governed_estimate_events;
CREATE TRIGGER governed_estimate_events_immutable BEFORE UPDATE OR DELETE ON governed_estimate_events FOR EACH ROW EXECUTE FUNCTION reject_estimate_event_mutation();
CREATE INDEX IF NOT EXISTS governed_estimates_tenant_status_idx ON governed_estimates(tenant_id,status,updated_at DESC);

