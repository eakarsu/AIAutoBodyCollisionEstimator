const router = require('express').Router();
const pool = require('../db/pool');

// Revenue summary
router.get('/revenue', async (req, res) => {
  try {
    const monthly = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as invoice_count,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(amount_paid), 0) as total_collected,
        COALESCE(SUM(balance_due), 0) as total_outstanding
      FROM invoices
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `);

    const byPaymentMethod = await pool.query(`
      SELECT
        COALESCE(payment_method, 'Not Specified') as method,
        COUNT(*) as count,
        COALESCE(SUM(amount_paid), 0) as total
      FROM invoices
      WHERE payment_status = 'paid'
      GROUP BY payment_method
      ORDER BY total DESC
    `);

    const totals = await pool.query(`
      SELECT
        COALESCE(SUM(total), 0) as all_time_revenue,
        COALESCE(SUM(amount_paid), 0) as all_time_collected,
        COALESCE(SUM(balance_due), 0) as all_time_outstanding,
        COUNT(*) as total_invoices,
        COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_invoices,
        COUNT(*) FILTER (WHERE payment_status != 'paid') as unpaid_invoices
      FROM invoices
    `);

    res.json({
      monthly: monthly.rows,
      byPaymentMethod: byPaymentMethod.rows,
      totals: totals.rows[0]
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Repair statistics
router.get('/repairs', async (req, res) => {
  try {
    const byStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM work_orders
      GROUP BY status
      ORDER BY count DESC
    `);

    const byType = await pool.query(`
      SELECT COALESCE(repair_type, 'Other') as type, COUNT(*) as count
      FROM work_orders
      GROUP BY repair_type
      ORDER BY count DESC
    `);

    const avgCompletionTime = await pool.query(`
      SELECT
        COALESCE(AVG(EXTRACT(DAY FROM (completed_date::timestamp - start_date::timestamp))), 0) as avg_days
      FROM work_orders
      WHERE completed_date IS NOT NULL AND start_date IS NOT NULL
    `);

    const monthlyWorkOrders = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM work_orders
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `);

    const technicianPerformance = await pool.query(`
      SELECT
        t.first_name || ' ' || t.last_name as name,
        COUNT(wo.id) as total_jobs,
        COUNT(wo.id) FILTER (WHERE wo.status = 'completed') as completed_jobs,
        COALESCE(SUM(wo.labor_hours_actual), 0) as total_hours
      FROM technicians t
      LEFT JOIN work_orders wo ON t.id = wo.technician_id
      WHERE t.status = 'active'
      GROUP BY t.id, t.first_name, t.last_name
      ORDER BY total_jobs DESC
    `);

    res.json({
      byStatus: byStatus.rows,
      byType: byType.rows,
      avgCompletionDays: parseFloat(avgCompletionTime.rows[0].avg_days).toFixed(1),
      monthly: monthlyWorkOrders.rows,
      technicianPerformance: technicianPerformance.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Claims overview
router.get('/claims', async (req, res) => {
  try {
    const byStatus = await pool.query(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(claim_amount), 0) as total_amount
      FROM insurance_claims
      GROUP BY status
      ORDER BY count DESC
    `);

    const byInsurer = await pool.query(`
      SELECT
        insurance_company,
        COUNT(*) as count,
        COALESCE(SUM(claim_amount), 0) as total_amount,
        COALESCE(AVG(claim_amount), 0) as avg_amount
      FROM insurance_claims
      GROUP BY insurance_company
      ORDER BY count DESC
    `);

    const monthly = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as total,
        COALESCE(SUM(claim_amount), 0) as total_amount
      FROM insurance_claims
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `);

    res.json({
      byStatus: byStatus.rows,
      byInsurer: byInsurer.rows,
      monthly: monthly.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Damage overview
router.get('/damage', async (req, res) => {
  try {
    const bySeverity = await pool.query(`
      SELECT
        COALESCE(severity, 'unclassified') as severity,
        COUNT(*) as count,
        COALESCE(AVG(estimated_cost), 0) as avg_cost
      FROM damage_assessments
      GROUP BY severity
      ORDER BY count DESC
    `);

    const byType = await pool.query(`
      SELECT
        COALESCE(damage_type, 'Other') as type,
        COUNT(*) as count
      FROM damage_assessments
      GROUP BY damage_type
      ORDER BY count DESC
    `);

    const monthly = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as total,
        COALESCE(SUM(estimated_cost), 0) as total_cost
      FROM damage_assessments
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `);

    res.json({
      bySeverity: bySeverity.rows,
      byType: byType.rows,
      monthly: monthly.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
