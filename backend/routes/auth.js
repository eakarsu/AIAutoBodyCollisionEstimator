const router = require('express').Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get('/demo-credentials', (req, res) => {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'false'
  ) {
    return res.status(404).json({ error: 'Demo credentials are unavailable' });
  }

  const email = process.env.DEMO_EMAIL || process.env.SEED_ADMIN_EMAIL;
  const password = process.env.DEMO_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    return res.status(404).json({ error: 'Demo credentials are unavailable' });
  }

  res.set('Cache-Control', 'no-store');
  return res.json({ email, password });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = $1', [decoded.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
