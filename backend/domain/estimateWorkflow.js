'use strict';
const transitions = Object.freeze({
  inspection_ready: ['estimate_ready'], estimate_ready: ['review_pending'], review_pending: ['approved', 'rejected', 'supplement_requested'],
  supplement_requested: ['estimate_ready'], rejected: ['estimate_ready'], approved: [],
});
function money(value) { return Math.round(Number(value) * 100); }
function validateEstimate(input) {
  const errors = [];
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(input.vin || '')) errors.push('vin must be a valid 17-character VIN');
  if (!Array.isArray(input.photos) || input.photos.length === 0) errors.push('at least one photo with provenance is required');
  for (const [i, photo] of (input.photos || []).entries()) {
    if (!/^[a-f0-9]{64}$/i.test(photo.sha256 || '')) errors.push(`photos[${i}].sha256 is invalid`);
    if (!photo.capturedAt || Number.isNaN(Date.parse(photo.capturedAt))) errors.push(`photos[${i}].capturedAt is invalid`);
  }
  if (!Array.isArray(input.damageObservations) || input.damageObservations.length === 0) errors.push('damageObservations are required');
  const safetyRelevant = (input.damageObservations || []).some(x => ['structural', 'restraint', 'adas'].includes(x.system));
  if (safetyRelevant && (!Array.isArray(input.oemProcedures) || input.oemProcedures.length === 0)) errors.push('OEM procedures are required for structural, restraint, or ADAS work');
  for (const [i, line] of [...(input.parts || []), ...(input.labor || [])].entries()) {
    if (!Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0) errors.push(`line ${i} quantity must be positive`);
    if (!Number.isFinite(Number(line.unitPrice)) || Number(line.unitPrice) < 0) errors.push(`line ${i} unitPrice must be non-negative`);
  }
  return { valid: errors.length === 0, errors };
}
function calculateTotals(input) {
  const lines = [...(input.parts || []), ...(input.labor || [])];
  const subtotalCents = lines.reduce((sum, line) => sum + money(line.unitPrice) * Number(line.quantity), 0);
  const taxCents = Math.round(subtotalCents * Number(input.taxRate || 0));
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
function assertTransition(from, to, actor, record) {
  if (!(transitions[from] || []).includes(to)) throw new Error(`transition ${from} -> ${to} is not allowed`);
  if (['approved', 'rejected'].includes(to)) {
    if (!['senior_estimator', 'manager', 'admin'].includes(actor.role)) throw new Error('estimator review role required');
    if (String(actor.id) === String(record.created_by)) throw new Error('estimator cannot approve their own estimate');
  }
}
module.exports = { validateEstimate, calculateTotals, assertTransition };

