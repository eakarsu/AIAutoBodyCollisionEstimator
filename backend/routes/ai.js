const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { queryOpenRouter, parseAIJson } = require('../services/openrouter');
const pool = require('../db/pool');

// ── ai_results JSONB persistence (lazy) ─────────────────────────────────
async function ensureAIResultsTable() {
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
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ai_results_endpoint ON ai_results(endpoint)`).catch(() => {});
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at DESC)`).catch(() => {});
}
ensureAIResultsTable();

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
  } catch (err) {
    console.error('[ai_results] persist error:', err.message);
  }
}

// ── Rate limiter: 20 AI requests per hour per JWT user ID ─────────────────
const { ipKeyGenerator } = require('express-rate-limit');
const aiLimiter = rateLimit({
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
      } catch (e) { /* fall through */ }
    }
    return ipKeyGenerator(req, res);
  },
  message: { error: 'AI rate limit exceeded. Maximum 20 requests per hour.' }
});

router.use(aiLimiter);

// AI Damage Assessment Analysis
router.post('/analyze-damage', async (req, res) => {
  try {
    const { description, damage_type, severity, location_on_vehicle, vehicle_info } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body collision damage assessor. Analyze the damage described and provide a professional assessment. Structure your response with clear sections:
        1. **Damage Summary** - Brief overview
        2. **Severity Assessment** - Detailed severity analysis
        3. **Affected Components** - List all parts likely affected
        4. **Recommended Repairs** - Step by step repair plan
        5. **Estimated Cost Range** - Low to high cost estimate
        6. **Safety Concerns** - Any safety issues to address
        7. **Insurance Notes** - Tips for the insurance claim`
      },
      {
        role: 'user',
        content: `Please analyze this vehicle damage:
        Vehicle: ${vehicle_info || 'Not specified'}
        Damage Type: ${damage_type || 'Not specified'}
        Severity: ${severity || 'Not specified'}
        Location: ${location_on_vehicle || 'Not specified'}
        Description: ${description}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Parts Price Lookup
router.post('/parts-lookup', async (req, res) => {
  try {
    const { part_name, vehicle_make, vehicle_model, vehicle_year } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto parts pricing specialist. Provide detailed pricing information for the requested part. Structure your response with:
        1. **Part Information** - Part details and specifications
        2. **OEM Price Estimate** - Original equipment manufacturer price
        3. **Aftermarket Options** - Alternative part options and prices
        4. **Labor Estimate** - Estimated labor hours and cost
        5. **Availability** - Typical availability and lead times
        6. **Compatibility Notes** - Fitment and compatibility information
        7. **Recommendation** - Best value recommendation`
      },
      {
        role: 'user',
        content: `Look up pricing for: ${part_name}
        Vehicle: ${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Insurance Claim Preparation
router.post('/prepare-claim', async (req, res) => {
  try {
    const { loss_description, vehicle_info, damage_details, insurance_company } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert insurance claims specialist for auto body repairs. Help prepare a comprehensive insurance claim. Structure your response with:
        1. **Claim Summary** - Professional summary for the adjuster
        2. **Damage Documentation** - How to document this damage
        3. **Required Photos** - List of photos to take
        4. **Supporting Documents** - Documents needed
        5. **Estimated Claim Value** - Realistic claim value range
        6. **Negotiation Tips** - Tips for maximizing the claim
        7. **Timeline** - Expected claim processing timeline
        8. **Common Pitfalls** - What to avoid`
      },
      {
        role: 'user',
        content: `Help prepare an insurance claim:
        Insurance Company: ${insurance_company || 'Not specified'}
        Vehicle: ${vehicle_info || 'Not specified'}
        Loss Description: ${loss_description}
        Damage Details: ${damage_details || 'Not specified'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Repair Timeline Estimation
router.post('/estimate-timeline', async (req, res) => {
  try {
    const { repair_type, description, severity, vehicle_info } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body repair shop manager with deep knowledge of repair timelines. Provide a detailed repair timeline estimate. Structure your response with:
        1. **Timeline Overview** - Total estimated days
        2. **Repair Phases** - Breakdown of each phase with days
           - Disassembly & Inspection
           - Parts Ordering
           - Body Work
           - Paint & Finishing
           - Reassembly
           - Quality Check
        3. **Critical Path Items** - What could cause delays
        4. **Parts Availability Impact** - How parts affect timeline
        5. **Rental Car Duration** - Recommended rental period
        6. **Rush Options** - Ways to expedite if needed
        7. **Customer Communication** - Suggested update schedule`
      },
      {
        role: 'user',
        content: `Estimate repair timeline for:
        Vehicle: ${vehicle_info || 'Not specified'}
        Repair Type: ${repair_type || 'Not specified'}
        Description: ${description}
        Severity: ${severity || 'Not specified'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Cost Analysis
router.post('/analyze-cost', async (req, res) => {
  try {
    const { parts_cost, labor_cost, paint_cost, additional_cost, vehicle_info, damage_description } = req.body;
    const total = (parseFloat(parts_cost)||0) + (parseFloat(labor_cost)||0) + (parseFloat(paint_cost)||0) + (parseFloat(additional_cost)||0);
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body cost analyst. Review the repair estimate and provide professional analysis. Structure your response with:
        1. **Cost Summary** - Overview of the estimate
        2. **Cost Breakdown Analysis** - Is each category reasonable?
        3. **Market Comparison** - How does this compare to market rates?
        4. **Savings Opportunities** - Where costs could be reduced
        5. **Value Assessment** - Is the repair worth it vs vehicle value?
        6. **Hidden Costs Warning** - Potential additional costs to expect
        7. **Recommendation** - Final recommendation`
      },
      {
        role: 'user',
        content: `Analyze this repair cost estimate:
        Vehicle: ${vehicle_info || 'Not specified'}
        Damage: ${damage_description || 'Not specified'}
        Parts Cost: $${parts_cost || 0}
        Labor Cost: $${labor_cost || 0}
        Paint Cost: $${paint_cost || 0}
        Additional: $${additional_cost || 0}
        Total: $${total.toFixed(2)}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Vehicle Valuation
router.post('/vehicle-valuation', async (req, res) => {
  try {
    const { year, make, model, trim_level, mileage, color, condition } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert vehicle valuation specialist. Provide a comprehensive vehicle value assessment. Structure your response with:
        1. **Vehicle Overview** - Year, make, model details
        2. **Estimated Market Value** - Current fair market value range
        3. **Value Factors** - What affects this vehicle's value
        4. **Condition Assessment** - Impact of condition on value
        5. **Mileage Impact** - How mileage affects value
        6. **Total Loss Threshold** - At what repair cost is it a total loss
        7. **Recommendation** - Repair vs replace guidance`
      },
      {
        role: 'user',
        content: `Valuate this vehicle:
        Year: ${year}, Make: ${make}, Model: ${model}
        Trim: ${trim_level || 'Base'}
        Mileage: ${mileage || 'Unknown'}
        Color: ${color || 'Unknown'}
        Condition: ${condition || 'Fair'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Work Order Analysis
router.post('/analyze-work-order', async (req, res) => {
  try {
    const { description, repair_type, vehicle_info, labor_hours_estimated, technician_name } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body shop operations manager. Analyze this work order and provide optimization recommendations. Structure your response with:
        1. **Work Order Summary** - Overview of the repair work
        2. **Task Breakdown** - Detailed step-by-step repair tasks
        3. **Labor Analysis** - Are the estimated hours reasonable?
        4. **Technician Fit** - Is the assigned tech right for this job?
        5. **Quality Checkpoints** - Key quality checks during repair
        6. **Potential Complications** - What could go wrong
        7. **Optimization Tips** - How to complete more efficiently
        8. **Customer Communication** - Key milestones to update customer`
      },
      {
        role: 'user',
        content: `Analyze this work order:
        Vehicle: ${vehicle_info || 'Not specified'}
        Repair Type: ${repair_type || 'Not specified'}
        Description: ${description}
        Estimated Labor Hours: ${labor_hours_estimated || 'Not specified'}
        Assigned Technician: ${technician_name || 'Not assigned'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Supplier Evaluation
router.post('/evaluate-supplier', async (req, res) => {
  try {
    const { company_name, specialty, rating, lead_time_days, payment_terms } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body supply chain manager. Evaluate this supplier and provide recommendations. Structure your response with:
        1. **Supplier Overview** - Summary of the supplier
        2. **Strengths** - What they do well
        3. **Weaknesses** - Areas of concern
        4. **Lead Time Assessment** - Is lead time competitive?
        5. **Pricing Competitiveness** - How do they compare?
        6. **Reliability Score** - Expected reliability rating
        7. **Negotiation Tips** - How to get better terms
        8. **Recommendation** - Should you use this supplier?`
      },
      {
        role: 'user',
        content: `Evaluate this supplier:
        Company: ${company_name}
        Specialty: ${specialty || 'General'}
        Current Rating: ${rating || 'N/A'}/5
        Lead Time: ${lead_time_days || 'Unknown'} days
        Payment Terms: ${payment_terms || 'Not specified'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Technician Skill Match
router.post('/technician-match', async (req, res) => {
  try {
    const { specialization, certification_level, years_experience, repair_description } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body shop HR manager and operations specialist. Evaluate this technician's skills and provide career development guidance. Structure your response with:
        1. **Skill Assessment** - Current capability overview
        2. **Certification Value** - How valuable are their certifications?
        3. **Experience Rating** - How their experience stacks up
        4. **Best Suited Repairs** - Types of repairs they excel at
        5. **Growth Areas** - Skills they should develop
        6. **Training Recommendations** - Specific courses/certifications to pursue
        7. **Market Value** - Competitive hourly rate range
        8. **Career Path** - Suggested career progression`
      },
      {
        role: 'user',
        content: `Evaluate this technician:
        Specialization: ${specialization || 'General'}
        Certification: ${certification_level || 'None'}
        Years Experience: ${years_experience || 'Unknown'}
        ${repair_description ? `Current Repair Task: ${repair_description}` : ''}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Invoice Analysis
router.post('/analyze-invoice', async (req, res) => {
  try {
    const { parts_total, labor_total, paint_total, other_charges, total, vehicle_info, payment_status } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body billing and finance specialist. Analyze this invoice and provide insights. Structure your response with:
        1. **Invoice Summary** - Overview of charges
        2. **Cost Reasonableness** - Are charges fair and competitive?
        3. **Parts-to-Labor Ratio** - Is the ratio typical?
        4. **Paint Cost Analysis** - Are paint charges appropriate?
        5. **Collection Risk** - Payment collection assessment
        6. **Insurance Optimization** - Maximize insurance reimbursement
        7. **Margin Analysis** - Estimated profit margins
        8. **Billing Best Practices** - Recommendations for this invoice`
      },
      {
        role: 'user',
        content: `Analyze this invoice:
        Vehicle: ${vehicle_info || 'Not specified'}
        Parts: $${parts_total || 0}
        Labor: $${labor_total || 0}
        Paint: $${paint_total || 0}
        Other: $${other_charges || 0}
        Total: $${total || 0}
        Payment Status: ${payment_status || 'unpaid'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/ai/lookup-parts ─────────────────────────────────────────────
// AI-powered parts lookup with OEM/aftermarket options; saves to parts_lookups table
router.post('/lookup-parts', async (req, res) => {
  try {
    const { vehicle_year, make, model, damaged_parts } = req.body;

    if (!make || typeof make !== 'string') {
      return res.status(400).json({ error: 'make is required' });
    }
    if (!Array.isArray(damaged_parts) || damaged_parts.length === 0) {
      return res.status(400).json({ error: 'damaged_parts must be a non-empty array of part names' });
    }

    const vehicleStr = [vehicle_year, make, model].filter(Boolean).join(' ');
    const partsList = damaged_parts.map((p, i) => `${i + 1}. ${p}`).join('\n');

    const messages = [
      {
        role: 'system',
        content: `You are an expert auto parts specialist with deep knowledge of OEM and aftermarket parts. Provide detailed parts lookup information. Respond with ONLY valid JSON, no markdown.`
      },
      {
        role: 'user',
        content: `Look up parts for: ${vehicleStr}\n\nDamaged parts needed:\n${partsList}\n\nRespond with this JSON structure:\n{\n  "vehicle": "${vehicleStr}",\n  "parts": [\n    {\n      "part_name": "name",\n      "oem_part_number": "OEM#",\n      "oem_price_estimate": "$XXX",\n      "aftermarket_alternatives": [\n        { "brand": "Brand", "part_number": "#", "price_estimate": "$XX", "quality_note": "note" }\n      ],\n      "typical_availability": "In stock|1-3 days|1-2 weeks|Special order",\n      "labor_hours": <number>,\n      "notes": "any relevant fitment or compatibility notes"\n    }\n  ],\n  "total_oem_estimate": "$XXX",\n  "total_aftermarket_estimate": "$XXX",\n  "lookup_timestamp": "${new Date().toISOString()}"\n}`
      }
    ];

    const result = await queryOpenRouter(messages, { maxTokens: 2048 });

    let parsedParts = null;
    if (!result.error) {
      try {
        const cleaned = result.content.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
        parsedParts = JSON.parse(cleaned);
      } catch (e) {
        parsedParts = { raw: result.content };
      }
    }

    // Save to parts_lookups table (create if needed)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS parts_lookups (
          id SERIAL PRIMARY KEY,
          vehicle_year INTEGER,
          vehicle_make VARCHAR(100),
          vehicle_model VARCHAR(100),
          damaged_parts TEXT[],
          ai_response JSONB,
          model_used VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(
        `INSERT INTO parts_lookups (vehicle_year, vehicle_make, vehicle_model, damaged_parts, ai_response, model_used)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          vehicle_year ? parseInt(vehicle_year) : null,
          make,
          model || null,
          damaged_parts,
          JSON.stringify(parsedParts),
          result.model || null
        ]
      );
    } catch (dbErr) {
      console.error('[lookup-parts] DB save error:', dbErr.message);
    }

    res.json({
      success: !result.error,
      vehicle: vehicleStr,
      parts_data: parsedParts,
      model: result.model,
      ai_error: result.error ? result.content : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// AI HISTORY (paginated)
// ─────────────────────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const endpoint = req.query.endpoint || null;

    const where = endpoint ? 'WHERE endpoint = $1' : '';
    const params = endpoint ? [endpoint, limit, offset] : [limit, offset];
    const lp = endpoint ? '$2' : '$1';
    const op = endpoint ? '$3' : '$2';

    const { rows } = await pool.query(
      `SELECT id, endpoint, input_data, result_data, model_used, tokens_used, user_id, created_at
       FROM ai_results ${where}
       ORDER BY created_at DESC
       LIMIT ${lp} OFFSET ${op}`,
      params
    );

    const cParams = endpoint ? [endpoint] : [];
    const { rows: cRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM ai_results ${endpoint ? 'WHERE endpoint = $1' : ''}`,
      cParams
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: cRows[0].total, totalPages: Math.ceil(cRows[0].total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// NEW FEATURES (from audit)
// ─────────────────────────────────────────────────────────────────────────

// ── 1. Insurance company estimator comparison ────────────────────────────
//      Run estimate prompts against a list of insurer profiles, flag spread.
router.post('/insurance-comparison', async (req, res) => {
  try {
    const { damage_summary, vehicle_info, insurers } = req.body;
    if (!damage_summary) return res.status(400).json({ error: 'damage_summary is required' });
    const list = Array.isArray(insurers) && insurers.length > 0 ? insurers : ['Geico', 'Allstate', 'State Farm', 'Progressive'];

    const messages = [
      { role: 'system', content: `You are an expert insurance claims comparison assistant. Estimate likely insurer-side valuations and flag discrepancies. Respond with ONLY valid JSON:
{
  "estimates": [{"insurer":"...","estimated_payout_low":<num>,"estimated_payout_high":<num>,"likelihood_of_dispute":"low|medium|high","notes":"..."}],
  "spread_summary":{"min_low":<num>,"max_high":<num>,"avg_mid":<num>},
  "discrepancy_flags":["..."],
  "recommended_negotiation_floor":<num>
}` },
      { role: 'user', content: `Compare insurance estimates for:\nVehicle: ${vehicle_info || 'Not provided'}\nDamage: ${damage_summary}\nInsurers: ${list.join(', ')}` }
    ];

    const r = await queryOpenRouter(messages, { maxTokens: 2500 });
    if (r.error) return res.status(502).json({ error: r.content });
    const parsed = parseAIJson(r.content);
    const data = parsed.ok ? parsed.data : { raw_response: r.content };

    await persist('insurance-comparison', { damage_summary, insurers: list }, { ...data, model: r.model, usage: r.usage }, req);
    res.json({ success: true, ...data, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 2. Parts availability aggregator ─────────────────────────────────────
//      AI-powered availability check across OEM/aftermarket/salvage.
router.post('/parts-availability', async (req, res) => {
  try {
    const { parts, vehicle_year, make, model } = req.body;
    if (!Array.isArray(parts) || parts.length === 0) return res.status(400).json({ error: 'parts must be a non-empty array' });

    const messages = [
      { role: 'system', content: `You are an expert auto parts availability aggregator with knowledge of OEM, aftermarket suppliers, and salvage yards. Respond with ONLY valid JSON:
{
  "vehicle":"<year make model>",
  "results":[{"part_name":"...","oem_available":true|false,"oem_lead_days":<num>,"oem_price":<num>,"aftermarket_available":true|false,"aftermarket_brands":["..."],"aftermarket_price":<num>,"salvage_available":true|false,"salvage_price":<num>,"recommended_source":"oem|aftermarket|salvage","notes":"..."}],
  "fastest_source":"oem|aftermarket|salvage",
  "cheapest_source":"oem|aftermarket|salvage"
}` },
      { role: 'user', content: `Check availability for ${vehicle_year || ''} ${make || ''} ${model || ''}:\n${parts.map((p, i) => `${i+1}. ${p}`).join('\n')}` }
    ];

    const r = await queryOpenRouter(messages, { maxTokens: 2500 });
    if (r.error) return res.status(502).json({ error: r.content });
    const parsed = parseAIJson(r.content);
    const data = parsed.ok ? parsed.data : { raw_response: r.content };

    await persist('parts-availability', { parts, vehicle: { vehicle_year, make, model } }, { ...data, model: r.model, usage: r.usage }, req);
    res.json({ success: true, ...data, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 3. Repair quality scorecard ──────────────────────────────────────────
//      Compare actual completed jobs against estimates for accuracy trending.
router.get('/quality-scorecard', async (req, res) => {
  try {
    // Pull invoiced jobs vs original estimates
    const { rows: jobs } = await pool.query(`
      SELECT
        i.id AS invoice_id,
        i.total AS final_total,
        ce.total AS estimated_total,
        ce.estimated_at_create AS estimated_created,
        i.created_at AS invoice_created,
        c.first_name || ' ' || c.last_name AS customer_name
      FROM invoices i
      LEFT JOIN cost_estimates ce ON ce.id = i.estimate_id
      LEFT JOIN customers c ON c.id = i.customer_id
      ORDER BY i.created_at DESC
      LIMIT 100
    `).catch(() => ({ rows: [] }));

    const scorecard = jobs.filter(j => j.estimated_total && j.final_total).map(j => {
      const variance = parseFloat(j.final_total) - parseFloat(j.estimated_total);
      const variancePct = parseFloat(j.estimated_total) > 0
        ? (variance / parseFloat(j.estimated_total)) * 100 : 0;
      return {
        invoice_id: j.invoice_id,
        customer: j.customer_name,
        estimated: parseFloat(j.estimated_total),
        actual: parseFloat(j.final_total),
        variance,
        variance_pct: Math.round(variancePct * 10) / 10,
        accuracy_grade: Math.abs(variancePct) <= 5 ? 'A'
          : Math.abs(variancePct) <= 10 ? 'B'
          : Math.abs(variancePct) <= 20 ? 'C' : 'D',
      };
    });

    const avgVariance = scorecard.length
      ? scorecard.reduce((s, j) => s + Math.abs(j.variance_pct), 0) / scorecard.length
      : 0;

    const summary = {
      jobs_evaluated: scorecard.length,
      avg_variance_pct: Math.round(avgVariance * 10) / 10,
      grade_a: scorecard.filter(s => s.accuracy_grade === 'A').length,
      grade_b: scorecard.filter(s => s.accuracy_grade === 'B').length,
      grade_c: scorecard.filter(s => s.accuracy_grade === 'C').length,
      grade_d: scorecard.filter(s => s.accuracy_grade === 'D').length,
    };

    res.json({ success: true, summary, scorecard });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 4. Technician skill matcher ──────────────────────────────────────────
router.post('/match-technician', async (req, res) => {
  try {
    const { repair_type, repair_description, severity } = req.body;
    if (!repair_type) return res.status(400).json({ error: 'repair_type is required' });

    const { rows: techs } = await pool.query(`
      SELECT id, first_name, last_name, specialization, certification_level, years_experience, status, hourly_rate
      FROM technicians WHERE status = 'active'
    `).catch(() => ({ rows: [] }));

    if (techs.length === 0) {
      return res.json({ success: true, matches: [], note: 'No active technicians on file.' });
    }

    // Heuristic scoring: match specialization → +60; experience → +1pt/year up to +20; cert → up to +20
    const matches = techs.map(t => {
      let score = 0;
      const spec = (t.specialization || '').toLowerCase();
      const desc = (repair_type + ' ' + (repair_description || '')).toLowerCase();
      if (spec && desc.includes(spec)) score += 60;
      score += Math.min(20, parseInt(t.years_experience) || 0);
      const certBoost = { 'master': 20, 'expert': 18, 'i-car': 15, 'ase': 12, 'certified': 10, 'apprentice': 4 };
      const certKey = Object.keys(certBoost).find(k => (t.certification_level || '').toLowerCase().includes(k));
      if (certKey) score += certBoost[certKey];

      return {
        technician_id: t.id,
        name: `${t.first_name} ${t.last_name}`,
        specialization: t.specialization,
        certification: t.certification_level,
        years_experience: t.years_experience,
        hourly_rate: parseFloat(t.hourly_rate || 0),
        match_score: score,
      };
    }).sort((a, b) => b.match_score - a.match_score);

    res.json({
      success: true,
      repair_type,
      severity: severity || null,
      matches: matches.slice(0, 5),
      best_match: matches[0],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 5. Before/after damage photo annotation generator ────────────────────
router.post('/photo-annotation', async (req, res) => {
  try {
    const { before_description, after_description, vehicle_info } = req.body;
    if (!before_description) return res.status(400).json({ error: 'before_description is required' });

    const messages = [
      { role: 'system', content: `You are an expert auto body damage photo annotator. Generate a structured before/after annotation report. Respond with ONLY valid JSON:
{
  "annotations":[
    {"region":"front_bumper|hood|fender|door|quarter_panel|trunk|rear_bumper|roof|other","damage_type":"...","severity":"minor|moderate|severe","color_call_out":"#hex","label":"..."}
  ],
  "summary":"...",
  "estimated_repair_categories":["..."],
  "before_after_difference_score":<0-100>
}` },
      { role: 'user', content: `Vehicle: ${vehicle_info || 'Not specified'}
BEFORE: ${before_description}
AFTER:  ${after_description || 'Not provided'}` }
    ];

    const r = await queryOpenRouter(messages, { maxTokens: 2000 });
    if (r.error) return res.status(502).json({ error: r.content });
    const parsed = parseAIJson(r.content);
    const data = parsed.ok ? parsed.data : { raw_response: r.content };

    await persist('photo-annotation', { vehicle_info, has_after: !!after_description }, { ...data, model: r.model, usage: r.usage }, req);
    res.json({ success: true, ...data, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 6. Repair timeline predictor (heuristic + AI assist) ────────────────
router.post('/predict-timeline', async (req, res) => {
  try {
    const { repair_type, severity, parts_available, technician_id } = req.body;

    // Heuristic baseline
    const baseDays = { minor: 2, moderate: 5, severe: 10, total_loss: 0 }[severity] || 5;
    let predictedDays = baseDays;

    // Parts availability impact
    if (parts_available === false) predictedDays += 5;

    // Shop load — count active work orders
    const { rows: load } = await pool.query(
      `SELECT COUNT(*)::int AS active FROM work_orders WHERE status IN ('pending', 'in_progress')`
    ).catch(() => ({ rows: [{ active: 0 }] }));
    const activeLoad = load[0]?.active || 0;
    const loadFactor = Math.min(2.0, 1 + activeLoad / 25);
    predictedDays = Math.round(predictedDays * loadFactor);

    // Tech skill modifier
    let techModifier = 1.0;
    if (technician_id) {
      const { rows: t } = await pool.query(
        `SELECT years_experience, certification_level FROM technicians WHERE id = $1`, [technician_id]
      ).catch(() => ({ rows: [] }));
      if (t[0]) {
        const exp = parseInt(t[0].years_experience) || 0;
        techModifier = Math.max(0.7, 1 - exp * 0.02);
        predictedDays = Math.round(predictedDays * techModifier);
      }
    }

    const start = new Date();
    const end = new Date(Date.now() + predictedDays * 24 * 60 * 60 * 1000);

    const result = {
      repair_type,
      severity,
      base_days: baseDays,
      shop_load_factor: Math.round(loadFactor * 100) / 100,
      tech_modifier: Math.round(techModifier * 100) / 100,
      predicted_days: predictedDays,
      predicted_start: start.toISOString().slice(0, 10),
      predicted_completion: end.toISOString().slice(0, 10),
      confidence: predictedDays <= 7 ? 'high' : predictedDays <= 14 ? 'medium' : 'low',
      notes: parts_available === false ? 'Adjusted for parts unavailability (+5 days)' : 'Parts availability assumed.'
    };

    await persist('predict-timeline', { repair_type, severity, parts_available, technician_id }, result, req);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 7. Paint color matcher ───────────────────────────────────────────────
router.post('/paint-match', async (req, res) => {
  try {
    const { vehicle_year, make, model, observed_color, vin } = req.body;
    if (!make || !model) return res.status(400).json({ error: 'make and model are required' });

    const messages = [
      { role: 'system', content: `You are an expert auto paint color identifier with deep knowledge of OEM paint codes. Respond with ONLY valid JSON:
{
  "vehicle":"<year make model>",
  "observed_color":"...",
  "candidate_paint_codes":[{"code":"...","name":"...","confidence":<0-100>,"notes":"..."}],
  "best_match":{"code":"...","name":"...","confidence":<0-100>},
  "respray_panel_blending":"required|recommended|optional",
  "estimated_paint_cost_per_panel_usd":<num>
}` },
      { role: 'user', content: `Identify paint code for: ${vehicle_year || ''} ${make} ${model}
Observed color: ${observed_color || 'not provided'}
VIN: ${vin || 'not provided'}` }
    ];

    const r = await queryOpenRouter(messages, { maxTokens: 1500 });
    if (r.error) return res.status(502).json({ error: r.content });
    const parsed = parseAIJson(r.content);
    const data = parsed.ok ? parsed.data : { raw_response: r.content };

    await persist('paint-match', { vehicle_year, make, model, observed_color }, { ...data, model: r.model, usage: r.usage }, req);
    res.json({ success: true, ...data, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 8. Compliance violation detector ─────────────────────────────────────
//      Flag repairs that violate OEM structural repair procedures.
router.post('/compliance-check', async (req, res) => {
  try {
    const { repair_type, description, vehicle_info, oem_procedures_followed } = req.body;
    if (!description) return res.status(400).json({ error: 'description is required' });

    const messages = [
      { role: 'system', content: `You are an OEM repair compliance auditor. Identify violations of OEM structural repair procedures (frame straightening, weld points, panel sectioning, advanced material handling). Respond with ONLY valid JSON:
{
  "compliant":true|false,
  "violations":[{"category":"structural|electronic|paint|material","severity":"low|medium|high|critical","violation":"...","oem_reference":"...","corrective_action":"..."}],
  "recommendations":["..."],
  "liability_risk":"low|medium|high",
  "summary":"..."
}` },
      { role: 'user', content: `Audit repair compliance:
Vehicle: ${vehicle_info || 'Not provided'}
Repair Type: ${repair_type || 'Not specified'}
Description: ${description}
OEM Procedures Followed: ${oem_procedures_followed === true ? 'Yes' : oem_procedures_followed === false ? 'No' : 'Unknown'}` }
    ];

    const r = await queryOpenRouter(messages, { maxTokens: 2000 });
    if (r.error) return res.status(502).json({ error: r.content });
    const parsed = parseAIJson(r.content);
    const data = parsed.ok ? parsed.data : { raw_response: r.content };

    await persist('compliance-check', { repair_type, vehicle_info }, { ...data, model: r.model, usage: r.usage }, req);
    res.json({ success: true, ...data, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 9. Total Loss Prediction ─────────────────────────────────────────────
//      Predict whether a vehicle is repairable or should be declared total loss.
router.post('/total-loss-prediction', async (req, res) => {
  try {
    const { vehicle_info, vehicle_value, estimated_repair_cost, damage_summary, vehicle_age_years, mileage } = req.body;
    if (!damage_summary) return res.status(400).json({ error: 'damage_summary is required' });

    const messages = [
      { role: 'system', content: `You are an auto insurance total-loss adjuster. Determine whether the vehicle should be declared total loss vs. repairable using industry rules (typically 70-80% threshold of ACV, plus structural and safety considerations). Respond with ONLY valid JSON:
{
  "is_total_loss": true|false,
  "confidence": "low|medium|high",
  "loss_ratio_estimated": <number 0-1>,
  "rationale": "...",
  "salvage_value_estimate": <number>,
  "recommended_action": "repair|total_loss|borderline_review",
  "factors": ["..."],
  "summary": "..."
}` },
      { role: 'user', content: `Evaluate total loss potential:
Vehicle: ${vehicle_info || 'Not provided'}
Actual Cash Value (ACV): ${vehicle_value || 'Unknown'}
Estimated Repair Cost: ${estimated_repair_cost || 'Unknown'}
Vehicle Age (years): ${vehicle_age_years || 'Unknown'}
Mileage: ${mileage || 'Unknown'}
Damage Summary: ${damage_summary}` }
    ];

    const r = await queryOpenRouter(messages, { maxTokens: 1500 });
    if (r.error) return res.status(502).json({ error: r.content });
    const parsed = parseAIJson(r.content);
    const data = parsed.ok ? parsed.data : { raw_response: r.content };

    await persist('total-loss-prediction', { vehicle_info, vehicle_value, estimated_repair_cost }, { ...data, model: r.model, usage: r.usage }, req);
    res.json({ success: true, ...data, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 10. Paint / Interior Degradation Estimator ────────────────────────────
//      Estimate age-based depreciation for paint and interior wear.
router.post('/paint-degradation', async (req, res) => {
  try {
    const { vehicle_info, vehicle_age_years, exposure, paint_type, interior_condition, photos_described } = req.body;
    if (!vehicle_info) return res.status(400).json({ error: 'vehicle_info is required' });

    const messages = [
      { role: 'system', content: `You are an auto body refinishing specialist. Estimate paint and interior degradation due to age, sun, and use; suggest refinishing/restoration approach. Respond with ONLY valid JSON:
{
  "paint_condition_score": <0-100>,
  "interior_condition_score": <0-100>,
  "depreciation_factor": <0-1>,
  "refinish_recommendation": "spot|panel|full|none",
  "estimated_refinish_cost_range": "...",
  "issues": ["..."],
  "preservation_tips": ["..."],
  "summary": "..."
}` },
      { role: 'user', content: `Evaluate paint and interior degradation:
Vehicle: ${vehicle_info}
Age (years): ${vehicle_age_years || 'Unknown'}
Exposure (garage/outdoor/coastal/etc.): ${exposure || 'Unknown'}
Paint Type: ${paint_type || 'Standard OEM'}
Interior Condition: ${interior_condition || 'Unknown'}
Photo Notes: ${photos_described || 'None'}` }
    ];

    const r = await queryOpenRouter(messages, { maxTokens: 1500 });
    if (r.error) return res.status(502).json({ error: r.content });
    const parsed = parseAIJson(r.content);
    const data = parsed.ok ? parsed.data : { raw_response: r.content };

    await persist('paint-degradation', { vehicle_info, vehicle_age_years }, { ...data, model: r.model, usage: r.usage }, req);
    res.json({ success: true, ...data, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
