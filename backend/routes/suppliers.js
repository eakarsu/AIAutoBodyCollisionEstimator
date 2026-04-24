const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { company_name, contact_name, email, phone, address, website, specialty, rating, lead_time_days, payment_terms, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO suppliers (company_name, contact_name, email, phone, address, website, specialty, rating, lead_time_days, payment_terms, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [company_name, contact_name, email, phone, address, website, specialty, rating || 0, lead_time_days, payment_terms, status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { company_name, contact_name, email, phone, address, website, specialty, rating, lead_time_days, payment_terms, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE suppliers SET company_name=$1, contact_name=$2, email=$3, phone=$4, address=$5,
       website=$6, specialty=$7, rating=$8, lead_time_days=$9, payment_terms=$10, status=$11, notes=$12, updated_at=CURRENT_TIMESTAMP WHERE id=$13 RETURNING *`,
      [company_name, contact_name, email, phone, address, website, specialty, rating, lead_time_days, payment_terms, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
