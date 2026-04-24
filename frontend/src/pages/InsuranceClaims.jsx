import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { claim_number: '', customer_id: '', vehicle_id: '', insurance_company: '', adjuster_name: '', adjuster_phone: '', adjuster_email: '', date_of_loss: '', loss_description: '', claim_amount: '', deductible: '', status: 'filed' }

export default function InsuranceClaims() {
  const [items, setItems] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => {
    api.getInsuranceClaims().then(setItems)
    api.getVehicles().then(setVehicles)
    api.getCustomers().then(setCustomers)
  }
  useEffect(() => { load() }, [])

  const handleNew = () => {
    const num = `CLM-2024-${String(items.length + 16).padStart(4, '0')}`
    setForm({ ...emptyForm, claim_number: num }); setEditing(false); setShowForm(true); setSelected(null)
  }
  const handleEdit = (item) => { setForm({ ...item, date_of_loss: item.date_of_loss?.split('T')[0] || '' }); setEditing(true); setShowForm(true); setSelected(null) }
  const handleDelete = async (id) => {
    if (!confirm('Delete this claim?')) return
    await api.deleteInsuranceClaim(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateInsuranceClaim(form.id, form)
      else await api.createInsuranceClaim(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAIClaim = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.prepareClaim({
        loss_description: selected.loss_description,
        vehicle_info: selected.vehicle_name,
        damage_details: selected.loss_description,
        insurance_company: selected.insurance_company
      })
      setAiResult(result)
    } catch (e) { setAiResult({ error: true, content: e.message }) }
    setAiLoading(false)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })

  return (
    <div>
      <div className="page-header">
        <div><h1>Insurance Claims</h1><p>Manage and prepare insurance claims with AI assistance</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Claim</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.claim_number}</h2>
              <span className={`badge badge-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Customer</label><div className="value">{selected.customer_name || '-'}</div></div>
              <div className="detail-field"><label>Vehicle</label><div className="value">{selected.vehicle_name || '-'}</div></div>
              <div className="detail-field"><label>Insurance Company</label><div className="value">{selected.insurance_company}</div></div>
              <div className="detail-field"><label>Adjuster</label><div className="value">{selected.adjuster_name || '-'}</div></div>
              <div className="detail-field"><label>Adjuster Phone</label><div className="value">{selected.adjuster_phone || '-'}</div></div>
              <div className="detail-field"><label>Adjuster Email</label><div className="value">{selected.adjuster_email || '-'}</div></div>
              <div className="detail-field"><label>Date of Loss</label><div className="value">{selected.date_of_loss ? new Date(selected.date_of_loss).toLocaleDateString() : '-'}</div></div>
              <div className="detail-field"><label>Claim Amount</label><div className="value money">${parseFloat(selected.claim_amount || 0).toLocaleString()}</div></div>
              <div className="detail-field"><label>Deductible</label><div className="value">${parseFloat(selected.deductible || 0).toLocaleString()}</div></div>
              <div className="detail-field"><label>Net Payout</label><div className="value money large">${(parseFloat(selected.claim_amount||0) - parseFloat(selected.deductible||0)).toLocaleString()}</div></div>
            </div>
            <div className="detail-field" style={{marginTop:16}}><label>Loss Description</label><div className="value">{selected.loss_description}</div></div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAIClaim} disabled={aiLoading}>🤖 AI Claim Preparation</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Claim #</th><th>Customer</th><th>Vehicle</th><th>Insurance</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} onClick={() => api.getInsuranceClaim(c.id).then(setSelected)}>
                  <td><strong>{c.claim_number}</strong></td>
                  <td>{c.customer_name}</td>
                  <td>{c.vehicle_name}</td>
                  <td>{c.insurance_company}</td>
                  <td className="money">${parseFloat(c.claim_amount || 0).toLocaleString()}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Claim' : 'New Claim'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group"><label>Claim Number</label><input value={form.claim_number} onChange={e => set('claim_number', e.target.value)} /></div>
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
            <div className="form-group"><label>Insurance Company</label><input value={form.insurance_company} onChange={e => set('insurance_company', e.target.value)} /></div>
            <div className="form-group"><label>Adjuster Name</label><input value={form.adjuster_name} onChange={e => set('adjuster_name', e.target.value)} /></div>
            <div className="form-group"><label>Adjuster Phone</label><input value={form.adjuster_phone} onChange={e => set('adjuster_phone', e.target.value)} /></div>
            <div className="form-group"><label>Adjuster Email</label><input type="email" value={form.adjuster_email} onChange={e => set('adjuster_email', e.target.value)} /></div>
            <div className="form-group"><label>Date of Loss</label><input type="date" value={form.date_of_loss} onChange={e => set('date_of_loss', e.target.value)} /></div>
            <div className="form-group full-width"><label>Loss Description</label><textarea value={form.loss_description} onChange={e => set('loss_description', e.target.value)} /></div>
            <div className="form-group"><label>Claim Amount ($)</label><input type="number" step="0.01" value={form.claim_amount} onChange={e => set('claim_amount', e.target.value)} /></div>
            <div className="form-group"><label>Deductible ($)</label><input type="number" step="0.01" value={form.deductible} onChange={e => set('deductible', e.target.value)} /></div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {['filed','in_review','approved','denied','total_loss'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
