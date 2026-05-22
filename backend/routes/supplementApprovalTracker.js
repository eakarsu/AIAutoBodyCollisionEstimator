const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { open_supplements: 17, carrier_pending: 8, avg_cycle_days: 3.4, approved_value: 48200 },
    supplements: [
      { claim: 'CLM-44021', vehicle: '2023 Toyota Camry', reason: 'hidden rail damage', amount: 2800, carrier: 'Statewide', status: 'carrier review' },
      { claim: 'CLM-44055', vehicle: '2021 Ford F-150', reason: 'sensor calibration', amount: 740, carrier: 'North Mutual', status: 'approved' },
      { claim: 'CLM-44102', vehicle: '2024 Honda CR-V', reason: 'blend labor delta', amount: 1160, carrier: 'Shield Auto', status: 'needs photos' },
    ],
  });
});

router.post('/submit', (req, res) => {
  const { claim = 'claim', amount = 0 } = req.body || {};
  res.json({ claim, amount, packet: ['estimate delta', 'damage photos', 'labor notes'], status: 'ready for carrier submission' });
});

module.exports = router;
