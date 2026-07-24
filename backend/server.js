require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { validateRuntime } = require('./config/runtime');
validateRuntime();

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
app.use('/api', require('./runtimeAcceptance'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', (req, res, next) => req.path === '/health' ? next() : require('./middleware/auth')(req, res, next));
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
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/estimates', require('./routes/estimates'));
app.use('/api/supplement-approval-tracker', require('./routes/supplementApprovalTracker'));
app.use('/api/estimate-cases', require('./middleware/auth'), require('./routes/governedEstimates'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Generated AI, gap, payment, carrier, OEM, CV, and supplier-provider routes are quarantined.

// Custom Views (damage diagram, cost breakdown, claim PDF, parts wizard)
app.use('/api/custom-views', require('./routes/customViews'));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
