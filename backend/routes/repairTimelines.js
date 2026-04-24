const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rt.*, v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      c.first_name || ' ' || c.last_name as customer_name
      FROM repair_timelines rt
      LEFT JOIN vehicles v ON rt.vehicle_id = v.id
      LEFT JOIN customers c ON rt.customer_id = c.id
      ORDER BY rt.id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rt.*, v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      c.first_name || ' ' || c.last_name as customer_name
      FROM repair_timelines rt
      LEFT JOIN vehicles v ON rt.vehicle_id = v.id
      LEFT JOIN customers c ON rt.customer_id = c.id
      WHERE rt.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { vehicle_id, customer_id, claim_id, repair_type, description, estimated_days, start_date, estimated_completion, status, priority, assigned_technician } = req.body;
    const result = await pool.query(
      `INSERT INTO repair_timelines (vehicle_id, customer_id, claim_id, repair_type, description, estimated_days, start_date, estimated_completion, status, priority, assigned_technician)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [vehicle_id, customer_id, claim_id, repair_type, description, estimated_days, start_date, estimated_completion, status || 'scheduled', priority || 'normal', assigned_technician]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { vehicle_id, customer_id, claim_id, repair_type, description, estimated_days, start_date, estimated_completion, actual_completion, status, priority, assigned_technician, ai_timeline_analysis } = req.body;
    const result = await pool.query(
      `UPDATE repair_timelines SET vehicle_id=$1, customer_id=$2, claim_id=$3, repair_type=$4, description=$5,
       estimated_days=$6, start_date=$7, estimated_completion=$8, actual_completion=$9, status=$10, priority=$11, assigned_technician=$12, ai_timeline_analysis=$13, updated_at=CURRENT_TIMESTAMP WHERE id=$14 RETURNING *`,
      [vehicle_id, customer_id, claim_id, repair_type, description, estimated_days, start_date, estimated_completion, actual_completion, status, priority, assigned_technician, ai_timeline_analysis, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM repair_timelines WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
