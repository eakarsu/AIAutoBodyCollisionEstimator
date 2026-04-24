require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
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
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
