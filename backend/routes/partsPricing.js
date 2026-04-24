const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parts_pricing ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parts_pricing WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { part_number, part_name, category, oem_price, aftermarket_price, labor_hours, labor_rate, vehicle_make, vehicle_model, year_range, supplier, in_stock } = req.body;
    const result = await pool.query(
      `INSERT INTO parts_pricing (part_number, part_name, category, oem_price, aftermarket_price, labor_hours, labor_rate, vehicle_make, vehicle_model, year_range, supplier, in_stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [part_number, part_name, category, oem_price, aftermarket_price, labor_hours, labor_rate || 75, vehicle_make, vehicle_model, year_range, supplier, in_stock !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { part_number, part_name, category, oem_price, aftermarket_price, labor_hours, labor_rate, vehicle_make, vehicle_model, year_range, supplier, in_stock } = req.body;
    const result = await pool.query(
      `UPDATE parts_pricing SET part_number=$1, part_name=$2, category=$3, oem_price=$4, aftermarket_price=$5,
       labor_hours=$6, labor_rate=$7, vehicle_make=$8, vehicle_model=$9, year_range=$10, supplier=$11, in_stock=$12, updated_at=CURRENT_TIMESTAMP WHERE id=$13 RETURNING *`,
      [part_number, part_name, category, oem_price, aftermarket_price, labor_hours, labor_rate, vehicle_make, vehicle_model, year_range, supplier, in_stock, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM parts_pricing WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
