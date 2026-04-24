const router = require('express').Router();
const { queryOpenRouter } = require('../services/openrouter');
const pool = require('../db/pool');

// AI Damage Assessment Analysis
router.post('/analyze-damage', async (req, res) => {
  try {
    const { description, damage_type, severity, location_on_vehicle, vehicle_info } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body collision damage assessor. Analyze the damage described and provide a professional assessment. Structure your response with clear sections:
        1. **Damage Summary** - Brief overview
        2. **Severity Assessment** - Detailed severity analysis
        3. **Affected Components** - List all parts likely affected
        4. **Recommended Repairs** - Step by step repair plan
        5. **Estimated Cost Range** - Low to high cost estimate
        6. **Safety Concerns** - Any safety issues to address
        7. **Insurance Notes** - Tips for the insurance claim`
      },
      {
        role: 'user',
        content: `Please analyze this vehicle damage:
        Vehicle: ${vehicle_info || 'Not specified'}
        Damage Type: ${damage_type || 'Not specified'}
        Severity: ${severity || 'Not specified'}
        Location: ${location_on_vehicle || 'Not specified'}
        Description: ${description}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Parts Price Lookup
router.post('/parts-lookup', async (req, res) => {
  try {
    const { part_name, vehicle_make, vehicle_model, vehicle_year } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto parts pricing specialist. Provide detailed pricing information for the requested part. Structure your response with:
        1. **Part Information** - Part details and specifications
        2. **OEM Price Estimate** - Original equipment manufacturer price
        3. **Aftermarket Options** - Alternative part options and prices
        4. **Labor Estimate** - Estimated labor hours and cost
        5. **Availability** - Typical availability and lead times
        6. **Compatibility Notes** - Fitment and compatibility information
        7. **Recommendation** - Best value recommendation`
      },
      {
        role: 'user',
        content: `Look up pricing for: ${part_name}
        Vehicle: ${vehicle_year || ''} ${vehicle_make || ''} ${vehicle_model || ''}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Insurance Claim Preparation
router.post('/prepare-claim', async (req, res) => {
  try {
    const { loss_description, vehicle_info, damage_details, insurance_company } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert insurance claims specialist for auto body repairs. Help prepare a comprehensive insurance claim. Structure your response with:
        1. **Claim Summary** - Professional summary for the adjuster
        2. **Damage Documentation** - How to document this damage
        3. **Required Photos** - List of photos to take
        4. **Supporting Documents** - Documents needed
        5. **Estimated Claim Value** - Realistic claim value range
        6. **Negotiation Tips** - Tips for maximizing the claim
        7. **Timeline** - Expected claim processing timeline
        8. **Common Pitfalls** - What to avoid`
      },
      {
        role: 'user',
        content: `Help prepare an insurance claim:
        Insurance Company: ${insurance_company || 'Not specified'}
        Vehicle: ${vehicle_info || 'Not specified'}
        Loss Description: ${loss_description}
        Damage Details: ${damage_details || 'Not specified'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Repair Timeline Estimation
router.post('/estimate-timeline', async (req, res) => {
  try {
    const { repair_type, description, severity, vehicle_info } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body repair shop manager with deep knowledge of repair timelines. Provide a detailed repair timeline estimate. Structure your response with:
        1. **Timeline Overview** - Total estimated days
        2. **Repair Phases** - Breakdown of each phase with days
           - Disassembly & Inspection
           - Parts Ordering
           - Body Work
           - Paint & Finishing
           - Reassembly
           - Quality Check
        3. **Critical Path Items** - What could cause delays
        4. **Parts Availability Impact** - How parts affect timeline
        5. **Rental Car Duration** - Recommended rental period
        6. **Rush Options** - Ways to expedite if needed
        7. **Customer Communication** - Suggested update schedule`
      },
      {
        role: 'user',
        content: `Estimate repair timeline for:
        Vehicle: ${vehicle_info || 'Not specified'}
        Repair Type: ${repair_type || 'Not specified'}
        Description: ${description}
        Severity: ${severity || 'Not specified'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Cost Analysis
router.post('/analyze-cost', async (req, res) => {
  try {
    const { parts_cost, labor_cost, paint_cost, additional_cost, vehicle_info, damage_description } = req.body;
    const total = (parseFloat(parts_cost)||0) + (parseFloat(labor_cost)||0) + (parseFloat(paint_cost)||0) + (parseFloat(additional_cost)||0);
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body cost analyst. Review the repair estimate and provide professional analysis. Structure your response with:
        1. **Cost Summary** - Overview of the estimate
        2. **Cost Breakdown Analysis** - Is each category reasonable?
        3. **Market Comparison** - How does this compare to market rates?
        4. **Savings Opportunities** - Where costs could be reduced
        5. **Value Assessment** - Is the repair worth it vs vehicle value?
        6. **Hidden Costs Warning** - Potential additional costs to expect
        7. **Recommendation** - Final recommendation`
      },
      {
        role: 'user',
        content: `Analyze this repair cost estimate:
        Vehicle: ${vehicle_info || 'Not specified'}
        Damage: ${damage_description || 'Not specified'}
        Parts Cost: $${parts_cost || 0}
        Labor Cost: $${labor_cost || 0}
        Paint Cost: $${paint_cost || 0}
        Additional: $${additional_cost || 0}
        Total: $${total.toFixed(2)}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Vehicle Valuation
router.post('/vehicle-valuation', async (req, res) => {
  try {
    const { year, make, model, trim_level, mileage, color, condition } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert vehicle valuation specialist. Provide a comprehensive vehicle value assessment. Structure your response with:
        1. **Vehicle Overview** - Year, make, model details
        2. **Estimated Market Value** - Current fair market value range
        3. **Value Factors** - What affects this vehicle's value
        4. **Condition Assessment** - Impact of condition on value
        5. **Mileage Impact** - How mileage affects value
        6. **Total Loss Threshold** - At what repair cost is it a total loss
        7. **Recommendation** - Repair vs replace guidance`
      },
      {
        role: 'user',
        content: `Valuate this vehicle:
        Year: ${year}, Make: ${make}, Model: ${model}
        Trim: ${trim_level || 'Base'}
        Mileage: ${mileage || 'Unknown'}
        Color: ${color || 'Unknown'}
        Condition: ${condition || 'Fair'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Work Order Analysis
router.post('/analyze-work-order', async (req, res) => {
  try {
    const { description, repair_type, vehicle_info, labor_hours_estimated, technician_name } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body shop operations manager. Analyze this work order and provide optimization recommendations. Structure your response with:
        1. **Work Order Summary** - Overview of the repair work
        2. **Task Breakdown** - Detailed step-by-step repair tasks
        3. **Labor Analysis** - Are the estimated hours reasonable?
        4. **Technician Fit** - Is the assigned tech right for this job?
        5. **Quality Checkpoints** - Key quality checks during repair
        6. **Potential Complications** - What could go wrong
        7. **Optimization Tips** - How to complete more efficiently
        8. **Customer Communication** - Key milestones to update customer`
      },
      {
        role: 'user',
        content: `Analyze this work order:
        Vehicle: ${vehicle_info || 'Not specified'}
        Repair Type: ${repair_type || 'Not specified'}
        Description: ${description}
        Estimated Labor Hours: ${labor_hours_estimated || 'Not specified'}
        Assigned Technician: ${technician_name || 'Not assigned'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Supplier Evaluation
router.post('/evaluate-supplier', async (req, res) => {
  try {
    const { company_name, specialty, rating, lead_time_days, payment_terms } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body supply chain manager. Evaluate this supplier and provide recommendations. Structure your response with:
        1. **Supplier Overview** - Summary of the supplier
        2. **Strengths** - What they do well
        3. **Weaknesses** - Areas of concern
        4. **Lead Time Assessment** - Is lead time competitive?
        5. **Pricing Competitiveness** - How do they compare?
        6. **Reliability Score** - Expected reliability rating
        7. **Negotiation Tips** - How to get better terms
        8. **Recommendation** - Should you use this supplier?`
      },
      {
        role: 'user',
        content: `Evaluate this supplier:
        Company: ${company_name}
        Specialty: ${specialty || 'General'}
        Current Rating: ${rating || 'N/A'}/5
        Lead Time: ${lead_time_days || 'Unknown'} days
        Payment Terms: ${payment_terms || 'Not specified'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Technician Skill Match
router.post('/technician-match', async (req, res) => {
  try {
    const { specialization, certification_level, years_experience, repair_description } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body shop HR manager and operations specialist. Evaluate this technician's skills and provide career development guidance. Structure your response with:
        1. **Skill Assessment** - Current capability overview
        2. **Certification Value** - How valuable are their certifications?
        3. **Experience Rating** - How their experience stacks up
        4. **Best Suited Repairs** - Types of repairs they excel at
        5. **Growth Areas** - Skills they should develop
        6. **Training Recommendations** - Specific courses/certifications to pursue
        7. **Market Value** - Competitive hourly rate range
        8. **Career Path** - Suggested career progression`
      },
      {
        role: 'user',
        content: `Evaluate this technician:
        Specialization: ${specialization || 'General'}
        Certification: ${certification_level || 'None'}
        Years Experience: ${years_experience || 'Unknown'}
        ${repair_description ? `Current Repair Task: ${repair_description}` : ''}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Invoice Analysis
router.post('/analyze-invoice', async (req, res) => {
  try {
    const { parts_total, labor_total, paint_total, other_charges, total, vehicle_info, payment_status } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are an expert auto body billing and finance specialist. Analyze this invoice and provide insights. Structure your response with:
        1. **Invoice Summary** - Overview of charges
        2. **Cost Reasonableness** - Are charges fair and competitive?
        3. **Parts-to-Labor Ratio** - Is the ratio typical?
        4. **Paint Cost Analysis** - Are paint charges appropriate?
        5. **Collection Risk** - Payment collection assessment
        6. **Insurance Optimization** - Maximize insurance reimbursement
        7. **Margin Analysis** - Estimated profit margins
        8. **Billing Best Practices** - Recommendations for this invoice`
      },
      {
        role: 'user',
        content: `Analyze this invoice:
        Vehicle: ${vehicle_info || 'Not specified'}
        Parts: $${parts_total || 0}
        Labor: $${labor_total || 0}
        Paint: $${paint_total || 0}
        Other: $${other_charges || 0}
        Total: $${total || 0}
        Payment Status: ${payment_status || 'unpaid'}`
      }
    ];
    const result = await queryOpenRouter(messages);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
