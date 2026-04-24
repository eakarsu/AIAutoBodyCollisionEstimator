const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, c.first_name || ' ' || c.last_name as customer_name
      FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id ORDER BY v.id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, c.first_name || ' ' || c.last_name as customer_name
      FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id WHERE v.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { customer_id, year, make, model, trim_level, vin, color, mileage, license_plate } = req.body;
    const result = await pool.query(
      'INSERT INTO vehicles (customer_id, year, make, model, trim_level, vin, color, mileage, license_plate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [customer_id, year, make, model, trim_level, vin, color, mileage, license_plate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { customer_id, year, make, model, trim_level, vin, color, mileage, license_plate } = req.body;
    const result = await pool.query(
      'UPDATE vehicles SET customer_id=$1, year=$2, make=$3, model=$4, trim_level=$5, vin=$6, color=$7, mileage=$8, license_plate=$9, updated_at=CURRENT_TIMESTAMP WHERE id=$10 RETURNING *',
      [customer_id, year, make, model, trim_level, vin, color, mileage, license_plate, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
