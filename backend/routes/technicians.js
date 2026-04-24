const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM technicians ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM technicians WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, specialization, certification_level, hourly_rate, years_experience, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO technicians (first_name, last_name, email, phone, specialization, certification_level, hourly_rate, years_experience, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [first_name, last_name, email, phone, specialization, certification_level, hourly_rate || 75, years_experience, status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, specialization, certification_level, hourly_rate, years_experience, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE technicians SET first_name=$1, last_name=$2, email=$3, phone=$4, specialization=$5,
       certification_level=$6, hourly_rate=$7, years_experience=$8, status=$9, notes=$10, updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`,
      [first_name, last_name, email, phone, specialization, certification_level, hourly_rate, years_experience, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM technicians WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
