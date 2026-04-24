import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'

const emptyForm = { first_name: '', last_name: '', email: '', phone: '', address: '', insurance_provider: '', policy_number: '' }

export default function Customers() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const load = () => api.getCustomers().then(setItems).catch(e => setError(e.message))
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null) }
  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return
    await api.deleteCustomer(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateCustomer(form.id, form)
      else await api.createCustomer(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleRowClick = async (id) => {
    const item = await api.getCustomer(id)
    setSelected(item)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })

  return (
    <div>
      <div className="page-header">
        <div><h1>Customers</h1><p>Manage customer profiles and contact information</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Customer</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => setSelected(null)}>← Back to List</button>
          <div className="detail-card">
            <h2 style={{fontSize:22,fontWeight:700,marginBottom:20}}>{selected.first_name} {selected.last_name}</h2>
            <div className="detail-grid">
              <div className="detail-field"><label>Email</label><div className="value">{selected.email || '-'}</div></div>
              <div className="detail-field"><label>Phone</label><div className="value">{selected.phone || '-'}</div></div>
              <div className="detail-field"><label>Address</label><div className="value">{selected.address || '-'}</div></div>
              <div className="detail-field"><label>Insurance Provider</label><div className="value">{selected.insurance_provider || '-'}</div></div>
              <div className="detail-field"><label>Policy Number</label><div className="value">{selected.policy_number || '-'}</div></div>
              <div className="detail-field"><label>Created</label><div className="value">{new Date(selected.created_at).toLocaleDateString()}</div></div>
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
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Insurance</th><th>Policy #</th></tr></thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} onClick={() => handleRowClick(c.id)}>
                  <td><strong>{c.first_name} {c.last_name}</strong></td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.insurance_provider}</td>
                  <td>{c.policy_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Customer' : 'New Customer'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group"><label>First Name</label><input value={form.first_name} onChange={e => set('first_name', e.target.value)} /></div>
            <div className="form-group"><label>Last Name</label><input value={form.last_name} onChange={e => set('last_name', e.target.value)} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group full-width"><label>Address</label><input value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div className="form-group"><label>Insurance Provider</label><input value={form.insurance_provider} onChange={e => set('insurance_provider', e.target.value)} /></div>
            <div className="form-group"><label>Policy Number</label><input value={form.policy_number} onChange={e => set('policy_number', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
