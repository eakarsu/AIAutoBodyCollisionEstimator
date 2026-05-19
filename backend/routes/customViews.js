// Custom Views routes - 4 endpoints for new features (damage diagram, cost
// breakdown, insurance claim PDF, parts ordering wizard).
const router = require('express').Router();
const pool = require('../db/pool');

// Map damage_assessments rows to a per-panel severity matrix understood by the
// SVG diagram component. Severity strings come from the schema constraint
// (minor | moderate | severe | total_loss).
const PANEL_KEYWORDS = {
  hood: ['hood'],
  roof: ['roof'],
  trunk: ['trunk', 'tailgate'],
  front_bumper: ['front bumper', 'front-end', 'front end', 'grille', 'radiator', 'front'],
  rear_bumper: ['rear bumper', 'rear-end', 'rear end', 'taillight'],
  left_front_door: ['driver door', 'left front door', 'front left door', 'left door'],
  right_front_door: ['passenger door', 'right front door', 'front right door', 'right door'],
  left_rear_door: ['left rear door', 'rear left door'],
  right_rear_door: ['right rear door', 'rear right door'],
  left_front_fender: ['left front fender', 'front left fender', 'left fender'],
  right_front_fender: ['right front fender', 'front right fender', 'right fender'],
  left_rear_quarter: ['left rear quarter', 'rear quarter'],
  right_rear_quarter: ['right rear quarter'],
  windshield: ['windshield'],
};

function panelFor(location) {
  if (!location) return [];
  const loc = String(location).toLowerCase();
  const matched = [];
  for (const [panel, keys] of Object.entries(PANEL_KEYWORDS)) {
    if (keys.some(k => loc.includes(k))) matched.push(panel);
  }
  return matched;
}

const SEV_WEIGHT = { minor: 1, moderate: 2, severe: 3, total_loss: 4 };

// 1) DAMAGE DIAGRAM data ------------------------------------------------------
router.get('/damage-diagram/:vehicleId', async (req, res) => {
  try {
    const vid = parseInt(req.params.vehicleId, 10);
    if (!vid) return res.status(400).json({ error: 'vehicleId required' });

    const v = await pool.query(
      'SELECT id, year, make, model, color, vin, license_plate FROM vehicles WHERE id = $1',
      [vid]
    );
    if (!v.rows.length) return res.status(404).json({ error: 'vehicle not found' });

    const a = await pool.query(
      `SELECT id, description, severity, location_on_vehicle, estimated_cost, status, damage_type
       FROM damage_assessments WHERE vehicle_id = $1 ORDER BY id DESC`,
      [vid]
    );

    const panels = {};
    for (const row of a.rows) {
      const sev = (row.severity || 'minor').toLowerCase();
      const w = SEV_WEIGHT[sev] || 1;
      for (const p of panelFor(row.location_on_vehicle)) {
        const cur = panels[p];
        if (!cur || w > cur.weight) {
          panels[p] = { severity: sev, weight: w, description: row.description,
            estimated_cost: Number(row.estimated_cost || 0) };
        }
      }
    }

    res.json({
      vehicle: v.rows[0],
      assessments: a.rows,
      panels,
      legend: [
        { key: 'none', label: 'No damage', color: '#e5e7eb' },
        { key: 'minor', label: 'Minor', color: '#fde68a' },
        { key: 'moderate', label: 'Moderate', color: '#fb923c' },
        { key: 'severe', label: 'Severe', color: '#ef4444' },
        { key: 'total_loss', label: 'Total loss', color: '#7f1d1d' },
      ],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2) REPAIR COST BREAKDOWN ---------------------------------------------------
router.get('/cost-breakdown', async (req, res) => {
  try {
    const estimateId = req.query.estimateId ? parseInt(req.query.estimateId, 10) : null;

    let parts = 0, labor = 0, paint = 0, sublet = 0;

    if (estimateId) {
      const r = await pool.query(
        'SELECT parts_cost, labor_cost, paint_cost, additional_cost FROM cost_estimates WHERE id = $1',
        [estimateId]
      );
      if (!r.rows.length) return res.status(404).json({ error: 'estimate not found' });
      const row = r.rows[0];
      parts = Number(row.parts_cost || 0);
      labor = Number(row.labor_cost || 0);
      paint = Number(row.paint_cost || 0);
      sublet = Number(row.additional_cost || 0);
    } else {
      const r = await pool.query(`
        SELECT COALESCE(SUM(parts_cost),0)::numeric  AS parts,
               COALESCE(SUM(labor_cost),0)::numeric  AS labor,
               COALESCE(SUM(paint_cost),0)::numeric  AS paint,
               COALESCE(SUM(additional_cost),0)::numeric AS sublet
        FROM cost_estimates`);
      parts = Number(r.rows[0].parts);
      labor = Number(r.rows[0].labor);
      paint = Number(r.rows[0].paint);
      sublet = Number(r.rows[0].sublet);
    }

    const series = [
      { name: 'Parts',  value: parts,  color: '#3b82f6' },
      { name: 'Labor',  value: labor,  color: '#10b981' },
      { name: 'Paint',  value: paint,  color: '#f59e0b' },
      { name: 'Sublet', value: sublet, color: '#8b5cf6' },
    ];
    const total = series.reduce((s, x) => s + x.value, 0);
    res.json({ scope: estimateId ? `estimate-${estimateId}` : 'all', series, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3) INSURANCE CLAIM PDF -----------------------------------------------------
router.get('/insurance-claim-pdf/:vehicleId', async (req, res) => {
  try {
    const vid = parseInt(req.params.vehicleId, 10);
    if (!vid) return res.status(400).json({ error: 'vehicleId required' });

    const PDFDocument = require('pdfkit');

    const vehicleRes = await pool.query(
      `SELECT v.*, c.first_name, c.last_name, c.email, c.phone, c.address,
              c.insurance_provider, c.policy_number
         FROM vehicles v
         LEFT JOIN customers c ON v.customer_id = c.id
        WHERE v.id = $1`,
      [vid]
    );
    if (!vehicleRes.rows.length) return res.status(404).json({ error: 'vehicle not found' });
    const v = vehicleRes.rows[0];

    const dmg = await pool.query(
      `SELECT description, damage_type, severity, location_on_vehicle, estimated_cost, status
         FROM damage_assessments WHERE vehicle_id = $1 ORDER BY id DESC`,
      [vid]
    );
    const est = await pool.query(
      `SELECT estimate_number, parts_cost, labor_cost, paint_cost, additional_cost,
              subtotal, tax_amount, total, status
         FROM cost_estimates WHERE vehicle_id = $1 ORDER BY id DESC LIMIT 5`,
      [vid]
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `inline; filename="insurance-claim-${vid}.pdf"`);

    const doc = new PDFDocument({ size: 'LETTER', margin: 48 });
    doc.pipe(res);

    doc.fontSize(20).fillColor('#111827').text('Insurance Claim Document', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#6b7280')
      .text(`Generated ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(13).fillColor('#111827').text('Vehicle Information');
    doc.moveTo(48, doc.y).lineTo(564, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#111827');
    doc.text(`Year/Make/Model: ${v.year} ${v.make} ${v.model}`);
    doc.text(`VIN: ${v.vin || 'N/A'}`);
    doc.text(`Color: ${v.color || 'N/A'}    License Plate: ${v.license_plate || 'N/A'}`);
    doc.text(`Mileage: ${v.mileage != null ? v.mileage : 'N/A'}`);
    doc.moveDown();

    doc.fontSize(13).text('Insured / Owner');
    doc.moveTo(48, doc.y).lineTo(564, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.4);
    doc.fontSize(10);
    doc.text(`Name: ${[v.first_name, v.last_name].filter(Boolean).join(' ') || 'N/A'}`);
    doc.text(`Email: ${v.email || 'N/A'}   Phone: ${v.phone || 'N/A'}`);
    doc.text(`Address: ${v.address || 'N/A'}`);
    doc.text(`Insurance: ${v.insurance_provider || 'N/A'}   Policy #: ${v.policy_number || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(13).text('Damage List');
    doc.moveTo(48, doc.y).lineTo(564, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.3);
    doc.fontSize(10);
    if (!dmg.rows.length) {
      doc.fillColor('#6b7280').text('No damage assessments on record.');
    } else {
      dmg.rows.forEach((d, i) => {
        doc.fillColor('#111827')
          .text(`${i + 1}. [${(d.severity || 'n/a').toUpperCase()}] ${d.damage_type || 'Damage'} - ${d.location_on_vehicle || 'unspecified'}`);
        doc.fillColor('#374151').text(`   ${d.description}`);
        doc.fillColor('#6b7280').text(`   Estimated: $${Number(d.estimated_cost || 0).toFixed(2)}   Status: ${d.status}`);
        doc.moveDown(0.2);
      });
    }
    doc.moveDown(0.5);

    doc.fontSize(13).fillColor('#111827').text('Line-Item Estimate');
    doc.moveTo(48, doc.y).lineTo(564, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.3);
    doc.fontSize(10);
    if (!est.rows.length) {
      doc.fillColor('#6b7280').text('No cost estimates on record.');
    } else {
      est.rows.forEach(e => {
        doc.fillColor('#111827').text(`Estimate ${e.estimate_number}   (${e.status})`);
        doc.fillColor('#374151')
          .text(`   Parts  $${Number(e.parts_cost).toFixed(2)}    Labor $${Number(e.labor_cost).toFixed(2)}    Paint $${Number(e.paint_cost).toFixed(2)}    Sublet $${Number(e.additional_cost).toFixed(2)}`);
        doc.text(`   Subtotal $${Number(e.subtotal).toFixed(2)}    Tax $${Number(e.tax_amount).toFixed(2)}    Total $${Number(e.total).toFixed(2)}`);
        doc.moveDown(0.2);
      });
    }
    doc.moveDown();

    doc.fontSize(13).fillColor('#111827').text('Photos');
    doc.moveTo(48, doc.y).lineTo(564, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#6b7280')
      .text('[ Photo evidence placeholder - attach jpeg/png exhibits separately ]');
    doc.rect(48, doc.y + 6, 240, 90).strokeColor('#d1d5db').stroke();
    doc.rect(304, doc.y + 6, 240, 90).strokeColor('#d1d5db').stroke();

    doc.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// 4) PARTS ORDERING WIZARD ---------------------------------------------------
router.get('/parts-wizard/options', async (req, res) => {
  try {
    const vehicles = await pool.query(
      `SELECT v.id, v.year, v.make, v.model, v.vin,
              c.first_name || ' ' || c.last_name AS customer_name
         FROM vehicles v LEFT JOIN customers c ON v.customer_id = c.id
        ORDER BY v.id DESC`
    );
    const parts = await pool.query(
      `SELECT id, part_number, part_name, category, oem_price, aftermarket_price,
              vehicle_make, vehicle_model, supplier, in_stock
         FROM parts_pricing ORDER BY part_name ASC`
    );
    const vendors = await pool.query(
      `SELECT id, company_name, specialty, rating, lead_time_days, payment_terms, status
         FROM suppliers WHERE status = 'active' ORDER BY rating DESC NULLS LAST, id ASC`
    );
    res.json({
      vehicles: vehicles.rows,
      parts: parts.rows,
      vendors: vendors.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/parts-wizard/submit', async (req, res) => {
  try {
    const { vehicleId, vendorId, lines } = req.body || {};
    if (!vehicleId || !vendorId || !Array.isArray(lines) || !lines.length) {
      return res.status(400).json({ error: 'vehicleId, vendorId and lines[] required' });
    }
    const total = lines.reduce(
      (s, l) => s + Number(l.unit_price || 0) * Number(l.qty || 0), 0);
    const order = {
      order_id: `PO-${Date.now()}`,
      vehicle_id: vehicleId,
      vendor_id: vendorId,
      lines,
      total: Number(total.toFixed(2)),
      created_at: new Date().toISOString(),
      status: 'submitted',
    };
    res.json({ ok: true, order });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
