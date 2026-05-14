const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');

// ── Rate limiter: 20 AI-related requests per hour per user ────────────────
const { ipKeyGenerator } = require('express-rate-limit');
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'autobody-secret-key-2024');
        return `user:${decoded.id}`;
      } catch (e) { /* fall through to IP */ }
    }
    return ipKeyGenerator(req, res);
  },
  message: { error: 'Rate limit exceeded. Maximum 20 AI requests per hour.' }
});

const VALID_SEVERITIES = ['minor', 'moderate', 'severe', 'total_loss'];

const assessmentValidation = [
  body('vehicle_make').optional().isLength({ max: 50 }).withMessage('vehicle_make must not exceed 50 characters'),
  body('description')
    .notEmpty().withMessage('description is required')
    .isLength({ min: 20 }).withMessage('description must be at least 20 characters')
    .isLength({ max: 2000 }).withMessage('description must not exceed 2000 characters'),
  body('severity')
    .notEmpty().withMessage('severity is required')
    .isIn(VALID_SEVERITIES).withMessage(`severity must be one of: ${VALID_SEVERITIES.join(', ')}`)
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg) });
  }
  next();
};

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query(`
        SELECT da.*, v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
        c.first_name || ' ' || c.last_name as customer_name
        FROM damage_assessments da
        LEFT JOIN vehicles v ON da.vehicle_id = v.id
        LEFT JOIN customers c ON da.customer_id = c.id
        ORDER BY da.id DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
      pool.query('SELECT COUNT(*) as total FROM damage_assessments')
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT da.*, v.year || ' ' || v.make || ' ' || v.model as vehicle_name,
      c.first_name || ' ' || c.last_name as customer_name
      FROM damage_assessments da
      LEFT JOIN vehicles v ON da.vehicle_id = v.id
      LEFT JOIN customers c ON da.customer_id = c.id
      WHERE da.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', assessmentValidation, handleValidationErrors, async (req, res) => {
  try {
    const { vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, estimated_cost, status } = req.body;
    const result = await pool.query(
      `INSERT INTO damage_assessments (vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, estimated_cost, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, estimated_cost || 0, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, ai_analysis, estimated_cost, status } = req.body;
    const result = await pool.query(
      `UPDATE damage_assessments SET vehicle_id=$1, customer_id=$2, description=$3, damage_type=$4, severity=$5,
       location_on_vehicle=$6, photo_url=$7, ai_analysis=$8, estimated_cost=$9, status=$10, updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`,
      [vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, photo_url, ai_analysis, estimated_cost, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM damage_assessments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted', item: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
