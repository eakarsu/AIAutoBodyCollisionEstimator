const router = require('express').Router();
const pool = require('../db/pool');

router.get('/stats', async (req, res) => {
  try {
    const [customers, vehicles, assessments, claims, timelines, estimates, technicians, suppliers, workOrders, invoices, photos] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM customers'),
      pool.query('SELECT COUNT(*) as count FROM vehicles'),
      pool.query('SELECT COUNT(*) as count FROM damage_assessments'),
      pool.query('SELECT COUNT(*) as count FROM insurance_claims'),
      pool.query('SELECT COUNT(*) as count FROM repair_timelines'),
      pool.query('SELECT COUNT(*) as count FROM cost_estimates'),
      pool.query('SELECT COUNT(*) as count FROM technicians'),
      pool.query('SELECT COUNT(*) as count FROM suppliers'),
      pool.query('SELECT COUNT(*) as count FROM work_orders'),
      pool.query('SELECT COUNT(*) as count FROM invoices'),
      pool.query('SELECT COUNT(*) as count FROM photos'),
    ]);

    const activeRepairs = await pool.query("SELECT COUNT(*) as count FROM repair_timelines WHERE status IN ('in_progress', 'scheduled')");
    const pendingClaims = await pool.query("SELECT COUNT(*) as count FROM insurance_claims WHERE status IN ('filed', 'in_review')");
    const totalRevenue = await pool.query("SELECT COALESCE(SUM(total), 0) as total FROM cost_estimates WHERE status IN ('approved', 'completed')");
    const unpaidInvoices = await pool.query("SELECT COALESCE(SUM(balance_due), 0) as total FROM invoices WHERE payment_status != 'paid'");
    const activeWorkOrders = await pool.query("SELECT COUNT(*) as count FROM work_orders WHERE status IN ('pending', 'in_progress')");

    res.json({
      customers: parseInt(customers.rows[0].count),
      vehicles: parseInt(vehicles.rows[0].count),
      assessments: parseInt(assessments.rows[0].count),
      claims: parseInt(claims.rows[0].count),
      timelines: parseInt(timelines.rows[0].count),
      estimates: parseInt(estimates.rows[0].count),
      technicians: parseInt(technicians.rows[0].count),
      suppliers: parseInt(suppliers.rows[0].count),
      workOrders: parseInt(workOrders.rows[0].count),
      invoices: parseInt(invoices.rows[0].count),
      photos: parseInt(photos.rows[0].count),
      activeRepairs: parseInt(activeRepairs.rows[0].count),
      pendingClaims: parseInt(pendingClaims.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
      unpaidInvoices: parseFloat(unpaidInvoices.rows[0].total),
      activeWorkOrders: parseInt(activeWorkOrders.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
