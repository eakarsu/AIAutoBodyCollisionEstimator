import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import AIResultDisplay from '../components/AIResultDisplay'

const emptyForm = { invoice_number: '', customer_id: '', vehicle_id: '', estimate_id: '', work_order_id: '', parts_total: '', labor_total: '', paint_total: '', other_charges: '', payment_method: '', payment_status: 'unpaid', due_date: '', notes: '' }

export default function Invoices() {
  const [items, setItems] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [estimates, setEstimates] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => {
    api.getInvoices().then(setItems)
    api.getVehicles().then(setVehicles)
    api.getCustomers().then(setCustomers)
    api.getWorkOrders().then(setWorkOrders)
    api.getCostEstimates().then(setEstimates)
  }
  useEffect(() => { load() }, [])

  const handleNew = () => {
    const num = `INV-2024-${String(items.length + 16).padStart(4, '0')}`
    setForm({ ...emptyForm, invoice_number: num }); setEditing(false); setShowForm(true); setSelected(null)
  }
  const handleEdit = (item) => {
    setForm({ ...item, due_date: item.due_date?.split('T')[0] || '', paid_date: item.paid_date?.split('T')[0] || '' })
    setEditing(true); setShowForm(true); setSelected(null)
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return
    await api.deleteInvoice(id); setSelected(null); load()
  }

  const handleSave = async () => {
    try {
      if (editing) await api.updateInvoice(form.id, form)
      else await api.createInvoice(form)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }

  const handleAIAnalysis = async () => {
    setAiLoading(true); setAiResult(null)
    try {
      const result = await api.analyzeInvoice({
        parts_total: selected.parts_total,
        labor_total: selected.labor_total,
        paint_total: selected.paint_total,
        other_charges: selected.other_charges,
        total: selected.total,
        vehicle_info: selected.vehicle_name,
        payment_status: selected.payment_status,
      })
      setAiResult(result)
    } catch (e) { setAiResult({ error: true, content: e.message }) }
    setAiLoading(false)
  }

  const set = (k, v) => setForm({ ...form, [k]: v })
  const getPayColor = (s) => ({ paid: '#10b981', partial: '#f59e0b', unpaid: '#ef4444', overdue: '#991b1b' }[s] || '#64748b')

  return (
    <div>
      <div className="page-header">
        <div><h1>Invoices</h1><p>Generate and manage billing invoices</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Invoice</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => { setSelected(null); setAiResult(null) }}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.invoice_number}</h2>
              <span className="badge" style={{background: getPayColor(selected.payment_status)+'22', color: getPayColor(selected.payment_status)}}>{selected.payment_status}</span>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Customer</label><div className="value">{selected.customer_name || '-'}</div></div>
              <div className="detail-field"><label>Vehicle</label><div className="value">{selected.vehicle_name || '-'}</div></div>
              {selected.work_order_number && <div className="detail-field"><label>Work Order</label><div className="value">{selected.work_order_number}</div></div>}
              {selected.estimate_number && <div className="detail-field"><label>Estimate</label><div className="value">{selected.estimate_number}</div></div>}
              <div className="detail-field"><label>Payment Method</label><div className="value">{selected.payment_method || '-'}</div></div>
              <div className="detail-field"><label>Due Date</label><div className="value">{selected.due_date ? new Date(selected.due_date).toLocaleDateString() : '-'}</div></div>
              {selected.paid_date && <div className="detail-field"><label>Paid Date</label><div className="value">{new Date(selected.paid_date).toLocaleDateString()}</div></div>}
            </div>

            <div style={{marginTop:24,background:'#f8fafc',borderRadius:12,padding:24}}>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Invoice Breakdown</h3>
              <div style={{display:'grid',gap:8}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>Parts</span><span className="money">${parseFloat(selected.parts_total||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>Labor</span><span className="money">${parseFloat(selected.labor_total||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>Paint & Materials</span><span className="money">${parseFloat(selected.paint_total||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span>Other Charges</span><span className="money">${parseFloat(selected.other_charges||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontWeight:600}}>
                  <span>Subtotal</span><span className="money">${parseFloat(selected.subtotal||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0'}}>
                  <span>Tax ({((selected.tax_rate||0.0825)*100).toFixed(2)}%)</span><span>${parseFloat(selected.tax_amount||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderTop:'2px solid var(--primary)',fontSize:20,fontWeight:800}}>
                  <span>Total</span><span className="money">${parseFloat(selected.total||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',color:'var(--success)'}}>
                  <span>Amount Paid</span><span>${parseFloat(selected.amount_paid||0).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderTop:'1px solid var(--border)',fontSize:18,fontWeight:700,color: parseFloat(selected.balance_due||0) > 0 ? 'var(--danger)' : 'var(--success)'}}>
                  <span>Balance Due</span><span>${parseFloat(selected.balance_due||0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selected.notes && <div className="detail-field" style={{marginTop:16}}><label>Notes</label><div className="value">{selected.notes}</div></div>}
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-info btn-sm" onClick={handleAIAnalysis} disabled={aiLoading}>🤖 AI Invoice Analysis</button>
            </div>
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Invoice #</th><th>Customer</th><th>Vehicle</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(inv => (
                <tr key={inv.id} onClick={() => api.getInvoice(inv.id).then(setSelected)}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>{inv.customer_name}</td>
                  <td>{inv.vehicle_name}</td>
                  <td className="money">${parseFloat(inv.total||0).toLocaleString()}</td>
                  <td>${parseFloat(inv.amount_paid||0).toLocaleString()}</td>
                  <td style={{fontWeight:700,color: parseFloat(inv.balance_due||0) > 0 ? 'var(--danger)' : 'var(--success)'}}>${parseFloat(inv.balance_due||0).toLocaleString()}</td>
                  <td><span className="badge" style={{background: getPayColor(inv.payment_status)+'22', color: getPayColor(inv.payment_status)}}>{inv.payment_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Invoice' : 'New Invoice'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group"><label>Invoice Number</label><input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} /></div>
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
            <div className="form-group"><label>Work Order</label>
              <select value={form.work_order_id} onChange={e => set('work_order_id', e.target.value)}>
                <option value="">None</option>
                {workOrders.map(w => <option key={w.id} value={w.id}>{w.work_order_number}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Parts Total ($)</label><input type="number" step="0.01" value={form.parts_total} onChange={e => set('parts_total', e.target.value)} /></div>
            <div className="form-group"><label>Labor Total ($)</label><input type="number" step="0.01" value={form.labor_total} onChange={e => set('labor_total', e.target.value)} /></div>
            <div className="form-group"><label>Paint Total ($)</label><input type="number" step="0.01" value={form.paint_total} onChange={e => set('paint_total', e.target.value)} /></div>
            <div className="form-group"><label>Other Charges ($)</label><input type="number" step="0.01" value={form.other_charges} onChange={e => set('other_charges', e.target.value)} /></div>
            <div className="form-group"><label>Payment Method</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                <option value="">Select...</option>
                {['Insurance','Credit Card','Debit Card','Cash','Check','Financing'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Payment Status</label>
              <select value={form.payment_status} onChange={e => set('payment_status', e.target.value)}>
                {['unpaid','partial','paid','overdue'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Due Date</label><input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></div>
            <div className="form-group full-width"><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
