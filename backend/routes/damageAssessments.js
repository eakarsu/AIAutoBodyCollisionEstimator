const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT da.*, v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      c.first_name || ' ' || c.last_name as customer_name
      FROM damage_assessments da
      LEFT JOIN vehicles v ON da.vehicle_id = v.id
      LEFT JOIN customers c ON da.customer_id = c.id
      ORDER BY da.id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT da.*, v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      c.first_name || ' ' || c.last_name as customer_name
      FROM damage_assessments da
      LEFT JOIN vehicles v ON da.vehicle_id = v.id
      LEFT JOIN customers c ON da.customer_id = c.id
      WHERE da.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, estimated_cost, status } = req.body;
    const result = await pool.query(
      `INSERT INTO damage_assessments (vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, estimated_cost, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, estimated_cost || 0, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, ai_analysis, estimated_cost, status } = req.body;
    const result = await pool.query(
      `UPDATE damage_assessments SET vehicle_id=$1, customer_id=$2, description=$3, damage_type=$4, severity=$5,
       location_on_vehicle=$6, photo_url=$7, ai_analysis=$8, estimated_cost=$9, status=$10, updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`,
      [vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, ai_analysis, estimated_cost, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM damage_assessments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
