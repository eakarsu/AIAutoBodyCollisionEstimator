import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

const tabs = ['revenue', 'repairs', 'claims', 'damage']

export default function Reports() {
  const [tab, setTab] = useState('revenue')
  const [revenue, setRevenue] = useState(null)
  const [repairs, setRepairs] = useState(null)
  const [claims, setClaims] = useState(null)
  const [damage, setDamage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getRevenueReport().then(setRevenue).catch(() => {}),
      api.getRepairsReport().then(setRepairs).catch(() => {}),
      api.getClaimsReport().then(setClaims).catch(() => {}),
      api.getDamageReport().then(setDamage).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const fmt = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (loading) return <div style={{display:'flex',height:'50vh',alignItems:'center',justifyContent:'center'}}><div className="ai-loading"><div className="spinner" />Loading reports...</div></div>

  return (
    <div>
      <div className="page-header">
        <div><h1>Reports & Analytics</h1><p>Business insights and performance metrics</p></div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{display:'flex',gap:8,marginBottom:24}}>
        {[['revenue','Revenue'],['repairs','Repairs'],['claims','Claims'],['damage','Damage']].map(([key,label]) => (
          <button key={key} className={`btn ${tab===key?'btn-primary':'btn-secondary'}`} onClick={()=>setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'revenue' && revenue && (
        <div>
          {/* Summary */}
          <div className="dashboard-stats" style={{marginBottom:24}}>
            <div className="stat-card"><div className="stat-icon green">💰</div><div className="stat-info"><h3>${fmt(revenue.totals.all_time_revenue)}</h3><p>Total Revenue</p></div></div>
            <div className="stat-card"><div className="stat-icon blue">✅</div><div className="stat-info"><h3>${fmt(revenue.totals.all_time_collected)}</h3><p>Total Collected</p></div></div>
            <div className="stat-card"><div className="stat-icon red">⏳</div><div className="stat-info"><h3>${fmt(revenue.totals.all_time_outstanding)}</h3><p>Outstanding</p></div></div>
            <div className="stat-card"><div className="stat-icon amber">🧾</div><div className="stat-info"><h3>{revenue.totals.total_invoices}</h3><p>Total Invoices</p></div></div>
          </div>

          {/* Monthly revenue */}
          <div className="detail-card" style={{marginBottom:24}}>
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Monthly Revenue</h3>
            {revenue.monthly.length === 0 ? <p style={{color:'#64748b'}}>No invoice data yet</p> : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Month</th><th>Invoices</th><th>Revenue</th><th>Collected</th><th>Outstanding</th></tr></thead>
                  <tbody>
                    {revenue.monthly.map(m => (
                      <tr key={m.month} style={{cursor:'default'}}>
                        <td><strong>{m.month}</strong></td>
                        <td>{m.invoice_count}</td>
                        <td className="money">${fmt(m.total_revenue)}</td>
                        <td>${fmt(m.total_collected)}</td>
                        <td style={{color: parseFloat(m.total_outstanding) > 0 ? '#ef4444' : 'inherit'}}>${fmt(m.total_outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* By payment method */}
          <div className="detail-card">
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Revenue by Payment Method</h3>
            {revenue.byPaymentMethod.length === 0 ? <p style={{color:'#64748b'}}>No payment data yet</p> : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Method</th><th>Count</th><th>Total</th></tr></thead>
                  <tbody>
                    {revenue.byPaymentMethod.map(m => (
                      <tr key={m.method} style={{cursor:'default'}}>
                        <td><strong>{m.method}</strong></td>
                        <td>{m.count}</td>
                        <td className="money">${fmt(m.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'repairs' && repairs && (
        <div>
          <div className="dashboard-stats" style={{marginBottom:24}}>
            <div className="stat-card"><div className="stat-icon blue">🔧</div><div className="stat-info"><h3>{repairs.avgCompletionDays}</h3><p>Avg Days to Complete</p></div></div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:24}}>
            <div className="detail-card">
              <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Work Orders by Status</h3>
              {repairs.byStatus.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : repairs.byStatus.map(s => (
                <div key={s.status} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #e2e8f0'}}>
                  <span className={`badge badge-${s.status}`}>{s.status}</span>
                  <strong>{s.count}</strong>
                </div>
              ))}
            </div>
            <div className="detail-card">
              <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Work Orders by Type</h3>
              {repairs.byType.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : repairs.byType.map(t => (
                <div key={t.type} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #e2e8f0'}}>
                  <span>{t.type}</span>
                  <strong>{t.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-card" style={{marginBottom:24}}>
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Monthly Work Orders</h3>
            {repairs.monthly.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Month</th><th>Total</th><th>Completed</th><th>Completion Rate</th></tr></thead>
                  <tbody>
                    {repairs.monthly.map(m => (
                      <tr key={m.month} style={{cursor:'default'}}>
                        <td><strong>{m.month}</strong></td>
                        <td>{m.total}</td>
                        <td>{m.completed}</td>
                        <td>{m.total > 0 ? Math.round(m.completed / m.total * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="detail-card">
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Technician Performance</h3>
            {repairs.technicianPerformance.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Technician</th><th>Total Jobs</th><th>Completed</th><th>Hours Logged</th></tr></thead>
                  <tbody>
                    {repairs.technicianPerformance.map(t => (
                      <tr key={t.name} style={{cursor:'default'}}>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.total_jobs}</td>
                        <td>{t.completed_jobs}</td>
                        <td>{parseFloat(t.total_hours).toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'claims' && claims && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:24}}>
            <div className="detail-card">
              <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Claims by Status</h3>
              {claims.byStatus.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : claims.byStatus.map(s => (
                <div key={s.status} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #e2e8f0'}}>
                  <div><span className={`badge badge-${s.status}`}>{s.status}</span> <span style={{color:'#64748b',fontSize:13}}>({s.count})</span></div>
                  <strong className="money">${fmt(s.total_amount)}</strong>
                </div>
              ))}
            </div>
            <div className="detail-card">
              <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Claims by Insurance Company</h3>
              {claims.byInsurer.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : claims.byInsurer.map(i => (
                <div key={i.insurance_company} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #e2e8f0'}}>
                  <div><strong>{i.insurance_company}</strong> <span style={{color:'#64748b',fontSize:13}}>({i.count} claims)</span></div>
                  <span className="money">${fmt(i.total_amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-card">
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Monthly Claims</h3>
            {claims.monthly.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Month</th><th>Claims</th><th>Total Amount</th></tr></thead>
                  <tbody>
                    {claims.monthly.map(m => (
                      <tr key={m.month} style={{cursor:'default'}}>
                        <td><strong>{m.month}</strong></td>
                        <td>{m.total}</td>
                        <td className="money">${fmt(m.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'damage' && damage && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:24}}>
            <div className="detail-card">
              <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Assessments by Severity</h3>
              {damage.bySeverity.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : damage.bySeverity.map(s => (
                <div key={s.severity} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #e2e8f0'}}>
                  <div><span className={`badge badge-${s.severity}`}>{s.severity}</span> <span style={{color:'#64748b',fontSize:13}}>({s.count})</span></div>
                  <span style={{color:'#64748b'}}>avg ${fmt(s.avg_cost)}</span>
                </div>
              ))}
            </div>
            <div className="detail-card">
              <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Assessments by Damage Type</h3>
              {damage.byType.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : damage.byType.map(t => (
                <div key={t.type} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #e2e8f0'}}>
                  <span>{t.type}</span>
                  <strong>{t.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-card">
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Monthly Damage Assessments</h3>
            {damage.monthly.length === 0 ? <p style={{color:'#64748b'}}>No data</p> : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Month</th><th>Assessments</th><th>Total Est. Cost</th></tr></thead>
                  <tbody>
                    {damage.monthly.map(m => (
                      <tr key={m.month} style={{cursor:'default'}}>
                        <td><strong>{m.month}</strong></td>
                        <td>{m.total}</td>
                        <td className="money">${fmt(m.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
