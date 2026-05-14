import React, { useState } from 'react'
import { api } from '../services/api'

/**
 * AI Tools — exposes 8 audit-driven features:
 *   1. Insurance comparison
 *   2. Parts availability aggregator
 *   3. Quality scorecard (read-only)
 *   4. Technician matcher
 *   5. Photo annotation generator
 *   6. Repair timeline predictor
 *   7. Paint color matcher
 *   8. Compliance violation detector
 */
export default function AITools() {
  const [tab, setTab] = useState('insurance')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // ── Form states ─────────────────────────────────────────────────
  const [insuranceForm, setInsuranceForm] = useState({ damage_summary: '', vehicle_info: '', insurers: 'Geico,Allstate,State Farm,Progressive' })
  const [partsForm, setPartsForm] = useState({ parts: 'front bumper, hood, left fender', vehicle_year: '', make: '', model: '' })
  const [techForm, setTechForm] = useState({ repair_type: 'collision', repair_description: '', severity: 'moderate' })
  const [photoForm, setPhotoForm] = useState({ before_description: '', after_description: '', vehicle_info: '' })
  const [timelineForm, setTimelineForm] = useState({ repair_type: 'collision', severity: 'moderate', parts_available: true, technician_id: '' })
  const [paintForm, setPaintForm] = useState({ vehicle_year: '', make: '', model: '', observed_color: '', vin: '' })
  const [complianceForm, setComplianceForm] = useState({ repair_type: '', description: '', vehicle_info: '', oem_procedures_followed: 'unknown' })
  const [totalLossForm, setTotalLossForm] = useState({ vehicle_info: '', vehicle_value: '', estimated_repair_cost: '', damage_summary: '', vehicle_age_years: '', mileage: '' })
  const [paintDegForm, setPaintDegForm] = useState({ vehicle_info: '', vehicle_age_years: '', exposure: '', paint_type: '', interior_condition: '', photos_described: '' })

  const tabs = [
    { key: 'insurance',  label: 'Insurance Comparison' },
    { key: 'parts',      label: 'Parts Availability' },
    { key: 'scorecard',  label: 'Quality Scorecard' },
    { key: 'tech',       label: 'Technician Matcher' },
    { key: 'photo',      label: 'Photo Annotation' },
    { key: 'timeline',   label: 'Timeline Predictor' },
    { key: 'paint',      label: 'Paint Matcher' },
    { key: 'compliance', label: 'OEM Compliance' },
    { key: 'totalloss',  label: 'Total Loss Prediction' },
    { key: 'paintdeg',   label: 'Paint Degradation' },
  ]

  const wrap = async (fn) => {
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await fn()
      setResult(data)
    } catch (e) {
      setError(e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const onTab = (k) => { setTab(k); setError(null); setResult(null) }

  const runInsurance = () => wrap(() => api.insuranceComparison({
    damage_summary: insuranceForm.damage_summary,
    vehicle_info: insuranceForm.vehicle_info,
    insurers: insuranceForm.insurers.split(',').map(s => s.trim()).filter(Boolean),
  }))
  const runParts = () => wrap(() => api.partsAvailability({
    parts: partsForm.parts.split(',').map(s => s.trim()).filter(Boolean),
    vehicle_year: partsForm.vehicle_year, make: partsForm.make, model: partsForm.model,
  }))
  const runScorecard = () => wrap(() => api.qualityScorecard())
  const runTech = () => wrap(() => api.matchTechnician(techForm))
  const runPhoto = () => wrap(() => api.photoAnnotation(photoForm))
  const runTimeline = () => wrap(() => api.predictTimeline({
    ...timelineForm,
    technician_id: timelineForm.technician_id ? parseInt(timelineForm.technician_id) : null,
  }))
  const runPaint = () => wrap(() => api.paintMatch(paintForm))
  const runCompliance = () => wrap(() => api.complianceCheck({
    ...complianceForm,
    oem_procedures_followed: complianceForm.oem_procedures_followed === 'yes' ? true
      : complianceForm.oem_procedures_followed === 'no' ? false : null,
  }))
  const runTotalLoss = () => wrap(() => api.totalLossPrediction({
    ...totalLossForm,
    vehicle_value: totalLossForm.vehicle_value ? parseFloat(totalLossForm.vehicle_value) : null,
    estimated_repair_cost: totalLossForm.estimated_repair_cost ? parseFloat(totalLossForm.estimated_repair_cost) : null,
    vehicle_age_years: totalLossForm.vehicle_age_years ? parseInt(totalLossForm.vehicle_age_years) : null,
    mileage: totalLossForm.mileage ? parseInt(totalLossForm.mileage) : null,
  }))
  const runPaintDeg = () => wrap(() => api.paintDegradation({
    ...paintDegForm,
    vehicle_age_years: paintDegForm.vehicle_age_years ? parseInt(paintDegForm.vehicle_age_years) : null,
  }))

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <h1>AI Tools</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Eight production AI features added per audit recommendations.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => onTab(t.key)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: 6,
              background: tab === t.key ? '#1f2937' : '#fff',
              color: tab === t.key ? '#fff' : '#1f2937',
              cursor: 'pointer'
            }}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          {tab === 'insurance' && (
            <>
              <h3>Insurance Comparison</h3>
              <textarea rows={3} placeholder="Damage summary" value={insuranceForm.damage_summary}
                onChange={e => setInsuranceForm({ ...insuranceForm, damage_summary: e.target.value })} style={inp} />
              <input placeholder="Vehicle (e.g. 2022 Honda Accord)" value={insuranceForm.vehicle_info}
                onChange={e => setInsuranceForm({ ...insuranceForm, vehicle_info: e.target.value })} style={inp} />
              <input placeholder="Insurers (comma-separated)" value={insuranceForm.insurers}
                onChange={e => setInsuranceForm({ ...insuranceForm, insurers: e.target.value })} style={inp} />
              <button onClick={runInsurance} disabled={loading} style={btn}>Compare</button>
            </>
          )}
          {tab === 'parts' && (
            <>
              <h3>Parts Availability Aggregator</h3>
              <input type="number" placeholder="Year" value={partsForm.vehicle_year}
                onChange={e => setPartsForm({ ...partsForm, vehicle_year: e.target.value })} style={inp} />
              <input placeholder="Make" value={partsForm.make}
                onChange={e => setPartsForm({ ...partsForm, make: e.target.value })} style={inp} />
              <input placeholder="Model" value={partsForm.model}
                onChange={e => setPartsForm({ ...partsForm, model: e.target.value })} style={inp} />
              <textarea rows={3} placeholder="Parts (comma-separated)" value={partsForm.parts}
                onChange={e => setPartsForm({ ...partsForm, parts: e.target.value })} style={inp} />
              <button onClick={runParts} disabled={loading} style={btn}>Check Availability</button>
            </>
          )}
          {tab === 'scorecard' && (
            <>
              <h3>Repair Quality Scorecard</h3>
              <p>Compares completed invoices vs original estimates and grades accuracy.</p>
              <button onClick={runScorecard} disabled={loading} style={btn}>Load Scorecard</button>
            </>
          )}
          {tab === 'tech' && (
            <>
              <h3>Technician Matcher</h3>
              <input placeholder="Repair type" value={techForm.repair_type}
                onChange={e => setTechForm({ ...techForm, repair_type: e.target.value })} style={inp} />
              <textarea rows={3} placeholder="Description" value={techForm.repair_description}
                onChange={e => setTechForm({ ...techForm, repair_description: e.target.value })} style={inp} />
              <select value={techForm.severity} onChange={e => setTechForm({ ...techForm, severity: e.target.value })} style={inp}>
                <option value="minor">minor</option>
                <option value="moderate">moderate</option>
                <option value="severe">severe</option>
                <option value="total_loss">total_loss</option>
              </select>
              <button onClick={runTech} disabled={loading} style={btn}>Match Technician</button>
            </>
          )}
          {tab === 'photo' && (
            <>
              <h3>Photo Annotation Generator</h3>
              <input placeholder="Vehicle" value={photoForm.vehicle_info}
                onChange={e => setPhotoForm({ ...photoForm, vehicle_info: e.target.value })} style={inp} />
              <textarea rows={4} placeholder="BEFORE description" value={photoForm.before_description}
                onChange={e => setPhotoForm({ ...photoForm, before_description: e.target.value })} style={inp} />
              <textarea rows={4} placeholder="AFTER description (optional)" value={photoForm.after_description}
                onChange={e => setPhotoForm({ ...photoForm, after_description: e.target.value })} style={inp} />
              <button onClick={runPhoto} disabled={loading} style={btn}>Generate Annotations</button>
            </>
          )}
          {tab === 'timeline' && (
            <>
              <h3>Repair Timeline Predictor</h3>
              <input placeholder="Repair type" value={timelineForm.repair_type}
                onChange={e => setTimelineForm({ ...timelineForm, repair_type: e.target.value })} style={inp} />
              <select value={timelineForm.severity} onChange={e => setTimelineForm({ ...timelineForm, severity: e.target.value })} style={inp}>
                <option value="minor">minor</option>
                <option value="moderate">moderate</option>
                <option value="severe">severe</option>
                <option value="total_loss">total_loss</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={timelineForm.parts_available}
                  onChange={e => setTimelineForm({ ...timelineForm, parts_available: e.target.checked })} />
                Parts available
              </label>
              <input type="number" placeholder="Technician ID (optional)" value={timelineForm.technician_id}
                onChange={e => setTimelineForm({ ...timelineForm, technician_id: e.target.value })} style={inp} />
              <button onClick={runTimeline} disabled={loading} style={btn}>Predict</button>
            </>
          )}
          {tab === 'paint' && (
            <>
              <h3>Paint Color Matcher</h3>
              <input type="number" placeholder="Year" value={paintForm.vehicle_year}
                onChange={e => setPaintForm({ ...paintForm, vehicle_year: e.target.value })} style={inp} />
              <input placeholder="Make" value={paintForm.make}
                onChange={e => setPaintForm({ ...paintForm, make: e.target.value })} style={inp} />
              <input placeholder="Model" value={paintForm.model}
                onChange={e => setPaintForm({ ...paintForm, model: e.target.value })} style={inp} />
              <input placeholder="Observed color" value={paintForm.observed_color}
                onChange={e => setPaintForm({ ...paintForm, observed_color: e.target.value })} style={inp} />
              <input placeholder="VIN (optional)" value={paintForm.vin}
                onChange={e => setPaintForm({ ...paintForm, vin: e.target.value })} style={inp} />
              <button onClick={runPaint} disabled={loading} style={btn}>Identify Paint Code</button>
            </>
          )}
          {tab === 'compliance' && (
            <>
              <h3>OEM Compliance Check</h3>
              <input placeholder="Vehicle" value={complianceForm.vehicle_info}
                onChange={e => setComplianceForm({ ...complianceForm, vehicle_info: e.target.value })} style={inp} />
              <input placeholder="Repair type" value={complianceForm.repair_type}
                onChange={e => setComplianceForm({ ...complianceForm, repair_type: e.target.value })} style={inp} />
              <textarea rows={4} placeholder="Description of work performed" value={complianceForm.description}
                onChange={e => setComplianceForm({ ...complianceForm, description: e.target.value })} style={inp} />
              <select value={complianceForm.oem_procedures_followed}
                onChange={e => setComplianceForm({ ...complianceForm, oem_procedures_followed: e.target.value })} style={inp}>
                <option value="unknown">OEM procedures: unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <button onClick={runCompliance} disabled={loading} style={btn}>Check Compliance</button>
            </>
          )}
          {tab === 'totalloss' && (
            <>
              <h3>Total Loss Prediction</h3>
              <input placeholder="Vehicle (e.g. 2018 Toyota Camry)" value={totalLossForm.vehicle_info}
                onChange={e => setTotalLossForm({ ...totalLossForm, vehicle_info: e.target.value })} style={inp} />
              <input type="number" placeholder="Actual cash value (USD)" value={totalLossForm.vehicle_value}
                onChange={e => setTotalLossForm({ ...totalLossForm, vehicle_value: e.target.value })} style={inp} />
              <input type="number" placeholder="Estimated repair cost (USD)" value={totalLossForm.estimated_repair_cost}
                onChange={e => setTotalLossForm({ ...totalLossForm, estimated_repair_cost: e.target.value })} style={inp} />
              <input type="number" placeholder="Vehicle age (years)" value={totalLossForm.vehicle_age_years}
                onChange={e => setTotalLossForm({ ...totalLossForm, vehicle_age_years: e.target.value })} style={inp} />
              <input type="number" placeholder="Mileage" value={totalLossForm.mileage}
                onChange={e => setTotalLossForm({ ...totalLossForm, mileage: e.target.value })} style={inp} />
              <textarea rows={4} placeholder="Damage summary" value={totalLossForm.damage_summary}
                onChange={e => setTotalLossForm({ ...totalLossForm, damage_summary: e.target.value })} style={inp} />
              <button onClick={runTotalLoss} disabled={loading} style={btn}>Predict Total Loss</button>
            </>
          )}
          {tab === 'paintdeg' && (
            <>
              <h3>Paint / Interior Degradation</h3>
              <input placeholder="Vehicle (e.g. 2014 Honda Civic)" value={paintDegForm.vehicle_info}
                onChange={e => setPaintDegForm({ ...paintDegForm, vehicle_info: e.target.value })} style={inp} />
              <input type="number" placeholder="Vehicle age (years)" value={paintDegForm.vehicle_age_years}
                onChange={e => setPaintDegForm({ ...paintDegForm, vehicle_age_years: e.target.value })} style={inp} />
              <input placeholder="Exposure (garage/outdoor/coastal/...)" value={paintDegForm.exposure}
                onChange={e => setPaintDegForm({ ...paintDegForm, exposure: e.target.value })} style={inp} />
              <input placeholder="Paint type (OEM, repaint, ceramic-coated...)" value={paintDegForm.paint_type}
                onChange={e => setPaintDegForm({ ...paintDegForm, paint_type: e.target.value })} style={inp} />
              <input placeholder="Interior condition" value={paintDegForm.interior_condition}
                onChange={e => setPaintDegForm({ ...paintDegForm, interior_condition: e.target.value })} style={inp} />
              <textarea rows={3} placeholder="Photo notes (optional)" value={paintDegForm.photos_described}
                onChange={e => setPaintDegForm({ ...paintDegForm, photos_described: e.target.value })} style={inp} />
              <button onClick={runPaintDeg} disabled={loading} style={btn}>Estimate Degradation</button>
            </>
          )}

          {loading && <p style={{ marginTop: 8, color: '#555' }}>Working...</p>}
          {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <h3>Result</h3>
          {!result && <p style={{ color: '#888' }}>Run a tool to see the response.</p>}
          {result && (
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 600, overflow: 'auto', fontSize: 12 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

const inp = { display: 'block', width: '100%', padding: 8, marginBottom: 8, border: '1px solid #ccc', borderRadius: 4 }
const btn = { padding: '8px 14px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }
