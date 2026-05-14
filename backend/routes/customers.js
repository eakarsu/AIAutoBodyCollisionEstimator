const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const wantsPagination = req.query.page !== undefined || req.query.paginated === 'true' || req.query.limit !== undefined;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const search = req.query.search || null;

    const conds = [];
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    if (!wantsPagination) {
      const all = await pool.query(`SELECT * FROM customers ${where} ORDER BY id DESC`, params);
      return res.json(all.rows);
    }

    const cParams = [...params];
    params.push(limit); const lp = `$${params.length}`;
    params.push(offset); const op = `$${params.length}`;
    const result = await pool.query(
      `SELECT * FROM customers ${where} ORDER BY id DESC LIMIT ${lp} OFFSET ${op}`,
      params
    );
    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM customers ${where}`, cParams);

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
