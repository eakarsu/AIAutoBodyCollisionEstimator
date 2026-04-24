const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT wo.*, c.first_name || ' ' || c.last_name as customer_name,
      v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      t.first_name || ' ' || t.last_name as technician_name
      FROM work_orders wo
      LEFT JOIN customers c ON wo.customer_id = c.id
      LEFT JOIN vehicles v ON wo.vehicle_id = v.id
      LEFT JOIN technicians t ON wo.technician_id = t.id
      ORDER BY wo.id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT wo.*, c.first_name || ' ' || c.last_name as customer_name,
      v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      t.first_name || ' ' || t.last_name as technician_name,
      ce.estimate_number
      FROM work_orders wo
      LEFT JOIN customers c ON wo.customer_id = c.id
      LEFT JOIN vehicles v ON wo.vehicle_id = v.id
      LEFT JOIN technicians t ON wo.technician_id = t.id
      LEFT JOIN cost_estimates ce ON wo.estimate_id = ce.id
      WHERE wo.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { work_order_number, customer_id, vehicle_id, estimate_id, technician_id, description, repair_type, priority, status, start_date, due_date, labor_hours_estimated, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO work_orders (work_order_number, customer_id, vehicle_id, estimate_id, technician_id, description, repair_type, priority, status, start_date, due_date, labor_hours_estimated, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [work_order_number, customer_id, vehicle_id, estimate_id, technician_id, description, repair_type, priority || 'normal', status || 'pending', start_date, due_date, labor_hours_estimated, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { work_order_number, customer_id, vehicle_id, estimate_id, technician_id, description, repair_type, priority, status, start_date, due_date, completed_date, labor_hours_estimated, labor_hours_actual, notes, ai_work_analysis } = req.body;
    const result = await pool.query(
      `UPDATE work_orders SET work_order_number=$1, customer_id=$2, vehicle_id=$3, estimate_id=$4, technician_id=$5,
       description=$6, repair_type=$7, priority=$8, status=$9, start_date=$10, due_date=$11, completed_date=$12,
       labor_hours_estimated=$13, labor_hours_actual=$14, notes=$15, ai_work_analysis=$16, updated_at=CURRENT_TIMESTAMP WHERE id=$17 RETURNING *`,
      [work_order_number, customer_id, vehicle_id, estimate_id, technician_id, description, repair_type, priority, status, start_date, due_date, completed_date, labor_hours_estimated, labor_hours_actual, notes, ai_work_analysis, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM work_orders WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
