const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, insurance_provider, policy_number } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (first_name, last_name, email, phone, address, insurance_provider, policy_number) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [first_name, last_name, email, phone, address, insurance_provider, policy_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, insurance_provider, policy_number } = req.body;
    const result = await pool.query(
      'UPDATE customers SET first_name=$1, last_name=$2, email=$3, phone=$4, address=$5, insurance_provider=$6, policy_number=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8 RETURNING *',
      [first_name, last_name, email, phone, address, insurance_provider, policy_number, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
