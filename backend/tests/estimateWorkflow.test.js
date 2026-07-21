'use strict';
const test = require('node:test'); const assert = require('node:assert/strict');
const { validateEstimate, calculateTotals, assertTransition } = require('../domain/estimateWorkflow');
const input = { vin: '1HGCM82633A004352', photos: [{ sha256: 'b'.repeat(64), capturedAt: '2026-07-18T12:00:00Z' }], damageObservations: [{ system: 'structural', panel: 'rail' }], oemProcedures: [{ id: 'OEM-42', revision: '2026-01' }], parts: [{ quantity: 2, unitPrice: 10.25 }], labor: [{ quantity: 1.5, unitPrice: 100 }], taxRate: 0.1 };
test('validates provenance and safety procedure evidence', () => assert.equal(validateEstimate(input).valid, true));
test('requires OEM procedure for structural repair', () => assert.equal(validateEstimate({ ...input, oemProcedures: [] }).valid, false));
test('calculates integer-cent totals deterministically', () => assert.deepEqual(calculateTotals(input), { subtotalCents: 17050, taxCents: 1705, totalCents: 18755 }));
test('requires independent estimator approval', () => assert.throws(() => assertTransition('review_pending', 'approved', { id: 1, role: 'manager' }, { created_by: 1 }), /own estimate/));

