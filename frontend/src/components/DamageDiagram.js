import React, { useEffect, useState } from 'react'

// Color lookup keyed by severity bucket returned from /api/custom-views.
const SEV_COLOR = {
  none: '#e5e7eb',
  minor: '#fde68a',
  moderate: '#fb923c',
  severe: '#ef4444',
  total_loss: '#7f1d1d',
}

// Geometry for each clickable panel. Coords are tuned for the 4 viewBoxes used
// below (top, front, rear, left side, right side).
const TOP_PANELS = {
  hood:           { x: 60,  y: 30,  w: 120, h: 60,  label: 'Hood' },
  windshield:     { x: 60,  y: 95,  w: 120, h: 25,  label: 'Windshield' },
  roof:           { x: 60,  y: 125, w: 120, h: 80,  label: 'Roof' },
  trunk:          { x: 60,  y: 215, w: 120, h: 55,  label: 'Trunk' },
  left_front_fender:  { x: 30, y: 30,  w: 30, h: 60, label: 'L Fender' },
  right_front_fender: { x: 180,y: 30,  w: 30, h: 60, label: 'R Fender' },
  left_front_door:    { x: 30, y: 95,  w: 30, h: 55, label: 'L F Door' },
  right_front_door:   { x: 180,y: 95,  w: 30, h: 55, label: 'R F Door' },
  left_rear_door:     { x: 30, y: 155, w: 30, h: 55, label: 'L R Door' },
  right_rear_door:    { x: 180,y: 155, w: 30, h: 55, label: 'R R Door' },
  left_rear_quarter:  { x: 30, y: 215, w: 30, h: 55, label: 'L Qtr' },
  right_rear_quarter: { x: 180,y: 215, w: 30, h: 55, label: 'R Qtr' },
}

const FRONT_PANELS = {
  hood:         { x: 30, y: 20, w: 180, h: 35, label: 'Hood' },
  windshield:   { x: 50, y: 55, w: 140, h: 25, label: 'Windshield' },
  front_bumper: { x: 20, y: 95, w: 200, h: 35, label: 'F Bumper' },
}

const REAR_PANELS = {
  trunk:       { x: 30, y: 20, w: 180, h: 50, label: 'Trunk' },
  rear_bumper: { x: 20, y: 90, w: 200, h: 40, label: 'R Bumper' },
}

const SIDE_LEFT = {
  left_front_fender: { x: 20,  y: 50, w: 60, h: 50, label: 'L Fender' },
  left_front_door:   { x: 80,  y: 50, w: 60, h: 50, label: 'L F Door' },
  left_rear_door:    { x: 140, y: 50, w: 60, h: 50, label: 'L R Door' },
  left_rear_quarter: { x: 200, y: 50, w: 60, h: 50, label: 'L Qtr' },
}

const SIDE_RIGHT = {
  right_rear_quarter: { x: 20,  y: 50, w: 60, h: 50, label: 'R Qtr' },
  right_rear_door:    { x: 80,  y: 50, w: 60, h: 50, label: 'R R Door' },
  right_front_door:   { x: 140, y: 50, w: 60, h: 50, label: 'R F Door' },
  right_front_fender: { x: 200, y: 50, w: 60, h: 50, label: 'R Fender' },
}

function Panel({ id, geo, panels, onClick, selected }) {
  const data = panels[id]
  const sev = data ? data.severity : 'none'
  const fill = SEV_COLOR[sev] || SEV_COLOR.none
  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(id, data)}
    >
      <rect
        x={geo.x} y={geo.y} width={geo.w} height={geo.h}
        fill={fill}
        stroke={selected === id ? '#1d4ed8' : '#374151'}
        strokeWidth={selected === id ? 3 : 1}
      />
      <text
        x={geo.x + geo.w / 2}
        y={geo.y + geo.h / 2 + 4}
        textAnchor="middle"
        fontSize="9"
        fill="#111827"
      >
        {geo.label}
      </text>
    </g>
  )
}

function View({ title, viewBox, panelDefs, panels, onSelect, selected }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, padding:8 }}>
      <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>{title}</div>
      <svg viewBox={viewBox} width="100%" height="220" style={{ background:'#f9fafb' }}>
        {Object.entries(panelDefs).map(([id, geo]) => (
          <Panel
            key={id} id={id} geo={geo} panels={panels}
            onClick={onSelect} selected={selected}
          />
        ))}
      </svg>
    </div>
  )
}

export default function DamageDiagram({ vehicleId }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!vehicleId) return
    setData(null); setErr(null); setSelected(null); setDetail(null)
    fetch(`/api/custom-views/damage-diagram/${vehicleId}`)
      .then(r => r.json())
      .then(d => { if (d.error) setErr(d.error); else setData(d) })
      .catch(e => setErr(String(e)))
  }, [vehicleId])

  if (!vehicleId) return <div style={{padding:12, color:'#6b7280'}}>Pick a vehicle to see its damage diagram.</div>
  if (err) return <div style={{padding:12, color:'#b91c1c'}}>Error: {err}</div>
  if (!data) return <div style={{padding:12, color:'#6b7280'}}>Loading damage diagram...</div>

  const v = data.vehicle
  return (
    <div data-testid="damage-diagram">
      <div style={{ marginBottom:8, fontSize:14 }}>
        <strong>{v.year} {v.make} {v.model}</strong>
        <span style={{ color:'#6b7280', marginLeft:8 }}>VIN: {v.vin || 'N/A'}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12 }}>
        <View title="Top view"   viewBox="0 0 240 300" panelDefs={TOP_PANELS}
              panels={data.panels} onSelect={(id, d) => { setSelected(id); setDetail(d) }} selected={selected} />
        <View title="Front view" viewBox="0 0 240 150" panelDefs={FRONT_PANELS}
              panels={data.panels} onSelect={(id, d) => { setSelected(id); setDetail(d) }} selected={selected} />
        <View title="Rear view"  viewBox="0 0 240 150" panelDefs={REAR_PANELS}
              panels={data.panels} onSelect={(id, d) => { setSelected(id); setDetail(d) }} selected={selected} />
        <View title="Left side"  viewBox="0 0 280 130" panelDefs={SIDE_LEFT}
              panels={data.panels} onSelect={(id, d) => { setSelected(id); setDetail(d) }} selected={selected} />
        <View title="Right side" viewBox="0 0 280 130" panelDefs={SIDE_RIGHT}
              panels={data.panels} onSelect={(id, d) => { setSelected(id); setDetail(d) }} selected={selected} />
      </div>

      <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
        {data.legend.map(l => (
          <span key={l.key} style={{ fontSize:12, display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ display:'inline-block', width:14, height:14, background:l.color, border:'1px solid #374151' }} />
            {l.label}
          </span>
        ))}
      </div>

      {selected && (
        <div style={{ marginTop:12, padding:10, background:'#f3f4f6', borderRadius:6 }}>
          <div style={{ fontWeight:600 }}>Selected: {selected.replace(/_/g, ' ')}</div>
          {detail ? (
            <>
              <div>Severity: <strong>{detail.severity}</strong></div>
              <div>Estimated: ${Number(detail.estimated_cost || 0).toFixed(2)}</div>
              <div style={{ color:'#374151' }}>{detail.description}</div>
            </>
          ) : (
            <div style={{ color:'#6b7280' }}>No recorded damage on this panel.</div>
          )}
        </div>
      )}
    </div>
  )
}
