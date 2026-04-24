import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Modal from '../components/Modal'

const emptyForm = { part_name: '', part_number: '', category: '', quantity: 0, min_quantity: 5, unit_cost: 0, sell_price: 0, supplier_id: '', location: '', status: 'in_stock', last_ordered: '', notes: '' }
const categories = ['Body Panels', 'Bumpers', 'Lights', 'Glass', 'Paint', 'Hardware', 'Electrical', 'Suspension', 'Interior', 'Other']

export default function Inventory() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [stockModal, setStockModal] = useState(null)
  const [stockAdj, setStockAdj] = useState(0)

  const load = () => {
    api.getInventory().then(setItems).catch(e => setError(e.message))
    api.getSuppliers().then(setSuppliers).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowForm(true); setSelected(null) }
  const handleEdit = (item) => {
    setForm({ ...item, supplier_id: item.supplier_id || '', last_ordered: item.last_ordered ? item.last_ordered.split('T')[0] : '' })
    setEditing(true); setShowForm(true); setSelected(null)
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await api.deleteInventoryItem(id); setSelected(null); load()
  }
  const handleSave = async () => {
    try {
      const data = { ...form, supplier_id: form.supplier_id || null }
      if (editing) await api.updateInventoryItem(form.id, data)
      else await api.createInventoryItem(data)
      setShowForm(false); load()
    } catch (e) { setError(e.message) }
  }
  const handleStockAdjust = async () => {
    try {
      await api.adjustStock(stockModal.id, stockAdj)
      setStockModal(null); setStockAdj(0); load()
      if (selected) setSelected(await api.getInventoryItem(selected.id))
    } catch (e) { setError(e.message) }
  }
  const handleRowClick = async (id) => { setSelected(await api.getInventoryItem(id)) }
  const set = (k, v) => setForm({ ...form, [k]: v })

  const lowStockItems = items.filter(i => i.quantity <= i.min_quantity)
  const filtered = items.filter(i => {
    if (filter === 'low_stock' && i.quantity > i.min_quantity) return false
    if (filter !== 'all' && filter !== 'low_stock' && i.category !== filter) return false
    if (search && !i.part_name.toLowerCase().includes(search.toLowerCase()) && !(i.part_number || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalValue = items.reduce((sum, i) => sum + (i.quantity * parseFloat(i.unit_cost || 0)), 0)

  return (
    <div>
      <div className="page-header">
        <div><h1>Inventory</h1><p>Track parts stock levels and manage inventory</p></div>
        <button className="btn btn-primary" onClick={handleNew}>+ Add Item</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary cards */}
      <div className="dashboard-stats" style={{marginBottom:24}}>
        <div className="stat-card">
          <div className="stat-icon blue">📦</div>
          <div className="stat-info"><h3>{items.length}</h3><p>Total Items</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⚠️</div>
          <div className="stat-info"><h3>{lowStockItems.length}</h3><p>Low Stock Alerts</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💲</div>
          <div className="stat-info"><h3>${totalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</h3><p>Total Inventory Value</p></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <input placeholder="Search parts..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:'8px 16px',border:'2px solid #e2e8f0',borderRadius:10,fontSize:14,width:250}} />
        <button className={`btn btn-sm ${filter==='all'?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter('all')}>All</button>
        <button className={`btn btn-sm ${filter==='low_stock'?'btn-danger':'btn-secondary'}`} onClick={()=>setFilter('low_stock')}>Low Stock ({lowStockItems.length})</button>
        {categories.map(cat => (
          <button key={cat} className={`btn btn-sm ${filter===cat?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(cat)}>{cat}</button>
        ))}
      </div>

      {selected ? (
        <div className="detail-page">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => setSelected(null)}>← Back to List</button>
          <div className="detail-card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
              <h2 style={{fontSize:22,fontWeight:700}}>{selected.part_name}</h2>
              {selected.quantity <= selected.min_quantity && <span className="badge badge-denied">LOW STOCK</span>}
            </div>
            <div className="detail-grid">
              <div className="detail-field"><label>Part Number</label><div className="value">{selected.part_number || '-'}</div></div>
              <div className="detail-field"><label>Category</label><div className="value">{selected.category || '-'}</div></div>
              <div className="detail-field"><label>Quantity</label><div className="value" style={{fontSize:20,fontWeight:700}}>{selected.quantity}</div></div>
              <div className="detail-field"><label>Min Quantity</label><div className="value">{selected.min_quantity}</div></div>
              <div className="detail-field"><label>Unit Cost</label><div className="value money">${parseFloat(selected.unit_cost||0).toFixed(2)}</div></div>
              <div className="detail-field"><label>Sell Price</label><div className="value money">${parseFloat(selected.sell_price||0).toFixed(2)}</div></div>
              <div className="detail-field"><label>Supplier</label><div className="value">{selected.supplier_name || '-'}</div></div>
              <div className="detail-field"><label>Location</label><div className="value">{selected.location || '-'}</div></div>
              <div className="detail-field"><label>Last Ordered</label><div className="value">{selected.last_ordered ? new Date(selected.last_ordered).toLocaleDateString() : '-'}</div></div>
              <div className="detail-field"><label>Notes</label><div className="value">{selected.notes || '-'}</div></div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-success btn-sm" onClick={() => { setStockModal(selected); setStockAdj(0) }}>Adjust Stock</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Part Name</th><th>Part #</th><th>Category</th><th>Qty</th><th>Min</th><th>Unit Cost</th><th>Sell Price</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id} onClick={() => handleRowClick(i.id)}>
                  <td><strong>{i.part_name}</strong></td>
                  <td>{i.part_number || '-'}</td>
                  <td>{i.category || '-'}</td>
                  <td style={{fontWeight:700}}>{i.quantity}</td>
                  <td>{i.min_quantity}</td>
                  <td>${parseFloat(i.unit_cost||0).toFixed(2)}</td>
                  <td>${parseFloat(i.sell_price||0).toFixed(2)}</td>
                  <td>{i.quantity <= i.min_quantity ? <span className="badge badge-denied">Low Stock</span> : <span className="badge badge-approved">In Stock</span>}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'#64748b'}}>No items found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Item' : 'Add Inventory Item'} onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-grid">
            <div className="form-group full-width"><label>Part Name</label><input value={form.part_name} onChange={e => set('part_name', e.target.value)} /></div>
            <div className="form-group"><label>Part Number</label><input value={form.part_number || ''} onChange={e => set('part_number', e.target.value)} /></div>
            <div className="form-group"><label>Category</label>
              <select value={form.category || ''} onChange={e => set('category', e.target.value)}>
                <option value="">-- Select --</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Quantity</label><input type="number" value={form.quantity} onChange={e => set('quantity', parseInt(e.target.value)||0)} /></div>
            <div className="form-group"><label>Min Quantity (alert)</label><input type="number" value={form.min_quantity} onChange={e => set('min_quantity', parseInt(e.target.value)||0)} /></div>
            <div className="form-group"><label>Unit Cost ($)</label><input type="number" step="0.01" value={form.unit_cost} onChange={e => set('unit_cost', parseFloat(e.target.value)||0)} /></div>
            <div className="form-group"><label>Sell Price ($)</label><input type="number" step="0.01" value={form.sell_price} onChange={e => set('sell_price', parseFloat(e.target.value)||0)} /></div>
            <div className="form-group"><label>Supplier</label>
              <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
                <option value="">-- Select --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Location</label><input value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="e.g. Shelf A-3" /></div>
            <div className="form-group"><label>Last Ordered</label><input type="date" value={form.last_ordered || ''} onChange={e => set('last_ordered', e.target.value)} /></div>
            <div className="form-group full-width"><label>Notes</label><textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
          </div>
        </Modal>
      )}

      {stockModal && (
        <Modal title={`Adjust Stock: ${stockModal.part_name}`} onClose={() => setStockModal(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setStockModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleStockAdjust}>Apply</button></>}>
          <div style={{textAlign:'center'}}>
            <p style={{marginBottom:16}}>Current quantity: <strong>{stockModal.quantity}</strong></p>
            <div className="form-group">
              <label>Adjustment (positive to add, negative to subtract)</label>
              <input type="number" value={stockAdj} onChange={e => setStockAdj(parseInt(e.target.value)||0)} style={{textAlign:'center',fontSize:20}} />
            </div>
            <p style={{fontSize:18,fontWeight:700,marginTop:12}}>New quantity: {Math.max(0, stockModal.quantity + stockAdj)}</p>
          </div>
        </Modal>
      )}
    </div>
  )
}
