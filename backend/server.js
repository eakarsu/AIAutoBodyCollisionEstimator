require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' } // required so /uploads images load from React dev origin
}));

// Env-driven CORS (CORS_ORIGINS comma-separated; * by default in dev)
const allowedOrigins = (process.env.CORS_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed for this origin'));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/damage-assessments', require('./routes/damageAssessments'));
app.use('/api/parts-pricing', require('./routes/partsPricing'));
app.use('/api/insurance-claims', require('./routes/insuranceClaims'));
app.use('/api/repair-timelines', require('./routes/repairTimelines'));
app.use('/api/cost-estimates', require('./routes/costEstimates'));
app.use('/api/technicians', require('./routes/technicians'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/work-orders', require('./routes/workOrders'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai-integrations', require('./routes/integrations'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/estimates', require('./routes/estimates'));
app.use('/api/payments', require('./routes/estimates')); // Stripe webhook at /api/payments/webhook

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

// BATCH_00_AUDIT_MOUNTS
app.use('/api/cv-damage', require('./routes/cvDamage'));
app.use('/api/parts-pricing-feed', require('./routes/partsPricingFeed'));
app.use('/api/carrier-submit', require('./routes/carrierSubmit'));
app.use('/api/recycled-marketplace', require('./routes/recycledMarketplace'));
app.use('/api/oem-insurance-bridge', require('./routes/oemInsuranceBridge'));

// === Batch 00 Gaps & Frontend Mounts ===
app.use('/api/gap-ai-total-loss-vs-repairable', require('./routes/gap_ai_total_loss_vs_repairable'));
app.use('/api/gap-ai-paint-interior-degradation-age', require('./routes/gap_ai_paint_interior_degradation_age'));
app.use('/api/gap-ai-parts-substitution-recommendation', require('./routes/gap_ai_parts_substitution_recommendation'));
app.use('/api/gap-ai-labor-time-benchmark-estimator', require('./routes/gap_ai_labor_time_benchmark_estimator'));
app.use('/api/gap-live-vin-decoder-integration-exact', require('./routes/gap_live_vin_decoder_integration_exact'));
app.use('/api/gap-real-time-parts-availability-supplier', require('./routes/gap_real_time_parts_availability_supplier'));
app.use('/api/gap-insurance-carrier-api-submission-direct', require('./routes/gap_insurance_carrier_api_submission_direct'));
app.use('/api/gap-customer-facing-repair-status-portal', require('./routes/gap_customer_facing_repair_status_portal'));
app.use('/api/gap-notifications-subsystem', require('./routes/gap_notifications_subsystem'));
