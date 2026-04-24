const router = require('express').Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT inv.*, c.first_name || ' ' || c.last_name as customer_name,
      v.year || ' ' || v.make || ' ' || v.model as vehicle_name
      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      LEFT JOIN vehicles v ON inv.vehicle_id = v.id
      ORDER BY inv.id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT inv.*, c.first_name || ' ' || c.last_name as customer_name,
      v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      wo.work_order_number, ce.estimate_number
      FROM invoices inv
      LEFT JOIN customers c ON inv.customer_id = c.id
      LEFT JOIN vehicles v ON inv.vehicle_id = v.id
      LEFT JOIN work_orders wo ON inv.work_order_id = wo.id
      LEFT JOIN cost_estimates ce ON inv.estimate_id = ce.id
      WHERE inv.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { invoice_number, customer_id, vehicle_id, estimate_id, work_order_id, parts_total, labor_total, paint_total, other_charges, payment_method, payment_status, due_date, notes } = req.body;
    const subtotal = (parseFloat(parts_total)||0) + (parseFloat(labor_total)||0) + (parseFloat(paint_total)||0) + (parseFloat(other_charges)||0);
    const tax_rate = 0.0825;
    const tax_amount = subtotal * tax_rate;
    const total = subtotal + tax_amount;
    const result = await pool.query(
      `INSERT INTO invoices (invoice_number, customer_id, vehicle_id, estimate_id, work_order_id, parts_total, labor_total, paint_total, other_charges, subtotal, tax_rate, tax_amount, total, balance_due, payment_method, payment_status, due_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [invoice_number, customer_id, vehicle_id, estimate_id, work_order_id, parts_total||0, labor_total||0, paint_total||0, other_charges||0, subtotal, tax_rate, tax_amount, total, total, payment_method, payment_status || 'unpaid', due_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { invoice_number, customer_id, vehicle_id, estimate_id, work_order_id, parts_total, labor_total, paint_total, other_charges, amount_paid, payment_method, payment_status, due_date, paid_date, notes } = req.body;
    const subtotal = (parseFloat(parts_total)||0) + (parseFloat(labor_total)||0) + (parseFloat(paint_total)||0) + (parseFloat(other_charges)||0);
    const tax_rate = 0.0825;
    const tax_amount = subtotal * tax_rate;
    const total = subtotal + tax_amount;
    const balance_due = total - (parseFloat(amount_paid)||0);
    const result = await pool.query(
      `UPDATE invoices SET invoice_number=$1, customer_id=$2, vehicle_id=$3, estimate_id=$4, work_order_id=$5,
       parts_total=$6, labor_total=$7, paint_total=$8, other_charges=$9, subtotal=$10, tax_rate=$11, tax_amount=$12,
       total=$13, amount_paid=$14, balance_due=$15, payment_method=$16, payment_status=$17, due_date=$18, paid_date=$19, notes=$20, updated_at=CURRENT_TIMESTAMP WHERE id=$21 RETURNING *`,
      [invoice_number, customer_id, vehicle_id, estimate_id, work_order_id, parts_total, labor_total, paint_total, other_charges, subtotal, tax_rate, tax_amount, total, amount_paid||0, balance_due, payment_method, payment_status, due_date, paid_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
