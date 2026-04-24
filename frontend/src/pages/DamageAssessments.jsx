import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { vehicle_id: '', customer_id: '', description: '', damage_type: '', severity: 'moderate', location_on_vehicle: '', estimated_cost: '', status: 'pending' }

export default function DamageAssessments() {
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
    api.getDamageAssessments().then(setItems)
    api.getVehicles().then(setVehicles)
    api.getCustomers().then(setCustomers)
  }
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null) }
  const handleDelete = async (id) => {
    if (!confirm('Delete this assessment?')) return
    await api.deleteDamageAssessment(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateDamageAssessment(form.id, form)
      else await api.createDamageAssessment(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAIAnalysis = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.analyzeDamage({
        description: selected.description,
        damage_type: selected.damage_type,
        severity: selected.severity,
        location_on_vehicle: selected.location_on_vehicle,
        vehicle_info: selected.vehicle_name
      })
      setAiResult(result)
    } catch (e) { setAiResult({ error: true, content: e.message }) }
    setAiLoading(false)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })

  return (
    <div>
      <div className="page-header">
        <div><h1>Damage Assessments</h1><p>AI-powered vehicle damage analysis and assessment</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Assessment</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>Assessment #{selected.id}</h2>
              <span className={`badge badge-${selected.severity}`}>{selected.severity}</span>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Vehicle</label><div className="value">{selected.vehicle_name || '-'}</div></div>
              <div className="detail-field"><label>Customer</label><div className="value">{selected.customer_name || '-'}</div></div>
              <div className="detail-field"><label>Damage Type</label><div className="value">{selected.damage_type || '-'}</div></div>
              <div className="detail-field"><label>Severity</label><div className="value"><span className={`badge badge-${selected.severity}`}>{selected.severity}</span></div></div>
              <div className="detail-field"><label>Location</label><div className="value">{selected.location_on_vehicle || '-'}</div></div>
              <div className="detail-field"><label>Estimated Cost</label><div className="value money">${parseFloat(selected.estimated_cost || 0).toLocaleString()}</div></div>
              <div className="detail-field"><label>Status</label><div className="value"><span className={`badge badge-${selected.status}`}>{selected.status}</span></div></div>
              <div className="detail-field"><label>Created</label><div className="value">{new Date(selected.created_at).toLocaleDateString()}</div></div>
            </div>
            <div className="detail-field" style={{marginTop:16}}><label>Description</label><div className="value">{selected.description}</div></div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAIAnalysis} disabled={aiLoading}>🤖 AI Damage Analysis</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Vehicle</th><th>Customer</th><th>Type</th><th>Severity</th><th>Cost</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id} onClick={() => api.getDamageAssessment(a.id).then(setSelected)}>
                  <td>#{a.id}</td>
                  <td><strong>{a.vehicle_name}</strong></td>
                  <td>{a.customer_name}</td>
                  <td>{a.damage_type}</td>
                  <td><span className={`badge badge-${a.severity}`}>{a.severity}</span></td>
                  <td className="money">${parseFloat(a.estimated_cost || 0).toLocaleString()}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Assessment' : 'New Assessment'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
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
            <div className="form-group"><label>Damage Type</label>
              <select value={form.damage_type} onChange={e => set('damage_type', e.target.value)}>
                <option value="">Select...</option>
                {['Collision','Weather','Animal','Minor Impact','Road Hazard','Vandalism'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Severity</label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)}>
                {['minor','moderate','severe','total_loss'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group full-width"><label>Location on Vehicle</label><input value={form.location_on_vehicle} onChange={e => set('location_on_vehicle', e.target.value)} /></div>
            <div className="form-group full-width"><label>Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div className="form-group"><label>Estimated Cost ($)</label><input type="number" value={form.estimated_cost} onChange={e => set('estimated_cost', e.target.value)} /></div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {['pending','assessed','in_progress','completed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
