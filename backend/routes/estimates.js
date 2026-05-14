/**
 * Estimates routes — extended features:
 *  POST /api/estimates/:id/analyze-photo  — AI vision damage analysis
 *  POST /api/estimates/:id/create-payment — Stripe PaymentIntent
 *  POST /api/payments/webhook             — Stripe webhook
 *  POST /api/estimates/:id/send-sms       — Twilio SMS delivery
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const router = require('express').Router();
const multer = require('multer');
const https = require('https');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { uploadFile } = require('../services/storageService');

// ── Multer — memory storage, max 10MB ────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ── Helper: call OpenRouter with vision ───────────────────────────────────
function callOpenRouterVision(base64Image, mimeType, prompt, systemPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = 'anthropic/claude-3.5-sonnet';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return Promise.resolve({ error: true, content: 'OpenRouter API key not configured.', model });
  }

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          { type: 'text', text: prompt }
        ]
      }
    ],
    max_tokens: 2048,
    temperature: 0.3
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI Auto Body Estimator'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            resolve({ error: true, content: parsed.error.message || 'AI error', model, raw: parsed });
          } else {
            resolve({ error: false, content: parsed.choices?.[0]?.message?.content || '', model: parsed.model || model, usage: parsed.usage });
          }
        } catch (e) {
          resolve({ error: true, content: 'Failed to parse AI response', model });
        }
      });
    });
    req.on('error', e => resolve({ error: true, content: e.message, model }));
    req.write(body);
    req.end();
  });
}

// ── POST /api/estimates/:id/analyze-photo ────────────────────────────────
router.post('/:id/analyze-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided. Send file as multipart/form-data field "photo".' });

    const { id } = req.params;
    const estimateResult = await pool.query(
      `SELECT ce.*, v.year || ' ' || v.make || ' ' || v.model as vehicle_name
       FROM cost_estimates ce
       LEFT JOIN vehicles v ON ce.vehicle_id = v.id
       WHERE ce.id = $1`,
      [id]
    );
    if (estimateResult.rows.length === 0) return res.status(404).json({ error: 'Estimate not found' });

    const estimate = estimateResult.rows[0];
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Upload image to storage
    let storageResult;
    try {
      storageResult = await uploadFile({
        buffer: req.file.buffer,
        fileName: `estimate-${id}-${Date.now()}.jpg`,
        folder: 'damage-photos'
      });
    } catch (uploadErr) {
      console.error('[analyze-photo] Storage upload error:', uploadErr.message);
      storageResult = { url: null, storage: 'failed' };
    }

    const systemPrompt = 'You are an expert auto body damage estimator with 20+ years of experience. Analyze vehicle damage photos and provide detailed professional assessments. Respond with valid JSON only.';

    const prompt = `Analyze this vehicle damage photo for: ${estimate.vehicle_name || 'unknown vehicle'}.

Provide a JSON response with exactly this structure:
{
  "damage_areas": ["array of affected body panels/components"],
  "severity_per_panel": { "panel_name": "minor|moderate|severe|total_loss" },
  "total_estimated_hours": <number>,
  "parts_needed": [
    { "name": "part name", "oem_part_number": "OEM#", "oem_price_estimate": "$XXX", "aftermarket_available": true|false, "aftermarket_price_estimate": "$XXX" }
  ],
  "paint_requirements": {
    "panels_to_paint": ["panel list"],
    "blend_panels": ["panels that need blending"],
    "estimated_paint_hours": <number>,
    "paint_materials_estimate": "$XXX"
  },
  "overall_severity": "minor|moderate|severe|total_loss",
  "confidence_level": "high|medium|low",
  "additional_notes": "any relevant observations"
}`;

    const aiResult = await callOpenRouterVision(base64, mimeType, prompt, systemPrompt);

    let parsedAnalysis = null;
    if (!aiResult.error) {
      try {
        const cleaned = aiResult.content.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
        parsedAnalysis = JSON.parse(cleaned);
      } catch (e) {
        parsedAnalysis = { raw_analysis: aiResult.content };
      }
    }

    // Save analysis and photo URL to estimate record
    const analysisJson = JSON.stringify({ ...parsedAnalysis, analyzed_at: new Date().toISOString(), model: aiResult.model });
    await pool.query(
      `UPDATE cost_estimates SET ai_cost_analysis = $1, notes = COALESCE(notes, '') || $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [analysisJson, storageResult.url ? `\n[Photo: ${storageResult.url}]` : '', id]
    );

    res.json({
      success: true,
      estimate_id: parseInt(id),
      photo_url: storageResult.url,
      storage_backend: storageResult.storage,
      analysis: parsedAnalysis,
      model: aiResult.model,
      ai_error: aiResult.error ? aiResult.content : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/estimates/:id/create-payment ───────────────────────────────
router.post('/:id/create-payment', auth, async (req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return res.status(503).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY in .env' });

    const stripe = require('stripe')(stripeKey);

    const { id } = req.params;
    const result = await pool.query(
      `SELECT ce.*, c.email as customer_email, c.first_name || ' ' || c.last_name as customer_name
       FROM cost_estimates ce
       LEFT JOIN customers c ON ce.customer_id = c.id
       WHERE ce.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Estimate not found' });

    const estimate = result.rows[0];
    const amountCents = Math.round(parseFloat(estimate.total || 0) * 100);

    if (amountCents < 50) {
      return res.status(400).json({ error: 'Estimate total must be at least $0.50 to create a payment' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        estimate_id: id,
        estimate_number: estimate.estimate_number || '',
        customer_name: estimate.customer_name || ''
      },
      description: `Auto Body Repair Estimate #${estimate.estimate_number || id}`
    });

    // Save paymentIntentId to estimate record
    await pool.query(
      `UPDATE cost_estimates SET notes = COALESCE(notes, '') || $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [`\n[Stripe PaymentIntent: ${paymentIntent.id}]`, id]
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      estimate_id: parseInt(id)
    });
  } catch (err) {
    if (err.type && err.type.startsWith('Stripe')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/webhook — Stripe webhook ───────────────────────────
router.post('/webhook', require('express').raw({ type: 'application/json' }), async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey) return res.status(503).json({ error: 'Stripe not configured' });

  const stripe = require('stripe')(stripeKey);
  let event;

  try {
    if (webhookSecret) {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const estimateId = paymentIntent.metadata?.estimate_id;

    if (estimateId) {
      try {
        await pool.query(
          `UPDATE cost_estimates SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [parseInt(estimateId)]
        );
        console.log(`[Stripe Webhook] Estimate ${estimateId} marked as paid`);
      } catch (dbErr) {
        console.error('[Stripe Webhook] DB update error:', dbErr.message);
      }
    }
  }

  res.json({ received: true });
});

// ── POST /api/estimates/:id/send-sms ─────────────────────────────────────
router.post('/:id/send-sms', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone is required' });

    const { id } = req.params;
    const result = await pool.query(
      `SELECT ce.*, c.first_name || ' ' || c.last_name as customer_name,
       v.year || ' ' || v.make || ' ' || v.model as vehicle_name
       FROM cost_estimates ce
       LEFT JOIN customers c ON ce.customer_id = c.id
       LEFT JOIN vehicles v ON ce.vehicle_id = v.id
       WHERE ce.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Estimate not found' });

    const estimate = result.rows[0];
    const message = [
      `Auto Body Repair Estimate #${estimate.estimate_number || id}`,
      estimate.vehicle_name ? `Vehicle: ${estimate.vehicle_name}` : null,
      estimate.customer_name ? `Customer: ${estimate.customer_name}` : null,
      `Parts: $${parseFloat(estimate.parts_cost || 0).toFixed(2)}`,
      `Labor: $${parseFloat(estimate.labor_cost || 0).toFixed(2)}`,
      `Paint: $${parseFloat(estimate.paint_cost || 0).toFixed(2)}`,
      estimate.additional_cost > 0 ? `Additional: $${parseFloat(estimate.additional_cost).toFixed(2)}` : null,
      `Subtotal: $${parseFloat(estimate.subtotal || 0).toFixed(2)}`,
      `Tax: $${parseFloat(estimate.tax_amount || 0).toFixed(2)}`,
      `TOTAL: $${parseFloat(estimate.total || 0).toFixed(2)}`,
      `Status: ${estimate.status || 'draft'}`
    ].filter(Boolean).join('\n');

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;

    if (!twilioSid || !twilioToken || !twilioFrom) {
      console.log(`[SMS - NOT SENT - Twilio not configured]\nTo: ${phone}\n${message}`);
      return res.json({
        success: false,
        sent: false,
        reason: 'Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)',
        message_preview: message,
        estimate_id: parseInt(id)
      });
    }

    const twilio = require('twilio')(twilioSid, twilioToken);
    const smsResult = await twilio.messages.create({ body: message, from: twilioFrom, to: phone });

    res.json({
      success: true,
      sent: true,
      message_sid: smsResult.sid,
      to: phone,
      estimate_id: parseInt(id)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
