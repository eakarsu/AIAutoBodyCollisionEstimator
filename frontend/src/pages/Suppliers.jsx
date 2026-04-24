import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { company_name: '', contact_name: '', email: '', phone: '', address: '', website: '', specialty: '', rating: '', lead_time_days: '', payment_terms: '', status: 'active', notes: '' }

export default function Suppliers() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => api.getSuppliers().then(setItems).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null) }
  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return
    await api.deleteSupplier(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateSupplier(form.id, form)
      else await api.createSupplier(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAIEval = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.evaluateSupplier({
        company_name: selected.company_name,
        specialty: selected.specialty,
        rating: selected.rating,
        lead_time_days: selected.lead_time_days,
        payment_terms: selected.payment_terms,
      })
      setAiResult(result)
    } catch (e) { setAiResult({ error: true, content: e.message }) }
    setAiLoading(false)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })

  const renderStars = (rating) => {
    const r = parseFloat(rating) || 0
    return '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r))
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Supplier Directory</h1><p>Manage parts suppliers and vendor relationships</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Supplier</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.company_name}</h2>
              <span className={`badge badge-${selected.status === 'active' ? 'completed' : 'denied'}`}>{selected.status}</span>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Contact</label><div className="value">{selected.contact_name || '-'}</div></div>
              <div className="detail-field"><label>Email</label><div className="value">{selected.email || '-'}</div></div>
              <div className="detail-field"><label>Phone</label><div className="value">{selected.phone || '-'}</div></div>
              <div className="detail-field"><label>Website</label><div className="value">{selected.website || '-'}</div></div>
              <div className="detail-field"><label>Specialty</label><div className="value">{selected.specialty || '-'}</div></div>
              <div className="detail-field"><label>Rating</label><div className="value" style={{color:'#f59e0b',fontSize:18}}>{renderStars(selected.rating)} ({selected.rating})</div></div>
              <div className="detail-field"><label>Lead Time</label><div className="value">{selected.lead_time_days || '-'} days</div></div>
              <div className="detail-field"><label>Payment Terms</label><div className="value">{selected.payment_terms || '-'}</div></div>
            </div>
            {selected.address && <div className="detail-field" style={{marginTop:16}}><label>Address</label><div className="value">{selected.address}</div></div>}
            {selected.notes && <div className="detail-field" style={{marginTop:16}}><label>Notes</label><div className="value">{selected.notes}</div></div>}
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAIEval} disabled={aiLoading}>🤖 AI Supplier Evaluation</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Company</th><th>Contact</th><th>Specialty</th><th>Rating</th><th>Lead Time</th><th>Terms</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id} onClick={() => api.getSupplier(s.id).then(setSelected)}>
                  <td><strong>{s.company_name}</strong></td>
                  <td>{s.contact_name}</td>
                  <td>{s.specialty}</td>
                  <td style={{color:'#f59e0b'}}>{renderStars(s.rating)}</td>
                  <td>{s.lead_time_days} days</td>
                  <td>{s.payment_terms}</td>
                  <td><span className={`badge badge-${s.status === 'active' ? 'completed' : 'denied'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Supplier' : 'New Supplier'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group full-width"><label>Company Name</label><input value={form.company_name} onChange={e => set('company_name', e.target.value)} /></div>
            <div className="form-group"><label>Contact Name</label><input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label>Website</label><input value={form.website} onChange={e => set('website', e.target.value)} /></div>
            <div className="form-group full-width"><label>Address</label><input value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div className="form-group"><label>Specialty</label><input value={form.specialty} onChange={e => set('specialty', e.target.value)} /></div>
            <div className="form-group"><label>Rating (0-5)</label><input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => set('rating', e.target.value)} /></div>
            <div className="form-group"><label>Lead Time (days)</label><input type="number" value={form.lead_time_days} onChange={e => set('lead_time_days', e.target.value)} /></div>
            <div className="form-group"><label>Payment Terms</label><input value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} placeholder="e.g. Net 30" /></div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {['active','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group full-width"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
