import React, { useEffect, useState } from 'react'

export default function SupplementApprovalTracker() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/supplement-approval-tracker').then(r => r.json()).then(setData).catch(() => setData(null))
  }, [])
  return (
    <div className="page">
      <h1>Supplement Approval Tracker</h1>
      <p>Track post-teardown supplements, carrier evidence packets, and approval cycle time.</p>
      <div className="stats-grid">
        {data && Object.entries(data.summary).map(([key, value]) => <div className="stat-card" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}
      </div>
      <div className="card">
        {(data?.supplements || []).map(s => <div key={s.claim} style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}><strong>{s.claim}</strong><div>{s.vehicle} - ${s.amount} - {s.reason} - {s.status}</div></div>)}
      </div>
    </div>
  )
}
