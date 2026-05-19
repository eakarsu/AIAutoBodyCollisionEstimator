import React, { useEffect, useState } from 'react'
import DamageDiagram from '../components/DamageDiagram'
import RepairCostChart from '../components/RepairCostChart'
import InsuranceClaimPDF from '../components/InsuranceClaimPDF'
import PartsOrderingWizard from '../components/PartsOrderingWizard'

export default function CustomViewsPage() {
  const [tab, setTab] = useState('diagram')
  const [vehicles, setVehicles] = useState([])
  const [pickedVehicle, setPickedVehicle] = useState('')

  useEffect(() => {
    fetch('/api/custom-views/parts-wizard/options')
      .then(r => r.json())
      .then(d => {
        const list = d.vehicles || []
        setVehicles(list)
        if (list.length) setPickedVehicle(String(list[0].id))
      })
      .catch(() => {})
  }, [])

  const tabs = [
    { key: 'diagram',  label: 'Damage Diagram' },
    { key: 'cost',     label: 'Repair Cost Breakdown' },
    { key: 'claim',    label: 'Insurance Claim PDF' },
    { key: 'wizard',   label: 'Parts Ordering Wizard' },
  ]

  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <div>
          <h1>Estimator Views</h1>
          <p>Diagram damage, break down costs, generate claim PDFs, and order parts.</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding:'8px 14px', borderRadius:6, border:'1px solid #d1d5db',
              background: tab === t.key ? '#1d4ed8' : '#fff',
              color: tab === t.key ? '#fff' : '#111827',
              cursor:'pointer', fontWeight: tab === t.key ? 600 : 400,
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ background:'#fff', padding:16, border:'1px solid #e5e7eb', borderRadius:10 }}>
        {tab === 'diagram' && (
          <>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
              <label style={{ fontSize:14 }}>Vehicle:</label>
              <select
                value={pickedVehicle}
                onChange={e => setPickedVehicle(e.target.value)}
                style={{ padding:'6px 10px', minWidth:280 }}
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    #{v.id} - {v.year} {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <DamageDiagram vehicleId={pickedVehicle} />
          </>
        )}
        {tab === 'cost'   && <RepairCostChart />}
        {tab === 'claim'  && <InsuranceClaimPDF />}
        {tab === 'wizard' && <PartsOrderingWizard />}
      </div>
    </div>
  )
}
