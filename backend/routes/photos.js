const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      c.first_name || ' ' || c.last_name as customer_name
      FROM photos p
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      LEFT JOIN customers c ON p.customer_id = c.id
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      c.first_name || ' ' || c.last_name as customer_name
      FROM photos p
      LEFT JOIN vehicles v ON p.vehicle_id = v.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { damage_assessment_id, vehicle_id, customer_id, title, description, photo_url, photo_type, taken_date, tags } = req.body;
    const result = await pool.query(
      `INSERT INTO photos (damage_assessment_id, vehicle_id, customer_id, title, description, photo_url, photo_type, taken_date, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [damage_assessment_id, vehicle_id, customer_id, title, description, photo_url, photo_type || 'damage', taken_date, tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { damage_assessment_id, vehicle_id, customer_id, title, description, photo_url, photo_type, taken_date, tags } = req.body;
    const result = await pool.query(
      `UPDATE photos SET damage_assessment_id=$1, vehicle_id=$2, customer_id=$3, title=$4, description=$5,
       photo_url=$6, photo_type=$7, taken_date=$8, tags=$9 WHERE id=$10 RETURNING *`,
      [damage_assessment_id, vehicle_id, customer_id, title, description, photo_url, photo_type, taken_date, tags, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
