const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ce.*, c.first_name || ' ' || c.last_name as customer_name,
      v.year || ' ' || v.make || ' ' || v.model as vehicle_name
      FROM cost_estimates ce
      LEFT JOIN customers c ON ce.customer_id = c.id
      LEFT JOIN vehicles v ON ce.vehicle_id = v.id
      ORDER BY ce.id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ce.*, c.first_name || ' ' || c.last_name as customer_name,
      v.year || ' ' || v.make || ' ' || v.model as vehicle_name
      FROM cost_estimates ce
      LEFT JOIN customers c ON ce.customer_id = c.id
      LEFT JOIN vehicles v ON ce.vehicle_id = v.id
      WHERE ce.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { estimate_number, customer_id, vehicle_id, damage_assessment_id, parts_cost, labor_cost, paint_cost, additional_cost, notes, status } = req.body;
    const subtotal = (parseFloat(parts_cost)||0) + (parseFloat(labor_cost)||0) + (parseFloat(paint_cost)||0) + (parseFloat(additional_cost)||0);
    const tax_rate = 0.0825;
    const tax_amount = subtotal * tax_rate;
    const total = subtotal + tax_amount;
    const result = await pool.query(
      `INSERT INTO cost_estimates (estimate_number, customer_id, vehicle_id, damage_assessment_id, parts_cost, labor_cost, paint_cost, additional_cost, subtotal, tax_rate, tax_amount, total, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [estimate_number, customer_id, vehicle_id, damage_assessment_id, parts_cost||0, labor_cost||0, paint_cost||0, additional_cost||0, subtotal, tax_rate, tax_amount, total, status || 'draft', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { estimate_number, customer_id, vehicle_id, damage_assessment_id, parts_cost, labor_cost, paint_cost, additional_cost, notes, status, ai_cost_analysis } = req.body;
    const subtotal = (parseFloat(parts_cost)||0) + (parseFloat(labor_cost)||0) + (parseFloat(paint_cost)||0) + (parseFloat(additional_cost)||0);
    const tax_rate = 0.0825;
    const tax_amount = subtotal * tax_rate;
    const total = subtotal + tax_amount;
    const result = await pool.query(
      `UPDATE cost_estimates SET estimate_number=$1, customer_id=$2, vehicle_id=$3, damage_assessment_id=$4, parts_cost=$5,
       labor_cost=$6, paint_cost=$7, additional_cost=$8, subtotal=$9, tax_rate=$10, tax_amount=$11, total=$12, status=$13, notes=$14, ai_cost_analysis=$15, updated_at=CURRENT_TIMESTAMP WHERE id=$16 RETURNING *`,
      [estimate_number, customer_id, vehicle_id, damage_assessment_id, parts_cost, labor_cost, paint_cost, additional_cost, subtotal, tax_rate, tax_amount, total, status, notes, ai_cost_analysis, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cost_estimates WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
