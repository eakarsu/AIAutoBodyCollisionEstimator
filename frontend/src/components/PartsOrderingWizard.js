import React, { useEffect, useMemo, useState } from 'react'

// Multi-step wizard:
//   1) vehicle -> 2) parts -> 3) vendor -> 4) quantities -> 5) submit
export default function PartsOrderingWizard() {
  const [opts, setOpts] = useState(null)
  const [err, setErr] = useState(null)
  const [step, setStep] = useState(1)
  const [vehicleId, setVehicleId] = useState('')
  const [pickedPartIds, setPickedPartIds] = useState([])
  const [vendorId, setVendorId] = useState('')
  const [qty, setQty] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    fetch('/api/custom-views/parts-wizard/options')
      .then(r => r.json())
      .then(d => { if (d.error) setErr(d.error); else setOpts(d) })
      .catch(e => setErr(String(e)))
  }, [])

  const vehicle = useMemo(
    () => opts?.vehicles?.find(v => String(v.id) === String(vehicleId)),
    [opts, vehicleId]
  )

  const relevantParts = useMemo(() => {
    if (!opts) return []
    if (!vehicle) return opts.parts
    const make = (vehicle.make || '').toLowerCase()
    return opts.parts.filter(
      p => !p.vehicle_make || p.vehicle_make.toLowerCase() === make
    )
  }, [opts, vehicle])

  const pickedParts = useMemo(
    () => (opts?.parts || []).filter(p => pickedPartIds.includes(p.id)),
    [opts, pickedPartIds]
  )

  const lineTotal = (p) => {
    const q = Number(qty[p.id] || 1)
    const unit = Number(p.oem_price || 0)
    return q * unit
  }
  const grandTotal = pickedParts.reduce((s, p) => s + lineTotal(p), 0)

  const togglePart = (id) => {
    setPickedPartIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    setQty(prev => ({ ...prev, [id]: prev[id] || 1 }))
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const lines = pickedParts.map(p => ({
        part_id: p.id,
        part_number: p.part_number,
        part_name: p.part_name,
        qty: Number(qty[p.id] || 1),
        unit_price: Number(p.oem_price || 0),
      }))
      const res = await fetch('/api/custom-views/parts-wizard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: Number(vehicleId),
          vendorId: Number(vendorId),
          lines,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      setConfirmation(data.order)
      setStep(5)
    } catch (e) { setErr(String(e)) }
    finally { setSubmitting(false) }
  }

  if (err && !opts) return <div style={{ color:'#b91c1c', padding:12 }}>Error: {err}</div>
  if (!opts) return <div style={{ color:'#6b7280', padding:12 }}>Loading wizard...</div>

  const canNext = (
    (step === 1 && !!vehicleId) ||
    (step === 2 && pickedPartIds.length > 0) ||
    (step === 3 && !!vendorId) ||
    (step === 4)
  )

  return (
    <div data-testid="parts-ordering-wizard" style={{ padding:4 }}>
      <div style={{ display:'flex', gap:8, marginBottom:16, fontSize:12, color:'#6b7280' }}>
        {['Vehicle','Parts','Vendor','Quantities','Submit'].map((label, i) => {
          const n = i + 1
          const active = step === n
          return (
            <div key={n} style={{
              padding:'4px 10px', borderRadius:999,
              background: active ? '#1d4ed8' : '#e5e7eb',
              color: active ? '#fff' : '#374151',
              fontWeight: active ? 600 : 400,
            }}>{n}. {label}</div>
          )
        })}
      </div>

      {step === 1 && (
        <div>
          <h4 style={{ margin:'0 0 8px' }}>Choose a vehicle</h4>
          <select
            value={vehicleId}
            onChange={e => setVehicleId(e.target.value)}
            style={{ padding:'6px 10px', minWidth:320 }}
          >
            <option value="">Select a vehicle</option>
            {opts.vehicles.map(v => (
              <option key={v.id} value={v.id}>
                #{v.id} - {v.year} {v.make} {v.model} ({v.customer_name || 'no owner'})
              </option>
            ))}
          </select>
        </div>
      )}

      {step === 2 && (
        <div>
          <h4 style={{ margin:'0 0 8px' }}>Pick required parts</h4>
          <div style={{ maxHeight:260, overflow:'auto', border:'1px solid #e5e7eb', borderRadius:6 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead style={{ background:'#f9fafb' }}>
                <tr>
                  <th style={{ textAlign:'left', padding:6 }}></th>
                  <th style={{ textAlign:'left', padding:6 }}>Part #</th>
                  <th style={{ textAlign:'left', padding:6 }}>Name</th>
                  <th style={{ textAlign:'left', padding:6 }}>Category</th>
                  <th style={{ textAlign:'right', padding:6 }}>OEM $</th>
                </tr>
              </thead>
              <tbody>
                {relevantParts.map(p => (
                  <tr key={p.id} style={{ borderTop:'1px solid #f3f4f6' }}>
                    <td style={{ padding:6 }}>
                      <input
                        type="checkbox"
                        checked={pickedPartIds.includes(p.id)}
                        onChange={() => togglePart(p.id)}
                      />
                    </td>
                    <td style={{ padding:6 }}>{p.part_number}</td>
                    <td style={{ padding:6 }}>{p.part_name}</td>
                    <td style={{ padding:6 }}>{p.category}</td>
                    <td style={{ padding:6, textAlign:'right' }}>${Number(p.oem_price).toFixed(2)}</td>
                  </tr>
                ))}
                {!relevantParts.length && (
                  <tr><td colSpan={5} style={{ padding:12, color:'#6b7280' }}>No parts in catalog.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:6, fontSize:12, color:'#6b7280' }}>
            {pickedPartIds.length} part(s) selected
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h4 style={{ margin:'0 0 8px' }}>Choose vendor</h4>
          <select
            value={vendorId}
            onChange={e => setVendorId(e.target.value)}
            style={{ padding:'6px 10px', minWidth:320 }}
          >
            <option value="">Select a vendor</option>
            {opts.vendors.map(v => (
              <option key={v.id} value={v.id}>
                {v.company_name} - {v.specialty || 'general'} (lead {v.lead_time_days ?? '?'}d, rating {v.rating ?? 'n/a'})
              </option>
            ))}
          </select>
        </div>
      )}

      {step === 4 && (
        <div>
          <h4 style={{ margin:'0 0 8px' }}>Set quantities</h4>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead style={{ background:'#f9fafb' }}>
              <tr>
                <th style={{ textAlign:'left', padding:6 }}>Part</th>
                <th style={{ textAlign:'right', padding:6 }}>Unit $</th>
                <th style={{ textAlign:'right', padding:6 }}>Qty</th>
                <th style={{ textAlign:'right', padding:6 }}>Line $</th>
              </tr>
            </thead>
            <tbody>
              {pickedParts.map(p => (
                <tr key={p.id} style={{ borderTop:'1px solid #f3f4f6' }}>
                  <td style={{ padding:6 }}>{p.part_number} - {p.part_name}</td>
                  <td style={{ padding:6, textAlign:'right' }}>${Number(p.oem_price).toFixed(2)}</td>
                  <td style={{ padding:6, textAlign:'right' }}>
                    <input
                      type="number" min="1" max="99"
                      value={qty[p.id] ?? 1}
                      onChange={e => setQty({ ...qty, [p.id]: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      style={{ width:60, textAlign:'right' }}
                    />
                  </td>
                  <td style={{ padding:6, textAlign:'right' }}>${lineTotal(p).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ padding:6, textAlign:'right', fontWeight:600 }}>Order total</td>
                <td style={{ padding:6, textAlign:'right', fontWeight:600 }}>${grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {step === 5 && confirmation && (
        <div style={{ padding:12, background:'#ecfdf5', border:'1px solid #10b981', borderRadius:8 }}>
          <h4 style={{ margin:'0 0 8px', color:'#065f46' }}>Order submitted</h4>
          <div>Order #: <strong>{confirmation.order_id}</strong></div>
          <div>Vehicle: #{confirmation.vehicle_id}    Vendor: #{confirmation.vendor_id}</div>
          <div>Lines: {confirmation.lines.length}    Total: ${Number(confirmation.total).toFixed(2)}</div>
          <button
            onClick={() => {
              setStep(1); setVehicleId(''); setPickedPartIds([]);
              setVendorId(''); setQty({}); setConfirmation(null)
            }}
            style={{ marginTop:8, padding:'6px 14px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:6 }}
          >Start new order</button>
        </div>
      )}

      {step < 5 && (
        <div style={{ marginTop:16, display:'flex', gap:8, justifyContent:'flex-end' }}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{ padding:'6px 14px', background:'#e5e7eb', color:'#111827', border:'none', borderRadius:6 }}
            >Back</button>
          )}
          {step < 4 && (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              style={{
                padding:'6px 14px', background: canNext ? '#1d4ed8' : '#93c5fd',
                color:'#fff', border:'none', borderRadius:6,
                cursor: canNext ? 'pointer' : 'not-allowed'
              }}
            >Next</button>
          )}
          {step === 4 && (
            <button
              onClick={submit}
              disabled={submitting || !pickedParts.length}
              style={{
                padding:'6px 14px', background:'#10b981', color:'#fff',
                border:'none', borderRadius:6,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >{submitting ? 'Submitting...' : 'Submit order'}</button>
          )}
        </div>
      )}

      {err && <div style={{ color:'#b91c1c', marginTop:10 }}>Error: {err}</div>}
    </div>
  )
}
