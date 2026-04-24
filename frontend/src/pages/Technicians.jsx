import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { first_name: '', last_name: '', email: '', phone: '', specialization: '', certification_level: '', hourly_rate: '75', years_experience: '', status: 'active', notes: '' }

export default function Technicians() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => api.getTechnicians().then(setItems).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null) }
  const handleDelete = async (id) => {
    if (!confirm('Delete this technician?')) return
    await api.deleteTechnician(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateTechnician(form.id, form)
      else await api.createTechnician(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAIMatch = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.technicianMatch({
        specialization: selected.specialization,
        certification_level: selected.certification_level,
        years_experience: selected.years_experience,
      })
      setAiResult(result)
    } catch (e) { setAiResult({ error: true, content: e.message }) }
    setAiLoading(false)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })
  const getStatusColor = (s) => ({ active: '#10b981', on_leave: '#f59e0b', inactive: '#ef4444' }[s] || '#64748b')

  return (
    <div>
      <div className="page-header">
        <div><h1>Technicians</h1><p>Manage technician profiles, skills, and certifications</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Technician</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.first_name} {selected.last_name}</h2>
              <span className="badge" style={{background: getStatusColor(selected.status)+'22', color: getStatusColor(selected.status)}}>{selected.status}</span>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Email</label><div className="value">{selected.email || '-'}</div></div>
              <div className="detail-field"><label>Phone</label><div className="value">{selected.phone || '-'}</div></div>
              <div className="detail-field"><label>Specialization</label><div className="value">{selected.specialization || '-'}</div></div>
              <div className="detail-field"><label>Certification</label><div className="value">{selected.certification_level || '-'}</div></div>
              <div className="detail-field"><label>Hourly Rate</label><div className="value money">${parseFloat(selected.hourly_rate || 0).toFixed(2)}/hr</div></div>
              <div className="detail-field"><label>Experience</label><div className="value">{selected.years_experience || '-'} years</div></div>
            </div>
            {selected.notes && <div className="detail-field" style={{marginTop:16}}><label>Notes</label><div className="value">{selected.notes}</div></div>}
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAIMatch} disabled={aiLoading}>🤖 AI Skill Assessment</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Specialization</th><th>Certification</th><th>Rate</th><th>Experience</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(t => (
                <tr key={t.id} onClick={() => api.getTechnician(t.id).then(setSelected)}>
                  <td><strong>{t.first_name} {t.last_name}</strong></td>
                  <td>{t.specialization}</td>
                  <td>{t.certification_level}</td>
                  <td className="money">${parseFloat(t.hourly_rate).toFixed(2)}/hr</td>
                  <td>{t.years_experience} yrs</td>
                  <td><span className="badge" style={{background: getStatusColor(t.status)+'22', color: getStatusColor(t.status)}}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Technician' : 'New Technician'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group"><label>First Name</label><input value={form.first_name} onChange={e => set('first_name', e.target.value)} /></div>
            <div className="form-group"><label>Last Name</label><input value={form.last_name} onChange={e => set('last_name', e.target.value)} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group full-width"><label>Specialization</label><input value={form.specialization} onChange={e => set('specialization', e.target.value)} /></div>
            <div className="form-group"><label>Certification Level</label><input value={form.certification_level} onChange={e => set('certification_level', e.target.value)} /></div>
            <div className="form-group"><label>Hourly Rate ($)</label><input type="number" step="0.01" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} /></div>
            <div className="form-group"><label>Years Experience</label><input type="number" value={form.years_experience} onChange={e => set('years_experience', e.target.value)} /></div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {['active','on_leave','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group full-width"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
