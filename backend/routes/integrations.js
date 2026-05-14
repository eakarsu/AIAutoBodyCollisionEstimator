// Apply pass 5 — Backlog integrations (additive only)
//
// Implements the remaining backlog items from _AUDIT_NOTE.md as gated
// integration endpoints. All vendor calls are stubbed and gate on
// environment credentials per the apply pass 5 protocol:
//
//   NEEDS-CREDS:
//     - VIN_DECODER_API_KEY        (NHTSA / commercial VIN service)
//     - PARTS_SUPPLIER_API_KEY     (AutoZone / RockAuto / generic)
//     - INSURANCE_API_KEY          (Per-carrier; we use a generic key)
//     - OEM_API_KEY                (Tesla / Ford / GM manufacturer APIs)
//
//   NEEDS-PRODUCT-DECISION:
//     - Recycled parts marketplace: PRODUCT-DECISION: We expose a self-hosted
//       /recycled-parts/* CRUD on a NEW table `recycled_parts_listings`
//       (CREATE TABLE IF NOT EXISTS); supplier onboarding is via direct
//       row insert by authenticated users. No external supplier broker.
//
//   TOO-RISKY:
//     - Computer-vision damage analysis: kept TEXT-ONLY — accepts
//       `image_description` (or photo URLs treated as captions) and uses the
//       existing OpenRouter text model. No image-modal model integration
//       and no schema changes to the photos table.
//
// Auth + rate limiting are inherited because this router is mounted at
// /api/ai-integrations and reuses the same JWT/aiLimiter pattern as ai.js.

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const pool = require('../db/pool');
const { queryOpenRouter, parseAIJson } = require('../services/openrouter');

// ── ai_results persistence (table created lazily by ai.js, but be safe) ──
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      endpoint VARCHAR(120) NOT NULL,
      input_data JSONB NOT NULL,
      result_data JSONB NOT NULL,
      user_id INTEGER,
      model_used VARCHAR(255),
      tokens_used INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recycled_parts_listings (
      id SERIAL PRIMARY KEY,
      part_name VARCHAR(255) NOT NULL,
      part_number VARCHAR(120),
      vehicle_make VARCHAR(120),
      vehicle_model VARCHAR(120),
      year_range VARCHAR(40),
      condition VARCHAR(40),
      asking_price NUMERIC(10,2),
      seller_contact VARCHAR(255),
      location VARCHAR(255),
      notes TEXT,
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS insurance_submissions (
      id SERIAL PRIMARY KEY,
      claim_id INTEGER,
      carrier VARCHAR(120),
      external_reference VARCHAR(255),
      payload JSONB,
      response JSONB,
      status VARCHAR(40) DEFAULT 'pending',
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => {});
}
ensureTables();

function getUserId(req) {
  const auth = req.headers['authorization'];
  if (!auth) return null;
  try {
    const jwt = require('jsonwebtoken');
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'autobody-secret-key-2024');
    return decoded.id || decoded.userId || null;
  } catch (_) { return null; }
}

async function persist(endpoint, input, result, req) {
  try {
    await pool.query(
      `INSERT INTO ai_results (endpoint, input_data, result_data, user_id, model_used, tokens_used)
       VALUES ($1, $2::jsonb, $3::jsonb, $4, $5, $6)`,
      [endpoint, JSON.stringify(input), JSON.stringify(result), getUserId(req), result?.model || null, result?.usage?.total_tokens || null]
    );
  } catch (_) {}
}

// Same rate limit as /api/ai
const intLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
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
      } catch (_) {}
    }
    return ipKeyGenerator(req, res);
  },
  message: { error: 'Integration rate limit exceeded.' }
});
router.use(intLimiter);

// ──────────────────────────────────────────────────────────────────────
// 1. VIN decoder integration  (NEEDS-CREDS: VIN_DECODER_API_KEY)
// ──────────────────────────────────────────────────────────────────────
router.post('/vin/decode', async (req, res) => {
  if (!process.env.VIN_DECODER_API_KEY) {
    return res.status(503).json({
      error: 'VIN decoder not configured',
      missing: 'VIN_DECODER_API_KEY'
    });
  }
  try {
    const { vin } = req.body || {};
    if (!vin || typeof vin !== 'string' || vin.length !== 17) {
      return res.status(400).json({ error: 'vin must be a 17-character string' });
    }
    // Stub: real implementation would call NHTSA vPIC or commercial VIN API.
    // We return a structured response derived from the VIN character set.
    const decoded = {
      vin,
      world_manufacturer: vin.slice(0, 3),
      vehicle_descriptor: vin.slice(3, 9),
      check_digit: vin.charAt(8),
      model_year_code: vin.charAt(9),
      plant_code: vin.charAt(10),
      serial: vin.slice(11),
      source: 'stub:VIN_DECODER_API_KEY-present',
    };
    await persist('vin-decode', { vin }, decoded, req);
    res.json({ success: true, ...decoded });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────────────────────────────
// 2. Real-time parts pricing  (NEEDS-CREDS: PARTS_SUPPLIER_API_KEY)
// ──────────────────────────────────────────────────────────────────────
router.post('/parts/realtime-pricing', async (req, res) => {
  if (!process.env.PARTS_SUPPLIER_API_KEY) {
    return res.status(503).json({
      error: 'Parts supplier integration not configured',
      missing: 'PARTS_SUPPLIER_API_KEY'
    });
  }
  try {
    const { part_number, vehicle_make, vehicle_model, vehicle_year } = req.body || {};
    if (!part_number) return res.status(400).json({ error: 'part_number is required' });
    // Stub: would query AutoZone/RockAuto/PartsTech APIs.
    const quotes = [
      { supplier: 'AutoZone', price: 145.99, in_stock: true, eta_days: 1 },
      { supplier: 'RockAuto', price: 119.50, in_stock: true, eta_days: 3 },
      { supplier: 'PartsGeek', price: 132.00, in_stock: false, eta_days: 7 }
    ];
    const data = {
      part_number,
      vehicle: { make: vehicle_make, model: vehicle_model, year: vehicle_year },
      quotes,
      lowest: quotes.reduce((a, b) => (a.price < b.price ? a : b)),
      source: 'stub:PARTS_SUPPLIER_API_KEY-present'
    };
    await persist('parts-realtime-pricing', { part_number }, data, req);
    res.json({ success: true, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────────────────────────────
// 3. Insurance API direct submission  (NEEDS-CREDS: INSURANCE_API_KEY)
// ──────────────────────────────────────────────────────────────────────
router.post('/insurance/submit-claim', async (req, res) => {
  if (!process.env.INSURANCE_API_KEY) {
    return res.status(503).json({
      error: 'Insurance API not configured',
      missing: 'INSURANCE_API_KEY'
    });
  }
  try {
    const { claim_id, carrier, payload } = req.body || {};
    if (!carrier) return res.status(400).json({ error: 'carrier is required' });
    const externalRef = `EXT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const responseStub = { accepted: true, external_reference: externalRef, eta_review_days: 3 };
    const result = await pool.query(
      `INSERT INTO insurance_submissions (claim_id, carrier, external_reference, payload, response, status, user_id)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, 'submitted', $6) RETURNING *`,
      [claim_id || null, carrier, externalRef, JSON.stringify(payload || {}), JSON.stringify(responseStub), getUserId(req)]
    );
    res.json({ success: true, submission: result.rows[0], source: 'stub:INSURANCE_API_KEY-present' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// List submissions (audit trail)
router.get('/insurance/submissions', async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM insurance_submissions ORDER BY id DESC LIMIT 100`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────────────────────────────
// 4. OEM / Tesla integration  (NEEDS-CREDS: OEM_API_KEY)
// ──────────────────────────────────────────────────────────────────────
router.post('/oem/spec-lookup', async (req, res) => {
  if (!process.env.OEM_API_KEY) {
    return res.status(503).json({
      error: 'OEM integration not configured',
      missing: 'OEM_API_KEY'
    });
  }
  try {
    const { make, model, year, trim } = req.body || {};
    if (!make) return res.status(400).json({ error: 'make is required' });
    const data = {
      make, model, year, trim,
      oem_specs: {
        body_panels: ['hood', 'fenders', 'doors', 'trunk'],
        recommended_repair_procedures_url: `https://oem-portal.example/${(make || '').toLowerCase()}/${year || ''}/${(model || '').toLowerCase()}`,
        warranty_status: 'unknown_until_VIN_provided'
      },
      source: 'stub:OEM_API_KEY-present'
    };
    res.json({ success: true, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────────────────────────────
// 5. Recycled parts marketplace  (NEEDS-PRODUCT-DECISION)
// PRODUCT-DECISION: Self-hosted listings table; authenticated users post
// listings; no external broker. Future: add reviews, transactional escrow.
// ──────────────────────────────────────────────────────────────────────
router.get('/recycled-parts', async (req, res) => {
  try {
    const { vehicle_make, vehicle_model, part_name } = req.query;
    let q = 'SELECT * FROM recycled_parts_listings WHERE 1=1';
    const params = [];
    if (vehicle_make) { params.push(vehicle_make); q += ` AND vehicle_make ILIKE '%' || $${params.length} || '%'`; }
    if (vehicle_model) { params.push(vehicle_model); q += ` AND vehicle_model ILIKE '%' || $${params.length} || '%'`; }
    if (part_name) { params.push(part_name); q += ` AND part_name ILIKE '%' || $${params.length} || '%'`; }
    q += ' ORDER BY id DESC LIMIT 200';
    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/recycled-parts', async (req, res) => {
  try {
    const {
      part_name, part_number, vehicle_make, vehicle_model, year_range,
      condition, asking_price, seller_contact, location, notes
    } = req.body || {};
    if (!part_name) return res.status(400).json({ error: 'part_name is required' });
    const r = await pool.query(
      `INSERT INTO recycled_parts_listings
       (part_name, part_number, vehicle_make, vehicle_model, year_range,
        condition, asking_price, seller_contact, location, notes, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [part_name, part_number || null, vehicle_make || null, vehicle_model || null,
       year_range || null, condition || null, asking_price || null,
       seller_contact || null, location || null, notes || null, getUserId(req)]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/recycled-parts/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM recycled_parts_listings WHERE id=$1 RETURNING *', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, deleted: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────────────────────────────
// 6. Computer-vision damage analysis  (TOO-RISKY → text-only stub)
// PRODUCT-DECISION: We accept image_description (or photo URLs treated as
// captions) and route through the existing text-only OpenRouter flow.
// No vision-model integration, no photos schema changes.
// ──────────────────────────────────────────────────────────────────────
router.post('/vision/damage-analysis', async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({
      error: 'AI provider not configured',
      missing: 'OPENROUTER_API_KEY'
    });
  }
  try {
    const { image_description, image_urls, vehicle_info } = req.body || {};
    const captionsBlob = (image_urls && Array.isArray(image_urls) ? image_urls.join('\n') : '');
    if (!image_description && !captionsBlob) {
      return res.status(400).json({ error: 'image_description or image_urls required' });
    }
    const messages = [
      { role: 'system', content: `You are a damage-analysis assistant. Given a textual description of damage photos, infer affected components, severity, and approximate repair categories. Respond ONLY with JSON:
{
  "components_affected":["..."],
  "severity":"minor|moderate|severe|total",
  "repair_categories":["body|paint|structural|mechanical|electrical|interior"],
  "confidence":"low|medium|high",
  "summary":"..."
}` },
      { role: 'user', content: `Vehicle: ${vehicle_info || 'Unknown'}
Image Description: ${image_description || ''}
Photo URLs:
${captionsBlob}` }
    ];
    const r = await queryOpenRouter(messages, { maxTokens: 1500 });
    if (r.error) return res.status(502).json({ error: r.content });
    const parsed = parseAIJson(r.content);
    const data = parsed.ok ? parsed.data : { raw_response: r.content };
    await persist('vision-damage-analysis', { vehicle_info, has_description: !!image_description, n_urls: (image_urls||[]).length }, { ...data, model: r.model, usage: r.usage }, req);
    res.json({ success: true, ...data, model: r.model, note: 'text-only inference; no vision model used' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
