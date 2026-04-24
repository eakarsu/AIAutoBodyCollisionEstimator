import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { customer_id: '', year: '', make: '', model: '', trim_level: '', vin: '', color: '', mileage: '', license_plate: '' }

export default function Vehicles() {
  const [items, setItems] = useState([])
  const [customers, setCustomers] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => { api.getVehicles().then(setItems); api.getCustomers().then(setCustomers) }
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null) }
  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return
    await api.deleteVehicle(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateVehicle(form.id, form)
      else await api.createVehicle(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAIValuation = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.vehicleValuation(selected)
      setAiResult(result)
    } catch (e) { setAiResult({ error: true, content: e.message }) }
    setAiLoading(false)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })

  return (
    <div>
      <div className="page-header">
        <div><h1>Vehicles</h1><p>Manage vehicle profiles and information</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Vehicle</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <h2 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{selected.year} {selected.make} {selected.model}</h2>
            <div className="detail-grid">
              <div className="detail-field"><label>Customer</label><div className="value">{selected.customer_name || '-'}</div></div>
              <div className="detail-field"><label>Trim</label><div className="value">{selected.trim_level || '-'}</div></div>
              <div className="detail-field"><label>VIN</label><div className="value">{selected.vin || '-'}</div></div>
              <div className="detail-field"><label>Color</label><div className="value">{selected.color || '-'}</div></div>
              <div className="detail-field"><label>Mileage</label><div className="value">{selected.mileage?.toLocaleString() || '-'}</div></div>
              <div className="detail-field"><label>License Plate</label><div className="value">{selected.license_plate || '-'}</div></div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAIValuation} disabled={aiLoading}>🤖 AI Valuation</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Vehicle</th><th>Customer</th><th>VIN</th><th>Color</th><th>Mileage</th><th>Plate</th></tr></thead>
            <tbody>
              {items.map(v => (
                <tr key={v.id} onClick={() => api.getVehicle(v.id).then(setSelected)}>
                  <td><strong>{v.year} {v.make} {v.model}</strong></td>
                  <td>{v.customer_name}</td>
                  <td style={{fontFamily:'monospace',fontSize:12}}>{v.vin}</td>
                  <td>{v.color}</td>
                  <td>{v.mileage?.toLocaleString()}</td>
                  <td>{v.license_plate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Vehicle' : 'New Vehicle'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group full-width"><label>Customer</label>
              <select value={form.customer_id} onChange={e => set('customer_id', e.target.value)}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Year</label><input type="number" value={form.year} onChange={e => set('year', e.target.value)} /></div>
            <div className="form-group"><label>Make</label><input value={form.make} onChange={e => set('make', e.target.value)} /></div>
            <div className="form-group"><label>Model</label><input value={form.model} onChange={e => set('model', e.target.value)} /></div>
            <div className="form-group"><label>Trim Level</label><input value={form.trim_level} onChange={e => set('trim_level', e.target.value)} /></div>
            <div className="form-group"><label>VIN</label><input value={form.vin} onChange={e => set('vin', e.target.value)} /></div>
            <div className="form-group"><label>Color</label><input value={form.color} onChange={e => set('color', e.target.value)} /></div>
            <div className="form-group"><label>Mileage</label><input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} /></div>
            <div className="form-group"><label>License Plate</label><input value={form.license_plate} onChange={e => set('license_plate', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
