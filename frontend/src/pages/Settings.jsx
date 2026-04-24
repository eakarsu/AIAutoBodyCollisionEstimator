import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

const defaultSettings = {
  general: {
    shop_name: 'Auto Body Shop',
    shop_address: '',
    shop_phone: '',
    shop_email: '',
    shop_website: '',
    shop_license: '',
  },
  financial: {
    default_tax_rate: '8.25',
    default_labor_rate: '75.00',
    default_paint_rate: '50.00',
    currency: 'USD',
    payment_terms: 'Net 30',
  },
  operations: {
    business_hours_start: '08:00',
    business_hours_end: '17:00',
    business_days: 'Mon-Fri',
    max_daily_appointments: '10',
    default_appointment_duration: '60',
    default_estimate_validity: '30',
  },
  notifications: {
    low_stock_alert: 'true',
    appointment_reminder: 'true',
    payment_overdue_days: '30',
  }
}

const categoryLabels = {
  general: 'Shop Information',
  financial: 'Financial Settings',
  operations: 'Operations',
  notifications: 'Notifications & Alerts',
}

const fieldLabels = {
  shop_name: 'Shop Name', shop_address: 'Address', shop_phone: 'Phone', shop_email: 'Email',
  shop_website: 'Website', shop_license: 'License Number',
  default_tax_rate: 'Tax Rate (%)', default_labor_rate: 'Labor Rate ($/hr)', default_paint_rate: 'Paint Rate ($/hr)',
  currency: 'Currency', payment_terms: 'Payment Terms',
  business_hours_start: 'Opening Time', business_hours_end: 'Closing Time', business_days: 'Business Days',
  max_daily_appointments: 'Max Daily Appointments', default_appointment_duration: 'Default Appointment (min)',
  default_estimate_validity: 'Estimate Valid (days)',
  low_stock_alert: 'Low Stock Alerts', appointment_reminder: 'Appointment Reminders',
  payment_overdue_days: 'Payment Overdue After (days)',
}

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    api.getSettings().then(data => {
      // Merge loaded settings with defaults
      const merged = {}
      for (const [cat, fields] of Object.entries(defaultSettings)) {
        merged[cat] = { ...fields }
        if (data[cat]) {
          for (const [key, val] of Object.entries(data[cat])) {
            merged[cat][key] = val
          }
        }
      }
      setSettings(merged)
    }).catch(e => setError(e.message))
  }, [])

  const handleChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }))
  }

  const handleSave = async () => {
    setSaving(true); setMessage(''); setError('')
    try {
      const bulk = []
      for (const [cat, fields] of Object.entries(settings)) {
        for (const [key, value] of Object.entries(fields)) {
          bulk.push({ key, value: String(value), category: cat })
        }
      }
      await api.bulkUpdateSettings(bulk)
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (e) { setError(e.message) }
    setSaving(false)
  }

  const renderField = (category, key, value) => {
    const label = fieldLabels[key] || key.replace(/_/g, ' ')

    // Boolean toggles
    if (value === 'true' || value === 'false') {
      return (
        <div className="form-group" key={key}>
          <label>{label}</label>
          <div style={{display:'flex',alignItems:'center',gap:12,marginTop:4}}>
            <button
              className={`btn btn-sm ${value === 'true' ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => handleChange(category, key, value === 'true' ? 'false' : 'true')}
              style={{minWidth:80}}
            >
              {value === 'true' ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      )
    }

    // Time fields
    if (key.includes('hours_start') || key.includes('hours_end')) {
      return (
        <div className="form-group" key={key}>
          <label>{label}</label>
          <input type="time" value={value} onChange={e => handleChange(category, key, e.target.value)} />
        </div>
      )
    }

    // Select fields
    if (key === 'currency') {
      return (
        <div className="form-group" key={key}>
          <label>{label}</label>
          <select value={value} onChange={e => handleChange(category, key, e.target.value)}>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
          </select>
        </div>
      )
    }

    if (key === 'payment_terms') {
      return (
        <div className="form-group" key={key}>
          <label>{label}</label>
          <select value={value} onChange={e => handleChange(category, key, e.target.value)}>
            <option value="Due on Receipt">Due on Receipt</option>
            <option value="Net 15">Net 15</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 45">Net 45</option>
            <option value="Net 60">Net 60</option>
          </select>
        </div>
      )
    }

    // Number fields
    if (['default_tax_rate','default_labor_rate','default_paint_rate','max_daily_appointments','default_appointment_duration','default_estimate_validity','payment_overdue_days'].includes(key)) {
      return (
        <div className="form-group" key={key}>
          <label>{label}</label>
          <input type="number" step={key.includes('rate') ? '0.01' : '1'} value={value} onChange={e => handleChange(category, key, e.target.value)} />
        </div>
      )
    }

    // Address - full width
    if (key === 'shop_address') {
      return (
        <div className="form-group full-width" key={key}>
          <label>{label}</label>
          <input value={value} onChange={e => handleChange(category, key, e.target.value)} />
        </div>
      )
    }

    // Default text input
    return (
      <div className="form-group" key={key}>
        <label>{label}</label>
        <input value={value} onChange={e => handleChange(category, key, e.target.value)} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Settings</h1><p>Configure shop information and business preferences</p></div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div style={{display:'flex',gap:8,marginBottom:24}}>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button key={key} className={`btn ${activeTab===key?'btn-primary':'btn-secondary'}`} onClick={()=>setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {Object.entries(categoryLabels).map(([cat, label]) => (
        activeTab === cat && settings[cat] && (
          <div className="detail-card" key={cat}>
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:20}}>{label}</h3>
            <div className="form-grid">
              {Object.entries(settings[cat]).map(([key, value]) => renderField(cat, key, value))}
            </div>
          </div>
        )
      ))}
    </div>
  )
}
