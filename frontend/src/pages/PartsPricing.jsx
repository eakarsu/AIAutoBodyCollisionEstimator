import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { part_number: '', part_name: '', category: '', oem_price: '', aftermarket_price: '', labor_hours: '', labor_rate: '75', vehicle_make: '', vehicle_model: '', year_range: '', supplier: '', in_stock: true }

export default function PartsPricing() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => api.getPartsPricing().then(setItems).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null) }
  const handleDelete = async (id) => {
    if (!confirm('Delete this part?')) return
    await api.deletePartPricing(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updatePartPricing(form.id, form)
      else await api.createPartPricing(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAILookup = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.partsLookup({
        part_name: selected.part_name,
        vehicle_make: selected.vehicle_make,
        vehicle_model: selected.vehicle_model,
        vehicle_year: selected.year_range
      })
      setAiResult(result)
    } catch (e) { setAiResult({ error: true, content: e.message }) }
    setAiLoading(false)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })

  return (
    <div>
      <div className="page-header">
        <div><h1>OEM Parts Pricing</h1><p>Parts catalog with OEM and aftermarket pricing</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Part</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.part_name}</h2>
              <span className={`badge ${selected.in_stock ? 'badge-completed' : 'badge-denied'}`}>{selected.in_stock ? 'In Stock' : 'Out of Stock'}</span>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Part Number</label><div className="value" style={{fontFamily:'monospace'}}>{selected.part_number}</div></div>
              <div className="detail-field"><label>Category</label><div className="value">{selected.category || '-'}</div></div>
              <div className="detail-field"><label>OEM Price</label><div className="value money">${parseFloat(selected.oem_price || 0).toLocaleString()}</div></div>
              <div className="detail-field"><label>Aftermarket Price</label><div className="value money">${selected.aftermarket_price ? parseFloat(selected.aftermarket_price).toLocaleString() : 'N/A'}</div></div>
              <div className="detail-field"><label>Labor Hours</label><div className="value">{selected.labor_hours || '-'} hrs</div></div>
              <div className="detail-field"><label>Labor Rate</label><div className="value">${selected.labor_rate}/hr</div></div>
              <div className="detail-field"><label>Vehicle</label><div className="value">{selected.vehicle_make} {selected.vehicle_model}</div></div>
              <div className="detail-field"><label>Year Range</label><div className="value">{selected.year_range || '-'}</div></div>
              <div className="detail-field"><label>Supplier</label><div className="value">{selected.supplier || '-'}</div></div>
              <div className="detail-field"><label>Total Parts+Labor</label><div className="value money large">${(parseFloat(selected.oem_price||0) + (parseFloat(selected.labor_hours||0) * parseFloat(selected.labor_rate||75))).toLocaleString()}</div></div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAILookup} disabled={aiLoading}>🤖 AI Price Lookup</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Part #</th><th>Name</th><th>Category</th><th>OEM Price</th><th>Aftermarket</th><th>Vehicle</th><th>Stock</th></tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} onClick={() => api.getPartPricing(p.id).then(setSelected)}>
                  <td style={{fontFamily:'monospace',fontSize:12}}>{p.part_number}</td>
                  <td><strong>{p.part_name}</strong></td>
                  <td>{p.category}</td>
                  <td className="money">${parseFloat(p.oem_price).toLocaleString()}</td>
                  <td>{p.aftermarket_price ? `$${parseFloat(p.aftermarket_price).toLocaleString()}` : '-'}</td>
                  <td>{p.vehicle_make} {p.vehicle_model}</td>
                  <td><span className={`badge ${p.in_stock ? 'badge-completed' : 'badge-denied'}`}>{p.in_stock ? 'Yes' : 'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Part' : 'New Part'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group"><label>Part Number</label><input value={form.part_number} onChange={e => set('part_number', e.target.value)} /></div>
            <div className="form-group"><label>Part Name</label><input value={form.part_name} onChange={e => set('part_name', e.target.value)} /></div>
            <div className="form-group"><label>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select...</option>
                {['Bumper','Body Panel','Lighting','Glass','Cooling','Exterior','Interior','Electrical'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>OEM Price ($)</label><input type="number" step="0.01" value={form.oem_price} onChange={e => set('oem_price', e.target.value)} /></div>
            <div className="form-group"><label>Aftermarket Price ($)</label><input type="number" step="0.01" value={form.aftermarket_price} onChange={e => set('aftermarket_price', e.target.value)} /></div>
            <div className="form-group"><label>Labor Hours</label><input type="number" step="0.5" value={form.labor_hours} onChange={e => set('labor_hours', e.target.value)} /></div>
            <div className="form-group"><label>Labor Rate ($/hr)</label><input type="number" value={form.labor_rate} onChange={e => set('labor_rate', e.target.value)} /></div>
            <div className="form-group"><label>Vehicle Make</label><input value={form.vehicle_make} onChange={e => set('vehicle_make', e.target.value)} /></div>
            <div className="form-group"><label>Vehicle Model</label><input value={form.vehicle_model} onChange={e => set('vehicle_model', e.target.value)} /></div>
            <div className="form-group"><label>Year Range</label><input value={form.year_range} onChange={e => set('year_range', e.target.value)} placeholder="e.g. 2020-2024" /></div>
            <div className="form-group"><label>Supplier</label><input value={form.supplier} onChange={e => set('supplier', e.target.value)} /></div>
            <div className="form-group"><label>In Stock</label>
              <select value={form.in_stock} onChange={e => set('in_stock', e.target.value === 'true')}>
                <option value="true">Yes</option><option value="false">No</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
