// Apply pass 5 — surface the /api/ai-integrations backlog endpoints
import React, { useState } from 'react'

const API_BASE = '/api/ai-integrations'

function getHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function call(path, body = null, method = 'POST') {
  const opts = { method, headers: getHeaders() }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${API_BASE}${path}`, opts)
  return { status: res.status, body: await res.json().catch(() => ({})) }
}

const SECTIONS = [
  {
    id: 'vin',
    title: 'VIN Decoder (NEEDS-CREDS: VIN_DECODER_API_KEY)',
    sample: { vin: '1HGCM82633A004352' },
    path: '/vin/decode',
  },
  {
    id: 'parts',
    title: 'Real-time Parts Pricing (NEEDS-CREDS: PARTS_SUPPLIER_API_KEY)',
    sample: { part_number: 'BR-9402', vehicle_year: 2020, vehicle_make: 'Honda', vehicle_model: 'Civic' },
    path: '/parts/realtime-pricing',
  },
  {
    id: 'insurance',
    title: 'Insurance API Submit (NEEDS-CREDS: INSURANCE_API_KEY)',
    sample: { claim_id: 1, carrier: 'GEICO', payload: { incident_date: '2024-08-01', estimated_amount: 2500 } },
    path: '/insurance/submit-claim',
  },
  {
    id: 'oem',
    title: 'OEM Spec Lookup (NEEDS-CREDS: OEM_API_KEY)',
    sample: { make: 'Ford', model: 'F-150', year: 2022, part_category: 'bumper' },
    path: '/oem/spec-lookup',
  },
  {
    id: 'recycled',
    title: 'Recycled Parts Marketplace (PRODUCT-DECISION: self-hosted)',
    sample: { part_name: 'Used Front Bumper', vehicle_make: 'Toyota', vehicle_model: 'Camry', condition: 'good', asking_price: 220 },
    path: '/recycled-parts',
  },
  {
    id: 'vision',
    title: 'CV Damage Analysis (TOO-RISKY → text-only stub)',
    sample: { image_description: 'Front quarter panel crumpled, headlight cracked, hood misaligned.' },
    path: '/vision/damage-analysis',
  },
]

export default function Integrations() {
  const [results, setResults] = useState({})
  const [busy, setBusy] = useState({})

  async function run(s) {
    setBusy({ ...busy, [s.id]: true })
    try {
      const r = await call(s.path, s.sample)
      setResults({ ...results, [s.id]: r })
    } catch (e) {
      setResults({ ...results, [s.id]: { status: 0, body: { error: e.message } } })
    } finally {
      setBusy({ ...busy, [s.id]: false })
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Backlog Integrations (Apply pass 5)</h2>
      <p style={{ color: '#666' }}>
        Each card calls the corresponding gated integration endpoint. 503 means
        the env-var credentials are missing; configure them in the backend
        <code> .env</code> to enable.
      </p>
      {SECTIONS.map(s => (
        <div key={s.id} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, margin: '12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{s.title}</strong>
            <button onClick={() => run(s)} disabled={busy[s.id]}>
              {busy[s.id] ? 'Calling…' : 'Run sample'}
            </button>
          </div>
          <details style={{ marginTop: 8 }}>
            <summary>Sample payload (POST {s.path})</summary>
            <pre style={{ background: '#f6f8fa', padding: 8 }}>{JSON.stringify(s.sample, null, 2)}</pre>
          </details>
          {results[s.id] && (
            <div style={{ marginTop: 8 }}>
              <div>HTTP <code>{results[s.id].status}</code></div>
              <pre style={{ background: '#f6f8fa', padding: 8 }}>
                {JSON.stringify(results[s.id].body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
