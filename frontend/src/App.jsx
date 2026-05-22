import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { api } from './services/api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Vehicles from './pages/Vehicles'
import DamageAssessments from './pages/DamageAssessments'
import PartsPricing from './pages/PartsPricing'
import InsuranceClaims from './pages/InsuranceClaims'
import RepairTimelines from './pages/RepairTimelines'
import CostEstimates from './pages/CostEstimates'
import Technicians from './pages/Technicians'
import Suppliers from './pages/Suppliers'
import WorkOrders from './pages/WorkOrders'
import Invoices from './pages/Invoices'
import Photos from './pages/Photos'
import Appointments from './pages/Appointments'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AITools from './pages/AITools'
import Integrations from './pages/Integrations' // Apply pass 5
import CustomViewsPage from './pages/CustomViewsPage'
import SupplementApprovalTracker from './pages/SupplementApprovalTracker'

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/appointments', label: 'Appointments', icon: '📅' },
    { path: '/damage-assessments', label: 'Damage Assessment', icon: '🔍' },
    { path: '/parts-pricing', label: 'OEM Parts Pricing', icon: '🔧' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/insurance-claims', label: 'Insurance Claims', icon: '📋' },
    { path: '/repair-timelines', label: 'Repair Timelines', icon: '⏱️' },
    { path: '/cost-estimates', label: 'Cost Estimates', icon: '💰' },
    { path: '/work-orders', label: 'Work Orders', icon: '📝' },
    { path: '/invoices', label: 'Invoices', icon: '🧾' },
    { path: '/technicians', label: 'Technicians', icon: '👷' },
    { path: '/suppliers', label: 'Suppliers', icon: '🏭' },
    { path: '/photos', label: 'Photo Gallery', icon: '📷' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/vehicles', label: 'Vehicles', icon: '🚗' },
    { path: '/ai-tools', label: 'AI Tools', icon: '🤖' },
    { path: '/custom-views', label: 'Estimator Views', icon: '🗂️' },
    { path: '/supplement-approval-tracker', label: 'Supplements', icon: '✅' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>AI Auto Body</h2>
        <p>Collision Estimator Pro</p>
      </div>
      <div className="sidebar-nav">
        {navItems.map(item => (
          <div
            key={item.path}
            className={`nav-item ${path === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.full_name?.[0] || 'U'}</div>
          <div>
            <div className="user-name">{user?.full_name || 'User'}</div>
            <div className="user-role">{user?.role || 'estimator'}</div>
          </div>
        </div>
        <button className="btn btn-sm btn-secondary mt-2" onClick={onLogout} style={{width:'100%',marginTop:10}}>
          Logout
        </button>
      </div>
    </div>
  )
}

function ProtectedLayout({ user, onLogout, children }) {
  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}

function AppRoutes() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.getMe().then(u => setUser(u)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData.user)
    localStorage.setItem('token', userData.token)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token')
  }

  if (loading) return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center'}}><div className="ai-loading"><div className="spinner" />Loading...</div></div>

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <ProtectedLayout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/damage-assessments" element={<DamageAssessments />} />
        <Route path="/parts-pricing" element={<PartsPricing />} />
        <Route path="/insurance-claims" element={<InsuranceClaims />} />
        <Route path="/repair-timelines" element={<RepairTimelines />} />
        <Route path="/cost-estimates" element={<CostEstimates />} />
        <Route path="/technicians" element={<Technicians />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/ai-tools" element={<AITools />} />
        <Route path="/custom-views" element={<CustomViewsPage />} />
        <Route path="/supplement-approval-tracker" element={<SupplementApprovalTracker />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ProtectedLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
