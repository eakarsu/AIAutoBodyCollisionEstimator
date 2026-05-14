const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),

  // Dashboard
  getStats: () => request('/dashboard/stats'),

  // Customers
  getCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Vehicles
  getVehicles: () => request('/vehicles'),
  getVehicle: (id) => request(`/vehicles/${id}`),
  createVehicle: (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),

  // Damage Assessments
  getDamageAssessments: () => request('/damage-assessments'),
  getDamageAssessment: (id) => request(`/damage-assessments/${id}`),
  createDamageAssessment: (data) => request('/damage-assessments', { method: 'POST', body: JSON.stringify(data) }),
  updateDamageAssessment: (id, data) => request(`/damage-assessments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDamageAssessment: (id) => request(`/damage-assessments/${id}`, { method: 'DELETE' }),

  // Parts Pricing
  getPartsPricing: () => request('/parts-pricing'),
  getPartPricing: (id) => request(`/parts-pricing/${id}`),
  createPartPricing: (data) => request('/parts-pricing', { method: 'POST', body: JSON.stringify(data) }),
  updatePartPricing: (id, data) => request(`/parts-pricing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePartPricing: (id) => request(`/parts-pricing/${id}`, { method: 'DELETE' }),

  // Insurance Claims
  getInsuranceClaims: () => request('/insurance-claims'),
  getInsuranceClaim: (id) => request(`/insurance-claims/${id}`),
  createInsuranceClaim: (data) => request('/insurance-claims', { method: 'POST', body: JSON.stringify(data) }),
  updateInsuranceClaim: (id, data) => request(`/insurance-claims/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInsuranceClaim: (id) => request(`/insurance-claims/${id}`, { method: 'DELETE' }),

  // Repair Timelines
  getRepairTimelines: () => request('/repair-timelines'),
  getRepairTimeline: (id) => request(`/repair-timelines/${id}`),
  createRepairTimeline: (data) => request('/repair-timelines', { method: 'POST', body: JSON.stringify(data) }),
  updateRepairTimeline: (id, data) => request(`/repair-timelines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRepairTimeline: (id) => request(`/repair-timelines/${id}`, { method: 'DELETE' }),

  // Cost Estimates
  getCostEstimates: () => request('/cost-estimates'),
  getCostEstimate: (id) => request(`/cost-estimates/${id}`),
  createCostEstimate: (data) => request('/cost-estimates', { method: 'POST', body: JSON.stringify(data) }),
  updateCostEstimate: (id, data) => request(`/cost-estimates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCostEstimate: (id) => request(`/cost-estimates/${id}`, { method: 'DELETE' }),

  // Technicians
  getTechnicians: () => request('/technicians'),
  getTechnician: (id) => request(`/technicians/${id}`),
  createTechnician: (data) => request('/technicians', { method: 'POST', body: JSON.stringify(data) }),
  updateTechnician: (id, data) => request(`/technicians/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTechnician: (id) => request(`/technicians/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  getSupplier: (id) => request(`/suppliers/${id}`),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Work Orders
  getWorkOrders: () => request('/work-orders'),
  getWorkOrder: (id) => request(`/work-orders/${id}`),
  createWorkOrder: (data) => request('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkOrder: (id, data) => request(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkOrder: (id) => request(`/work-orders/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: () => request('/invoices'),
  getInvoice: (id) => request(`/invoices/${id}`),
  createInvoice: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id, data) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),

  // Photos
  getPhotos: () => request('/photos'),
  getPhoto: (id) => request(`/photos/${id}`),
  createPhoto: (data) => request('/photos', { method: 'POST', body: JSON.stringify(data) }),
  updatePhoto: (id, data) => request(`/photos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePhoto: (id) => request(`/photos/${id}`, { method: 'DELETE' }),

  // Appointments
  getAppointments: () => request('/appointments'),
  getAppointment: (id) => request(`/appointments/${id}`),
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),

  // Inventory
  getInventory: () => request('/inventory'),
  getInventoryItem: (id) => request(`/inventory/${id}`),
  getLowStock: () => request('/inventory/low-stock'),
  createInventoryItem: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateInventoryItem: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adjustStock: (id, adjustment) => request(`/inventory/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ adjustment }) }),
  deleteInventoryItem: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),

  // Reports
  getRevenueReport: () => request('/reports/revenue'),
  getRepairsReport: () => request('/reports/repairs'),
  getClaimsReport: () => request('/reports/claims'),
  getDamageReport: () => request('/reports/damage'),

  // Settings
  getSettings: () => request('/settings'),
  getSettingsByCategory: (cat) => request(`/settings/${cat}`),
  updateSetting: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  bulkUpdateSettings: (settings) => request('/settings/bulk', { method: 'POST', body: JSON.stringify({ settings }) }),
  deleteSetting: (key) => request(`/settings/${key}`, { method: 'DELETE' }),

  // AI
  analyzeDamage: (data) => request('/ai/analyze-damage', { method: 'POST', body: JSON.stringify(data) }),
  partsLookup: (data) => request('/ai/parts-lookup', { method: 'POST', body: JSON.stringify(data) }),
  prepareClaim: (data) => request('/ai/prepare-claim', { method: 'POST', body: JSON.stringify(data) }),
  estimateTimeline: (data) => request('/ai/estimate-timeline', { method: 'POST', body: JSON.stringify(data) }),
  analyzeCost: (data) => request('/ai/analyze-cost', { method: 'POST', body: JSON.stringify(data) }),
  vehicleValuation: (data) => request('/ai/vehicle-valuation', { method: 'POST', body: JSON.stringify(data) }),
  analyzeWorkOrder: (data) => request('/ai/analyze-work-order', { method: 'POST', body: JSON.stringify(data) }),
  evaluateSupplier: (data) => request('/ai/evaluate-supplier', { method: 'POST', body: JSON.stringify(data) }),
  technicianMatch: (data) => request('/ai/technician-match', { method: 'POST', body: JSON.stringify(data) }),
  analyzeInvoice: (data) => request('/ai/analyze-invoice', { method: 'POST', body: JSON.stringify(data) }),

  // ── Audit-driven new AI features ─────────────────────────────────────
  aiHistory: (params = {}) => request(`/ai/history?${new URLSearchParams(params).toString()}`),
  insuranceComparison: (data) => request('/ai/insurance-comparison', { method: 'POST', body: JSON.stringify(data) }),
  partsAvailability: (data) => request('/ai/parts-availability', { method: 'POST', body: JSON.stringify(data) }),
  qualityScorecard: () => request('/ai/quality-scorecard'),
  matchTechnician: (data) => request('/ai/match-technician', { method: 'POST', body: JSON.stringify(data) }),
  photoAnnotation: (data) => request('/ai/photo-annotation', { method: 'POST', body: JSON.stringify(data) }),
  predictTimeline: (data) => request('/ai/predict-timeline', { method: 'POST', body: JSON.stringify(data) }),
  paintMatch: (data) => request('/ai/paint-match', { method: 'POST', body: JSON.stringify(data) }),
  complianceCheck: (data) => request('/ai/compliance-check', { method: 'POST', body: JSON.stringify(data) }),
  totalLossPrediction: (data) => request('/ai/total-loss-prediction', { method: 'POST', body: JSON.stringify(data) }),
  paintDegradation: (data) => request('/ai/paint-degradation', { method: 'POST', body: JSON.stringify(data) }),

  lookupParts: (data) => request('/ai/lookup-parts', { method: 'POST', body: JSON.stringify(data) }),
};
