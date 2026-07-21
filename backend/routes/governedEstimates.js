'use strict';
const router = require('express').Router();
const pool = require('../db/pool');
const { validateEstimate, calculateTotals, assertTransition } = require('../domain/estimateWorkflow');
const tenantFor = user => String(user.tenant_id || user.shop_id || `legacy-user:${user.id}`);

router.get('/external-capabilities', (req, res) => res.json({
  vinDecoder: { configured: false, status: 'requires licensed provider contract' },
  oemProcedures: { configured: false, status: 'requires licensed repair data' },
  insurerSubmission: { configured: false, status: 'requires carrier credentials and certification' },
  partsPricing: { configured: false, status: 'requires supplier feed credentials' },
}));
router.get('/', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM governed_estimates WHERE tenant_id=$1 ORDER BY updated_at DESC', [tenantFor(req.user)]); res.json(result.rows); }
  catch { res.status(500).json({ error: 'Unable to load estimate cases' }); }
});
router.post('/', async (req, res) => {
  const key = req.get('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header is required' });
  const validation = validateEstimate(req.body || {});
  if (!validation.valid) return res.status(422).json(validation);
  const tenant = tenantFor(req.user); const totals = calculateTotals(req.body); let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM governed_estimates WHERE tenant_id=$1 AND idempotency_key=$2', [tenant, key]);
    if (existing.rows[0]) { await client.query('ROLLBACK'); return res.json(existing.rows[0]); }
    const created = await client.query(
      `INSERT INTO governed_estimates (tenant_id,idempotency_key,vin,payload,totals,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [tenant, key, req.body.vin.toUpperCase(), req.body, totals, String(req.user.id)]
    );
    await client.query(`INSERT INTO governed_estimate_events (tenant_id,estimate_id,actor_id,event_type,to_status,event_data) VALUES ($1,$2,$3,'created','inspection_ready',$4)`, [tenant, created.rows[0].id, String(req.user.id), { photoCount: req.body.photos.length, totals }]);
    await client.query('COMMIT'); res.status(201).json(created.rows[0]);
  } catch { if (client) await client.query('ROLLBACK'); res.status(500).json({ error: 'Unable to create estimate case' }); }
  finally { if (client) client.release(); }
});
router.post('/:id/transition', async (req, res) => {
  const { toStatus, expectedVersion, rationale } = req.body || {};
  if (!Number.isInteger(expectedVersion) || !rationale) return res.status(400).json({ error: 'expectedVersion and rationale are required' });
  const tenant = tenantFor(req.user); let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM governed_estimates WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, tenant]);
    const current = found.rows[0]; if (!current) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Estimate not found' }); }
    assertTransition(current.status, toStatus, req.user, current);
    if (current.version !== expectedVersion) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Version conflict', currentVersion: current.version }); }
    const updated = await client.query(`UPDATE governed_estimates SET status=$1,version=version+1,updated_at=NOW(),approved_by=CASE WHEN $1='approved' THEN $2 ELSE approved_by END WHERE id=$3 AND tenant_id=$4 AND version=$5 RETURNING *`, [toStatus, String(req.user.id), current.id, tenant, expectedVersion]);
    await client.query(`INSERT INTO governed_estimate_events (tenant_id,estimate_id,actor_id,event_type,from_status,to_status,event_data) VALUES ($1,$2,$3,'transition',$4,$5,$6)`, [tenant, current.id, String(req.user.id), current.status, toStatus, { rationale }]);
    await client.query('COMMIT'); res.json(updated.rows[0]);
  } catch (error) { if (client) await client.query('ROLLBACK'); const clientError = /not allowed|role required|own estimate/.test(error.message); res.status(clientError ? 422 : 500).json({ error: clientError ? error.message : 'Unable to transition estimate' }); }
  finally { if (client) client.release(); }
});
router.get('/:id/history', async (req, res) => {
  try { const result = await pool.query('SELECT * FROM governed_estimate_events WHERE estimate_id=$1 AND tenant_id=$2 ORDER BY occurred_at,id', [req.params.id, tenantFor(req.user)]); res.json(result.rows); }
  catch { res.status(500).json({ error: 'Unable to load estimate history' }); }
});
module.exports = router;
