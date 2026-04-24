import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'

const emptyForm = { customer_id: '', vehicle_id: '', title: '', appointment_type: 'estimate', date: '', time_start: '', time_end: '', technician_id: '', status: 'scheduled', notes: '' }

const typeLabels = { estimate: 'Estimate', repair: 'Repair', inspection: 'Inspection', pickup: 'Pick Up', followup: 'Follow Up' }
const statusLabels = { scheduled: 'Scheduled', confirmed: 'Confirmed', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No Show' }

export default function Appointments() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [filter, setFilter] = useState('all')

  const load = () => {
    api.getAppointments().then(setItems).catch(e => setError(e.message))
    api.getCustomers().then(setCustomers).catch(() => {})
    api.getVehicles().then(setVehicles).catch(() => {})
    api.getTechnicians().then(setTechnicians).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => {
    setForm({
      ...item,
      date: item.date ? item.date.split('T')[0] : '',
      time_start: item.time_start || '',
      time_end: item.time_end || '',
      customer_id: item.customer_id || '',
      vehicle_id: item.vehicle_id || '',
      technician_id: item.technician_id || '',
    })
    setEditing(true); setShowForm(true); setSelected(null)
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this appointment?')) return
    await api.deleteAppointment(id); setSelected(null); load()
  }
  const handleSave = async () => {
    try {
      const data = { ...form, customer_id: form.customer_id || null, vehicle_id: form.vehicle_id || null, technician_id: form.technician_id || null }
      if (editing) await api.updateAppointment(form.id, data)
      else await api.createAppointment(data)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }
  const handleRowClick = async (id) => { setSelected(await api.getAppointment(id)) }
  const set = (k, v) => setForm({ ...form, [k]: v })

  const today = new Date().toISOString().split('T')[0]
  const filtered = filter === 'all' ? items
    : filter === 'today' ? items.filter(a => a.date && a.date.split('T')[0] === today)
    : filter === 'upcoming' ? items.filter(a => a.date && a.date.split('T')[0] >= today && a.status !== 'completed' && a.status !== 'cancelled')
    : items.filter(a => a.status === filter)

  return (
    <div>
      <div className="page-header">
        <div><h1>Appointments</h1><p>Schedule and manage customer appointments</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Appointment</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {[['all','All'],['today','Today'],['upcoming','Upcoming'],['scheduled','Scheduled'],['confirmed','Confirmed'],['completed','Completed'],['cancelled','Cancelled']].map(([val,label]) => (
          <button key={val} className={`btn btn-sm ${filter===val?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(val)}>{label}</button>
        ))}
      </div>

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => setSelected(null)}>← Back to List</button>
          <div className="detail-card">
            <h2 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{selected.title}</h2>
            <div className="detail-grid">
              <div className="detail-field"><label>Type</label><div className="value">{typeLabels[selected.appointment_type] || selected.appointment_type}</div></div>
              <div className="detail-field"><label>Status</label><div className="value"><span className={`badge badge-${selected.status}`}>{statusLabels[selected.status] || selected.status}</span></div></div>
              <div className="detail-field"><label>Date</label><div className="value">{selected.date ? new Date(selected.date).toLocaleDateString() : '-'}</div></div>
              <div className="detail-field"><label>Time</label><div className="value">{selected.time_start}{selected.time_end ? ` - ${selected.time_end}` : ''}</div></div>
              <div className="detail-field"><label>Customer</label><div className="value">{selected.customer_name || '-'}</div></div>
              <div className="detail-field"><label>Vehicle</label><div className="value">{selected.vehicle_name || '-'}</div></div>
              <div className="detail-field"><label>Technician</label><div className="value">{selected.technician_name || '-'}</div></div>
              <div className="detail-field"><label>Notes</label><div className="value">{selected.notes || '-'}</div></div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Time</th><th>Customer</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} onClick={() => handleRowClick(a.id)}>
                  <td><strong>{a.title}</strong></td>
                  <td>{typeLabels[a.appointment_type] || a.appointment_type}</td>
                  <td>{a.date ? new Date(a.date).toLocaleDateString() : '-'}</td>
                  <td>{a.time_start}{a.time_end ? ` - ${a.time_end}` : ''}</td>
                  <td>{a.customer_name || '-'}</td>
                  <td><span className={`badge badge-${a.status}`}>{statusLabels[a.status] || a.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'#64748b'}}>No appointments found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Appointment' : 'New Appointment'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group full-width"><label>Title</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Estimate for fender repair" /></div>
            <div className="form-group"><label>Type</label>
              <select value={form.appointment_type} onChange={e => set('appointment_type', e.target.value)}>
                {Object.entries(typeLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(statusLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div className="form-group"><label>Start Time</label><input type="time" value={form.time_start} onChange={e => set('time_start', e.target.value)} /></div>
            <div className="form-group"><label>End Time</label><input type="time" value={form.time_end} onChange={e => set('time_end', e.target.value)} /></div>
            <div className="form-group"><label>Customer</label>
              <select value={form.customer_id} onChange={e => set('customer_id', e.target.value)}>
                <option value="">-- Select --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Vehicle</label>
              <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}>
                <option value="">-- Select --</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Technician</label>
              <select value={form.technician_id} onChange={e => set('technician_id', e.target.value)}>
                <option value="">-- Select --</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
            <div className="form-group full-width"><label>Notes</label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
