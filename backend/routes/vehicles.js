const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const wantsPagination = req.query.page !== undefined || req.query.paginated === 'true' || req.query.limit !== undefined;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    if (!wantsPagination) {
      const all = await pool.query(`
        SELECT v.*, c.first_name || ' ' || c.last_name as customer_name
        FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id ORDER BY v.id DESC
      `);
      return res.json(all.rows);
    }

    const result = await pool.query(`
      SELECT v.*, c.first_name || ' ' || c.last_name as customer_name
      FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id
      ORDER BY v.id DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM vehicles');
    res.json({
      data: result.rows,
      pagination: {
        page, limit,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
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
