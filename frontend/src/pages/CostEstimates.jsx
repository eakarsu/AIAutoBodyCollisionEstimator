import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { estimate_number: '', customer_id: '', vehicle_id: '', damage_assessment_id: '', parts_cost: '', labor_cost: '', paint_cost: '', additional_cost: '', notes: '', status: 'draft' }

export default function CostEstimates() {
  const [items, setItems] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [assessments, setAssessments] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => {
    api.getCostEstimates().then(setItems)
    api.getVehicles().then(setVehicles)
    api.getCustomers().then(setCustomers)
    api.getDamageAssessments().then(setAssessments)
  }
  useEffect(() => { load() }, [])

  const handleNew = () => {
    const num = `EST-2024-${String(items.length + 16).padStart(4, '0')}`
    setForm({ ...emptyForm, estimate_number: num }); setEditing(false); setShowForm(true); setSelected(null)
  }
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null) }
  const handleDelete = async (id) => {
    if (!confirm('Delete this estimate?')) return
    await api.deleteCostEstimate(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateCostEstimate(form.id, form)
      else await api.createCostEstimate(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAICost = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.analyzeCost({
        parts_cost: selected.parts_cost,
        labor_cost: selected.labor_cost,
        paint_cost: selected.paint_cost,
        additional_cost: selected.additional_cost,
        vehicle_info: selected.vehicle_name,
        damage_description: selected.notes
      })
      setAiResult(result)
    } catch (e) { setAiResult({ error: true, content: e.message }) }
    setAiLoading(false)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })

  return (
    <div>
      <div className="page-header">
        <div><h1>Cost Estimates</h1><p>Generate and manage repair cost estimates</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Estimate</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.estimate_number}</h2>
              <span className={`badge badge-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Customer</label><div className="value">{selected.customer_name || '-'}</div></div>
              <div className="detail-field"><label>Vehicle</label><div className="value">{selected.vehicle_name || '-'}</div></div>
            </div>

            <div style={{marginTop:24,background:'#f8fafc',borderRadius:12,padding:24}}>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Cost Breakdown</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>Parts</span><span className="money">${parseFloat(selected.parts_cost||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>Labor</span><span className="money">${parseFloat(selected.labor_cost||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>Paint & Materials</span><span className="money">${parseFloat(selected.paint_cost||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>Additional</span><span className="money">${parseFloat(selected.additional_cost||0).toLocaleString()}</span>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',marginTop:8,borderBottom:'1px solid var(--border)'}}>
                <span style={{fontWeight:600}}>Subtotal</span><span className="money">${parseFloat(selected.subtotal||0).toLocaleString()}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0'}}>
                <span>Tax ({((selected.tax_rate||0.0825)*100).toFixed(2)}%)</span><span>${parseFloat(selected.tax_amount||0).toLocaleString()}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',marginTop:8,borderTop:'2px solid var(--primary)',fontSize:22,fontWeight:800}}>
                <span>Total</span><span className="money large">${parseFloat(selected.total||0).toLocaleString()}</span>
              </div>
            </div>

            {selected.notes && <div className="detail-field" style={{marginTop:16}}><label>Notes</label><div className="value">{selected.notes}</div></div>}
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAICost} disabled={aiLoading}>🤖 AI Cost Analysis</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Estimate #</th><th>Customer</th><th>Vehicle</th><th>Parts</th><th>Labor</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(e => (
                <tr key={e.id} onClick={() => api.getCostEstimate(e.id).then(setSelected)}>
                  <td><strong>{e.estimate_number}</strong></td>
                  <td>{e.customer_name}</td>
                  <td>{e.vehicle_name}</td>
                  <td>${parseFloat(e.parts_cost||0).toLocaleString()}</td>
                  <td>${parseFloat(e.labor_cost||0).toLocaleString()}</td>
                  <td className="money" style={{fontWeight:700}}>${parseFloat(e.total||0).toLocaleString()}</td>
                  <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Estimate' : 'New Estimate'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group"><label>Estimate Number</label><input value={form.estimate_number} onChange={e => set('estimate_number', e.target.value)} /></div>
            <div className="form-group"><label>Customer</label>
              <select value={form.customer_id} onChange={e => set('customer_id', e.target.value)}>
                <option value="">Select...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Vehicle</label>
              <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}>
                <option value="">Select...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Damage Assessment</label>
              <select value={form.damage_assessment_id} onChange={e => set('damage_assessment_id', e.target.value)}>
                <option value="">None</option>
                {assessments.map(a => <option key={a.id} value={a.id}>#{a.id} - {a.vehicle_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Parts Cost ($)</label><input type="number" step="0.01" value={form.parts_cost} onChange={e => set('parts_cost', e.target.value)} /></div>
            <div className="form-group"><label>Labor Cost ($)</label><input type="number" step="0.01" value={form.labor_cost} onChange={e => set('labor_cost', e.target.value)} /></div>
            <div className="form-group"><label>Paint Cost ($)</label><input type="number" step="0.01" value={form.paint_cost} onChange={e => set('paint_cost', e.target.value)} /></div>
            <div className="form-group"><label>Additional Cost ($)</label><input type="number" step="0.01" value={form.additional_cost} onChange={e => set('additional_cost', e.target.value)} /></div>
            <div className="form-group full-width"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {['draft','pending','in_review','approved','completed','total_loss'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
