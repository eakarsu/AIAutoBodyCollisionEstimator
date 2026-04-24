import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { work_order_number: '', customer_id: '', vehicle_id: '', estimate_id: '', technician_id: '', description: '', repair_type: '', priority: 'normal', status: 'pending', start_date: '', due_date: '', labor_hours_estimated: '', notes: '' }

export default function WorkOrders() {
  const [items, setItems] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [estimates, setEstimates] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => {
    api.getWorkOrders().then(setItems)
    api.getVehicles().then(setVehicles)
    api.getCustomers().then(setCustomers)
    api.getTechnicians().then(setTechnicians)
    api.getCostEstimates().then(setEstimates)
  }
  useEffect(() => { load() }, [])

  const handleNew = () => {
    const num = `WO-2024-${String(items.length + 16).padStart(4, '0')}`
    setForm({ ...emptyForm, work_order_number: num }); setEditing(false); setShowForm(true); setSelected(null)
  }
  const handleEdit = (item) => {
    setForm({
      ...item,
      start_date: item.start_date?.split('T')[0] || '',
      due_date: item.due_date?.split('T')[0] || '',
      completed_date: item.completed_date?.split('T')[0] || ''
    }); setEditing(true); setShowForm(true); setSelected(null)
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this work order?')) return
    await api.deleteWorkOrder(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateWorkOrder(form.id, form)
      else await api.createWorkOrder(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAIAnalysis = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.analyzeWorkOrder({
        description: selected.description,
        repair_type: selected.repair_type,
        vehicle_info: selected.vehicle_name,
        labor_hours_estimated: selected.labor_hours_estimated,
        technician_name: selected.technician_name,
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
        <div><h1>Work Orders</h1><p>Manage repair work orders and track progress</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Work Order</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.work_order_number}</h2>
              <div className="flex gap-2">
                <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                <span className="badge" style={{background: getPriorityColor(selected.priority)+'22', color: getPriorityColor(selected.priority)}}>{selected.priority}</span>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Customer</label><div className="value">{selected.customer_name || '-'}</div></div>
              <div className="detail-field"><label>Vehicle</label><div className="value">{selected.vehicle_name || '-'}</div></div>
              <div className="detail-field"><label>Repair Type</label><div className="value">{selected.repair_type || '-'}</div></div>
              <div className="detail-field"><label>Technician</label><div className="value">{selected.technician_name || '-'}</div></div>
              <div className="detail-field"><label>Est. Labor Hours</label><div className="value">{selected.labor_hours_estimated || '-'} hrs</div></div>
              <div className="detail-field"><label>Actual Labor Hours</label><div className="value">{selected.labor_hours_actual || 'In progress'} hrs</div></div>
              <div className="detail-field"><label>Start Date</label><div className="value">{selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '-'}</div></div>
              <div className="detail-field"><label>Due Date</label><div className="value">{selected.due_date ? new Date(selected.due_date).toLocaleDateString() : '-'}</div></div>
              <div className="detail-field"><label>Completed</label><div className="value">{selected.completed_date ? new Date(selected.completed_date).toLocaleDateString() : 'Not yet'}</div></div>
              {selected.estimate_number && <div className="detail-field"><label>Estimate</label><div className="value">{selected.estimate_number}</div></div>}
            </div>
            <div className="detail-field" style={{marginTop:16}}><label>Description</label><div className="value">{selected.description}</div></div>
            {selected.notes && <div className="detail-field" style={{marginTop:12}}><label>Notes</label><div className="value">{selected.notes}</div></div>}
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAIAnalysis} disabled={aiLoading}>🤖 AI Work Analysis</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>WO #</th><th>Customer</th><th>Vehicle</th><th>Type</th><th>Technician</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(w => (
                <tr key={w.id} onClick={() => api.getWorkOrder(w.id).then(setSelected)}>
                  <td><strong>{w.work_order_number}</strong></td>
                  <td>{w.customer_name}</td>
                  <td>{w.vehicle_name}</td>
                  <td>{w.repair_type}</td>
                  <td>{w.technician_name}</td>
                  <td><span className="badge" style={{background: getPriorityColor(w.priority)+'22', color: getPriorityColor(w.priority)}}>{w.priority}</span></td>
                  <td><span className={`badge badge-${w.status}`}>{w.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Work Order' : 'New Work Order'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group"><label>Work Order #</label><input value={form.work_order_number} onChange={e => set('work_order_number', e.target.value)} /></div>
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
            <div className="form-group"><label>Technician</label>
              <select value={form.technician_id} onChange={e => set('technician_id', e.target.value)}>
                <option value="">Select...</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} - {t.specialization}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Estimate</label>
              <select value={form.estimate_id} onChange={e => set('estimate_id', e.target.value)}>
                <option value="">None</option>
                {estimates.map(e => <option key={e.id} value={e.id}>{e.estimate_number}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Repair Type</label>
              <select value={form.repair_type} onChange={e => set('repair_type', e.target.value)}>
                <option value="">Select...</option>
                {['Collision Repair','Major Collision','PDR','Body Repair','Paint','Glass','Specialty','Inspection'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group full-width"><label>Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div className="form-group"><label>Est. Labor Hours</label><input type="number" step="0.5" value={form.labor_hours_estimated} onChange={e => set('labor_hours_estimated', e.target.value)} /></div>
            <div className="form-group"><label>Start Date</label><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
            <div className="form-group"><label>Due Date</label><input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></div>
            <div className="form-group"><label>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                {['low','normal','high'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {['pending','in_progress','completed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group full-width"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
