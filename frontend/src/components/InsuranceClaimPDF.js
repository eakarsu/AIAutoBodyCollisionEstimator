import React, { useEffect, useState } from 'react'

export default function InsuranceClaimPDF() {
  const [vehicles, setVehicles] = useState([])
  const [selected, setSelected] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [err, setErr] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    fetch('/api/custom-views/parts-wizard/options')
      .then(r => r.json())
      .then(d => setVehicles(d.vehicles || []))
      .catch(e => setErr(String(e)))
  }, [])

  const fetchPdf = async () => {
    if (!selected) return
    setStatus('loading'); setErr(null); setPreviewUrl(null)
    try {
      const res = await fetch(`/api/custom-views/insurance-claim-pdf/${selected}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setStatus('done')
    } catch (e) {
      setErr(String(e))
      setStatus('error')
    }
  }

  return (
    <div data-testid="insurance-claim-pdf" style={{ padding:4 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <label style={{ fontSize:14 }}>Vehicle:</label>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{ padding:'6px 10px', minWidth:280 }}
        >
          <option value="">Select a vehicle</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              #{v.id} - {v.year} {v.make} {v.model} ({v.customer_name || 'no owner'})
            </option>
          ))}
        </select>
        <button
          onClick={fetchPdf}
          disabled={!selected || status === 'loading'}
          style={{
            padding:'6px 14px', background:'#1d4ed8', color:'#fff',
            border:'none', borderRadius:6, cursor: selected ? 'pointer':'not-allowed'
          }}
        >
          {status === 'loading' ? 'Generating...' : 'Generate Claim PDF'}
        </button>
        {previewUrl && (
          <a
            href={previewUrl}
            download={`insurance-claim-${selected}.pdf`}
            style={{ color:'#1d4ed8' }}
          >Download</a>
        )}
      </div>

      {err && <div style={{ color:'#b91c1c', marginTop:10 }}>Error: {err}</div>}

      {previewUrl && (
        <div style={{ marginTop:12, border:'1px solid #e5e7eb', borderRadius:8, overflow:'hidden' }}>
          <iframe
            title="claim-pdf-preview"
            src={previewUrl}
            style={{ width:'100%', height:520, border:'none' }}
          />
        </div>
      )}
    </div>
  )
}
