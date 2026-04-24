import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error)
  }, [])

  const features = [
    { path: '/damage-assessments', icon: '🔍', color: '#dbeafe', title: 'Damage Assessment', desc: 'AI-powered damage analysis from descriptions. Assess severity, identify affected components, and get repair recommendations.', count: stats?.assessments },
    { path: '/parts-pricing', icon: '🔧', color: '#d1fae5', title: 'OEM Parts Pricing', desc: 'Look up OEM and aftermarket parts pricing. Compare suppliers, check availability, and get AI pricing recommendations.', count: stats?.estimates },
    { path: '/insurance-claims', icon: '📋', color: '#fef3c7', title: 'Insurance Claims', desc: 'Prepare and manage insurance claims with AI. Get claim preparation tips and negotiation strategies.', count: stats?.claims },
    { path: '/repair-timelines', icon: '⏱️', color: '#ede9fe', title: 'Repair Timelines', desc: 'AI-estimated repair timelines with phase breakdowns. Track progress and communicate with customers.', count: stats?.timelines },
    { path: '/cost-estimates', icon: '💰', color: '#fee2e2', title: 'Cost Estimates', desc: 'Generate comprehensive repair cost estimates. AI-analyzed cost breakdowns with market comparisons.', count: stats?.estimates },
    { path: '/work-orders', icon: '📝', color: '#e0e7ff', title: 'Work Orders', desc: 'Create and track repair work orders. Assign technicians, monitor progress, and analyze efficiency with AI.', count: stats?.workOrders },
    { path: '/invoices', icon: '🧾', color: '#fce7f3', title: 'Invoices', desc: 'Generate invoices from estimates and work orders. Track payments, balance due, and get AI billing analysis.', count: stats?.invoices },
    { path: '/technicians', icon: '👷', color: '#ccfbf1', title: 'Technicians', desc: 'Manage technician profiles, certifications, and skills. AI skill assessment and career development.', count: stats?.technicians },
    { path: '/suppliers', icon: '🏭', color: '#fef9c3', title: 'Supplier Directory', desc: 'Manage parts suppliers and vendor relationships. AI supplier evaluation and pricing comparison.', count: stats?.suppliers },
    { path: '/photos', icon: '📷', color: '#f3e8ff', title: 'Photo Gallery', desc: 'Document damage with organized photo gallery. Filter by type, tag photos, and link to assessments.', count: stats?.photos },
    { path: '/customers', icon: '👥', color: '#cffafe', title: 'Customer Management', desc: 'Manage customer profiles, contact info, and insurance details. Track all customer interactions.', count: stats?.customers },
    { path: '/vehicles', icon: '🚗', color: '#f0fdf4', title: 'Vehicle Profiles', desc: 'Track vehicle information including VIN, mileage, and service history. AI vehicle valuation.', count: stats?.vehicles },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to AI Auto Body & Collision Estimator</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon blue">📊</div>
          <div className="stat-info">
            <h3>{stats?.assessments || 0}</h3>
            <p>Damage Assessments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div className="stat-info">
            <h3>${stats?.totalRevenue?.toLocaleString() || '0'}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">🔧</div>
          <div className="stat-info">
            <h3>{stats?.activeRepairs || 0}</h3>
            <p>Active Repairs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">📋</div>
          <div className="stat-info">
            <h3>{stats?.pendingClaims || 0}</h3>
            <p>Pending Claims</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">📝</div>
          <div className="stat-info">
            <h3>{stats?.activeWorkOrders || 0}</h3>
            <p>Active Work Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🧾</div>
          <div className="stat-info">
            <h3>${stats?.unpaidInvoices?.toLocaleString() || '0'}</h3>
            <p>Unpaid Invoices</p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Features</h2>
      <div className="feature-grid">
        {features.map(f => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="card-icon" style={{ background: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <div className="card-count">
              {f.count || 0} records
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
