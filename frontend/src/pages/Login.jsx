import React, { useState } from 'react'
import { api } from '../services/api'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAutofill = () => {
    setEmail(import.meta.env.VITE_DEMO_EMAIL || '')
    setPassword(import.meta.env.VITE_DEMO_PASSWORD || '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(email, password)
      onLogin(data)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="icon-circle">🚗</div>
          <h1>AI Auto Body & Collision</h1>
          <p>Professional Estimator Platform</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button className="btn btn-autofill btn-block" onClick={handleAutofill}>
          ⚡ Quick Fill Demo Credentials
        </button>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          Demo accounts: admin@autobody.com, estimator@autobody.com, tech@autobody.com (pass: password123)
        </p>
      </div>
    </div>
  )
}
