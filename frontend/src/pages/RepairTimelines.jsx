import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { vehicle_id: '', customer_id: '', claim_id: '', repair_type: '', description: '', estimated_days: '', start_date: '', estimated_completion: '', status: 'scheduled', priority: 'normal', assigned_technician: '' }

export default function RepairTimelines() {
  const [items, setItems] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [claims, setClaims] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => {
    api.getRepairTimelines().then(setItems)
    api.getVehicles().then(setVehicles)
    api.getCustomers().then(setCustomers)
    api.getInsuranceClaims().then(setClaims)
  }
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => {
    setForm({
      ...item,
      start_date: item.start_date?.split('T')[0] || '',
      estimated_completion: item.estimated_completion?.split('T')[0] || '',
      actual_completion: item.actual_completion?.split('T')[0] || ''
    }); setEditing(true); setShowForm(true); setSelected(null)
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this timeline?')) return
    await api.deleteRepairTimeline(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateRepairTimeline(form.id, form)
      else await api.createRepairTimeline(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAITimeline = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.estimateTimeline({
        repair_type: selected.repair_type,
        description: selected.description,
        severity: selected.priority,
        vehicle_info: selected.vehicle_name
      })
      setAiResult(result)
    } catch (e) { setAiResult({ error: true, content: e.message }) }
    setAiLoading(false)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })

  const getPriorityColor = (p) => ({ high: '#ef4444', normal: '#3b82f6', low: '#10b981' }[p] || '#64748b')

  return (
    <div>
      <div className="page-header">
        <div><h1>Repair Timelines</h1><p>Track and estimate repair timelines with AI</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Timeline</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.repair_type}</h2>
              <div className="flex gap-2">
                <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                <span className="badge" style={{background: getPriorityColor(selected.priority)+'22', color: getPriorityColor(selected.priority)}}>{selected.priority}</span>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Vehicle</label><div className="value">{selected.vehicle_name || '-'}</div></div>
              <div className="detail-field"><label>Customer</label><div className="value">{selected.customer_name || '-'}</div></div>
              <div className="detail-field"><label>Estimated Days</label><div className="value" style={{fontSize:24,fontWeight:800,color:'var(--primary)'}}>{selected.estimated_days} days</div></div>
              <div className="detail-field"><label>Assigned Technician</label><div className="value">{selected.assigned_technician || '-'}</div></div>
              <div className="detail-field"><label>Start Date</label><div className="value">{selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '-'}</div></div>
              <div className="detail-field"><label>Est. Completion</label><div className="value">{selected.estimated_completion ? new Date(selected.estimated_completion).toLocaleDateString() : '-'}</div></div>
              <div className="detail-field"><label>Actual Completion</label><div className="value">{selected.actual_completion ? new Date(selected.actual_completion).toLocaleDateString() : 'In progress'}</div></div>
            </div>
            <div className="detail-field" style={{marginTop:16}}><label>Description</label><div className="value">{selected.description}</div></div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAITimeline} disabled={aiLoading}>🤖 AI Timeline Analysis</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Repair Type</th><th>Vehicle</th><th>Customer</th><th>Days</th><th>Technician</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(t => (
                <tr key={t.id} onClick={() => api.getRepairTimeline(t.id).then(setSelected)}>
                  <td><strong>{t.repair_type}</strong></td>
                  <td>{t.vehicle_name}</td>
                  <td>{t.customer_name}</td>
                  <td style={{fontWeight:700}}>{t.estimated_days}</td>
                  <td>{t.assigned_technician}</td>
                  <td><span className="badge" style={{background: getPriorityColor(t.priority)+'22', color: getPriorityColor(t.priority)}}>{t.priority}</span></td>
                  <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Timeline' : 'New Timeline'} onClose={() => setShowForm(false)}
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
            <div className="form-group"><label>Related Claim</label>
              <select value={form.claim_id} onChange={e => set('claim_id', e.target.value)}>
                <option value="">None</option>
                {claims.map(c => <option key={c.id} value={c.id}>{c.claim_number}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Repair Type</label><input value={form.repair_type} onChange={e => set('repair_type', e.target.value)} placeholder="e.g. Bumper Replacement" /></div>
            <div className="form-group full-width"><label>Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div className="form-group"><label>Estimated Days</label><input type="number" value={form.estimated_days} onChange={e => set('estimated_days', e.target.value)} /></div>
            <div className="form-group"><label>Start Date</label><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
            <div className="form-group"><label>Est. Completion</label><input type="date" value={form.estimated_completion} onChange={e => set('estimated_completion', e.target.value)} /></div>
            <div className="form-group"><label>Assigned Technician</label><input value={form.assigned_technician} onChange={e => set('assigned_technician', e.target.value)} /></div>
            <div className="form-group"><label>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                {['low','normal','high'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {['scheduled','in_progress','completed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
