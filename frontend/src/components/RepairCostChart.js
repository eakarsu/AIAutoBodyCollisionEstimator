import React, { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function RepairCostChart({ estimateId }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    setData(null); setErr(null)
    const qs = estimateId ? `?estimateId=${estimateId}` : ''
    fetch(`/api/custom-views/cost-breakdown${qs}`)
      .then(r => r.json())
      .then(d => { if (d.error) setErr(d.error); else setData(d) })
      .catch(e => setErr(String(e)))
  }, [estimateId])

  if (err) return <div style={{ color:'#b91c1c', padding:12 }}>Error: {err}</div>
  if (!data) return <div style={{ color:'#6b7280', padding:12 }}>Loading cost breakdown...</div>

  const series = data.series.filter(s => s.value > 0)
  if (!series.length) {
    return (
      <div style={{ padding:12, color:'#6b7280' }}>
        No cost data for {data.scope}. Pick an estimate or seed cost estimates.
      </div>
    )
  }

  return (
    <div data-testid="repair-cost-chart" style={{ width:'100%' }}>
      <div style={{ marginBottom:8, fontSize:14 }}>
        Scope: <strong>{data.scope}</strong>
        <span style={{ marginLeft:12, color:'#6b7280' }}>
          Total ${Number(data.total).toFixed(2)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={series}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={110}
            label={(s) => `${s.name} $${Number(s.value).toFixed(0)}`}
          >
            {series.map((s, i) => <Cell key={i} fill={s.color} />)}
          </Pie>
          <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
