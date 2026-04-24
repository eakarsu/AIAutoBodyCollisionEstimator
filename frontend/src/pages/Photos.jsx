import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'

const emptyForm = { damage_assessment_id: '', vehicle_id: '', customer_id: '', title: '', description: '', photo_url: '', photo_type: 'damage', taken_date: '', tags: '' }

export default function Photos() {
  const [items, setItems] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [assessments, setAssessments] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const load = () => {
    api.getPhotos().then(setItems)
    api.getVehicles().then(setVehicles)
    api.getCustomers().then(setCustomers)
    api.getDamageAssessments().then(setAssessments)
  }
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => {
    setForm({ ...item, taken_date: item.taken_date?.split('T')[0] || '' })
    setEditing(true); setShowForm(true); setSelected(null)
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this photo?')) return
    await api.deletePhoto(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updatePhoto(form.id, form)
      else await api.createPhoto(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const set = (k, v) => setForm({ ...form, [k]: v })

  const getTypeColor = (t) => ({ damage: '#ef4444', before_repair: '#f59e0b', during_repair: '#3b82f6', after_repair: '#10b981' }[t] || '#64748b')
  const getTypeIcon = (t) => ({ damage: '🔴', before_repair: '🟡', during_repair: '🔵', after_repair: '🟢' }[t] || '⚪')

  const filtered = filter === 'all' ? items : items.filter(p => p.photo_type === filter)

  return (
    <div>
      <div className="page-header">
        <div><h1>Photo Gallery</h1><p>Manage damage and repair documentation photos</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Photo</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {[{v:'all',l:'All'},{v:'damage',l:'Damage'},{v:'before_repair',l:'Before'},{v:'during_repair',l:'During'},{v:'after_repair',l:'After'}].map(f => (
          <button key={f.v} className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
      </div>

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => setSelected(null)}>← Back to Gallery</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.title}</h2>
              <span className="badge" style={{background: getTypeColor(selected.photo_type)+'22', color: getTypeColor(selected.photo_type)}}>{getTypeIcon(selected.photo_type)} {(selected.photo_type || '').replace('_',' ')}</span>
            </div>

            <div style={{background:'#1e293b',borderRadius:12,padding:40,textAlign:'center',marginBottom:20,color:'#94a3b8'}}>
              <div style={{fontSize:48,marginBottom:12}}>📷</div>
              <div style={{fontSize:14}}>Photo Placeholder</div>
              <div style={{fontSize:12,marginTop:4}}>Image would display here when uploaded</div>
            </div>

            <div className="detail-grid">
              <div className="detail-field"><label>Vehicle</label><div className="value">{selected.vehicle_name || '-'}</div></div>
              <div className="detail-field"><label>Customer</label><div className="value">{selected.customer_name || '-'}</div></div>
              <div className="detail-field"><label>Assessment #</label><div className="value">{selected.damage_assessment_id ? `#${selected.damage_assessment_id}` : '-'}</div></div>
              <div className="detail-field"><label>Date Taken</label><div className="value">{selected.taken_date ? new Date(selected.taken_date).toLocaleDateString() : '-'}</div></div>
            </div>
            {selected.description && <div className="detail-field" style={{marginTop:16}}><label>Description</label><div className="value">{selected.description}</div></div>}
            {selected.tags && (
              <div className="detail-field" style={{marginTop:16}}>
                <label>Tags</label>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
                  {selected.tags.split(',').map((tag, i) => (
                    <span key={i} style={{background:'#e2e8f0',padding:'4px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>{tag.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',gap:16}}>
          {filtered.map(p => (
            <div key={p.id} className="feature-card" onClick={() => api.getPhoto(p.id).then(setSelected)} style={{padding:0,overflow:'hidden'}}>
              <div style={{background:'#1e293b',padding:32,textAlign:'center',color:'#94a3b8'}}>
                <div style={{fontSize:36}}>📷</div>
              </div>
              <div style={{padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <strong style={{fontSize:14}}>{p.title}</strong>
                  <span className="badge" style={{background: getTypeColor(p.photo_type)+'22', color: getTypeColor(p.photo_type), fontSize:10}}>{getTypeIcon(p.photo_type)} {(p.photo_type || '').replace('_',' ')}</span>
                </div>
                <div style={{fontSize:12,color:'var(--text-light)'}}>{p.vehicle_name} &bull; {p.customer_name}</div>
                {p.tags && (
                  <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:8}}>
                    {p.tags.split(',').slice(0,3).map((tag, i) => (
                      <span key={i} style={{background:'#f1f5f9',padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:600,color:'var(--text-light)'}}>{tag.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Photo' : 'New Photo'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group full-width"><label>Title</label><input value={form.title} onChange={e => set('title', e.target.value)} /></div>
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
            <div className="form-group"><label>Photo Type</label>
              <select value={form.photo_type} onChange={e => set('photo_type', e.target.value)}>
                {['damage','before_repair','during_repair','after_repair'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Date Taken</label><input type="date" value={form.taken_date} onChange={e => set('taken_date', e.target.value)} /></div>
            <div className="form-group"><label>Tags (comma separated)</label><input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="bumper, front, collision" /></div>
            <div className="form-group full-width"><label>Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
