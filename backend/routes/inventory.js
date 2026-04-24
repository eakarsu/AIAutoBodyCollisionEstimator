const router = require('express').Router();
const pool = require('../db/pool');

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, s.company_name as supplier_name
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      ORDER BY i.part_name ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, s.company_name as supplier_name
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.quantity <= i.min_quantity
      ORDER BY i.quantity ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single inventory item
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, s.company_name as supplier_name
      FROM inventory i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create inventory item
router.post('/', async (req, res) => {
  try {
    const { part_name, part_number, category, quantity, min_quantity, unit_cost, sell_price, supplier_id, location, status, last_ordered, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory (part_name, part_number, category, quantity, min_quantity, unit_cost, sell_price, supplier_id, location, status, last_ordered, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [part_name, part_number, category, quantity || 0, min_quantity || 5, unit_cost || 0, sell_price || 0, supplier_id, location, status || 'in_stock', last_ordered, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const { part_name, part_number, category, quantity, min_quantity, unit_cost, sell_price, supplier_id, location, status, last_ordered, notes } = req.body;
    const result = await pool.query(
      `UPDATE inventory SET part_name=$1, part_number=$2, category=$3, quantity=$4, min_quantity=$5, unit_cost=$6, sell_price=$7, supplier_id=$8, location=$9, status=$10, last_ordered=$11, notes=$12, updated_at=CURRENT_TIMESTAMP
       WHERE id=$13 RETURNING *`,
      [part_name, part_number, category, quantity, min_quantity, unit_cost, sell_price, supplier_id, location, status, last_ordered, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Adjust stock quantity
router.patch('/:id/stock', async (req, res) => {
  try {
    const { adjustment } = req.body;
    const result = await pool.query(
      `UPDATE inventory SET quantity = GREATEST(0, quantity + $1), updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,
      [adjustment, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
