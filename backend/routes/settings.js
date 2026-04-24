const router = require('express').Router();
const pool = require('../db/pool');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shop_settings ORDER BY category, key');
    const settings = {};
    result.rows.forEach(row => {
      if (!settings[row.category]) settings[row.category] = {};
      settings[row.category][row.key] = row.value;
    });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get settings by category
router.get('/:category', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shop_settings WHERE category = $1 ORDER BY key', [req.params.category]);
    const settings = {};
    result.rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update/create a setting (upsert)
router.put('/', async (req, res) => {
  try {
    const { key, value, category } = req.body;
    const result = await pool.query(
      `INSERT INTO shop_settings (key, value, category) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value, category || 'general']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bulk update settings
router.post('/bulk', async (req, res) => {
  try {
    const { settings } = req.body; // array of { key, value, category }
    const results = [];
    for (const s of settings) {
      const result = await pool.query(
        `INSERT INTO shop_settings (key, value, category) VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [s.key, s.value, s.category || 'general']
      );
      results.push(result.rows[0]);
    }
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete a setting
router.delete('/:key', async (req, res) => {
  try {
    await pool.query('DELETE FROM shop_settings WHERE key = $1', [req.params.key]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
