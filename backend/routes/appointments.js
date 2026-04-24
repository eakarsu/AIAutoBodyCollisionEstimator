const router = require('express').Router();
const pool = require('../db/pool');

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*,
        c.first_name || ' ' || c.last_name as customer_name,
        v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
        t.first_name || ' ' || t.last_name as technician_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN technicians t ON a.technician_id = t.id
      ORDER BY a.date DESC, a.time_start ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single appointment
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*,
        c.first_name || ' ' || c.last_name as customer_name,
        v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
        t.first_name || ' ' || t.last_name as technician_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN technicians t ON a.technician_id = t.id
      WHERE a.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create appointment
router.post('/', async (req, res) => {
  try {
    const { customer_id, vehicle_id, title, appointment_type, date, time_start, time_end, technician_id, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO appointments (customer_id, vehicle_id, title, appointment_type, date, time_start, time_end, technician_id, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [customer_id, vehicle_id, title, appointment_type || 'estimate', date, time_start, time_end, technician_id, status || 'scheduled', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const { customer_id, vehicle_id, title, appointment_type, date, time_start, time_end, technician_id, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE appointments SET customer_id=$1, vehicle_id=$2, title=$3, appointment_type=$4, date=$5, time_start=$6, time_end=$7, technician_id=$8, status=$9, notes=$10, updated_at=CURRENT_TIMESTAMP
       WHERE id=$11 RETURNING *`,
      [customer_id, vehicle_id, title, appointment_type, date, time_start, time_end, technician_id, status, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
