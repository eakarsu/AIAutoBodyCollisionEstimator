const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ic.*, c.first_name || ' ' || c.last_name as customer_name,
      v.year || ' ' || v.make || ' ' || v.model as vehicle_name
      FROM insurance_claims ic
      LEFT JOIN customers c ON ic.customer_id = c.id
      LEFT JOIN vehicles v ON ic.vehicle_id = v.id
      ORDER BY ic.id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ic.*, c.first_name || ' ' || c.last_name as customer_name,
      v.year || ' ' || v.make || ' ' || v.model as vehicle_name
      FROM insurance_claims ic
      LEFT JOIN customers c ON ic.customer_id = c.id
      LEFT JOIN vehicles v ON ic.vehicle_id = v.id
      WHERE ic.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { claim_number, customer_id, vehicle_id, insurance_company, adjuster_name, adjuster_phone, adjuster_email, date_of_loss, loss_description, claim_amount, deductible, status } = req.body;
    const result = await pool.query(
      `INSERT INTO insurance_claims (claim_number, customer_id, vehicle_id, insurance_company, adjuster_name, adjuster_phone, adjuster_email, date_of_loss, loss_description, claim_amount, deductible, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [claim_number, customer_id, vehicle_id, insurance_company, adjuster_name, adjuster_phone, adjuster_email, date_of_loss, loss_description, claim_amount, deductible, status || 'filed']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { claim_number, customer_id, vehicle_id, insurance_company, adjuster_name, adjuster_phone, adjuster_email, date_of_loss, loss_description, claim_amount, deductible, status, ai_recommendation } = req.body;
    const result = await pool.query(
      `UPDATE insurance_claims SET claim_number=$1, customer_id=$2, vehicle_id=$3, insurance_company=$4, adjuster_name=$5,
       adjuster_phone=$6, adjuster_email=$7, date_of_loss=$8, loss_description=$9, claim_amount=$10, deductible=$11, status=$12, ai_recommendation=$13, updated_at=CURRENT_TIMESTAMP WHERE id=$14 RETURNING *`,
      [claim_number, customer_id, vehicle_id, insurance_company, adjuster_name, adjuster_phone, adjuster_email, date_of_loss, loss_description, claim_amount, deductible, status, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM insurance_claims WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
