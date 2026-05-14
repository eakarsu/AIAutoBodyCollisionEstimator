-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'estimator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  insurance_provider VARCHAR(255),
  policy_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim_level VARCHAR(100),
  vin VARCHAR(17),
  color VARCHAR(50),
  mileage INTEGER,
  license_plate VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Damage Assessments table
CREATE TABLE IF NOT EXISTS damage_assessments (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  damage_type VARCHAR(100),
  severity VARCHAR(20) CHECK (severity IN ('minor', 'moderate', 'severe', 'total_loss')),
  location_on_vehicle TEXT,
  photo_url TEXT,
  ai_analysis TEXT,
  estimated_cost DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OEM Parts Pricing table
CREATE TABLE IF NOT EXISTS parts_pricing (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(50) NOT NULL,
  part_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  oem_price DECIMAL(10,2) NOT NULL,
  aftermarket_price DECIMAL(10,2),
  labor_hours DECIMAL(5,2),
  labor_rate DECIMAL(10,2) DEFAULT 75.00,
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  year_range VARCHAR(20),
  supplier VARCHAR(255),
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Claims table
CREATE TABLE IF NOT EXISTS insurance_claims (
  id SERIAL PRIMARY KEY,
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  insurance_company VARCHAR(255) NOT NULL,
  adjuster_name VARCHAR(255),
  adjuster_phone VARCHAR(20),
  adjuster_email VARCHAR(255),
  date_of_loss DATE,
  loss_description TEXT,
  claim_amount DECIMAL(10,2),
  deductible DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'filed',
  ai_recommendation TEXT,
  documents TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repair Timelines table
CREATE TABLE IF NOT EXISTS repair_timelines (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  claim_id INTEGER REFERENCES insurance_claims(id) ON DELETE SET NULL,
  repair_type VARCHAR(100) NOT NULL,
  description TEXT,
  estimated_days INTEGER,
  start_date DATE,
  estimated_completion DATE,
  actual_completion DATE,
  status VARCHAR(50) DEFAULT 'scheduled',
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_technician VARCHAR(255),
  ai_timeline_analysis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Estimates table
CREATE TABLE IF NOT EXISTS cost_estimates (
  id SERIAL PRIMARY KEY,
  estimate_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  damage_assessment_id INTEGER REFERENCES damage_assessments(id) ON DELETE SET NULL,
  parts_cost DECIMAL(10,2) DEFAULT 0,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  paint_cost DECIMAL(10,2) DEFAULT 0,
  additional_cost DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0.0825,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  ai_cost_analysis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  specialization VARCHAR(255),
  certification_level VARCHAR(50),
  hourly_rate DECIMAL(10,2) DEFAULT 75.00,
  years_experience INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  specialty VARCHAR(255),
  rating DECIMAL(2,1) DEFAULT 0,
  lead_time_days INTEGER,
  payment_terms VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  work_order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  estimate_id INTEGER REFERENCES cost_estimates(id) ON DELETE SET NULL,
  technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  repair_type VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  labor_hours_estimated DECIMAL(5,2),
  labor_hours_actual DECIMAL(5,2),
  notes TEXT,
  ai_work_analysis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  estimate_id INTEGER REFERENCES cost_estimates(id) ON DELETE SET NULL,
  work_order_id INTEGER REFERENCES work_orders(id) ON DELETE SET NULL,
  parts_total DECIMAL(10,2) DEFAULT 0,
  labor_total DECIMAL(10,2) DEFAULT 0,
  paint_total DECIMAL(10,2) DEFAULT 0,
  other_charges DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0.0825,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photo Gallery table
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  damage_assessment_id INTEGER REFERENCES damage_assessments(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  photo_url TEXT,
  photo_type VARCHAR(50),
  taken_date DATE,
  tags TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  appointment_type VARCHAR(50) NOT NULL DEFAULT 'estimate',
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME,
  technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  part_name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100),
  category VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  sell_price DECIMAL(10,2) DEFAULT 0,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  location VARCHAR(100),
  status VARCHAR(50) DEFAULT 'in_stock',
  last_ordered DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shop Settings table
CREATE TABLE IF NOT EXISTS shop_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Original estimate snapshot column for quality scorecard (variance vs actual)
ALTER TABLE cost_estimates ADD COLUMN IF NOT EXISTS estimated_at_create DECIMAL(10,2);

-- AI results JSONB persistence (used by routes/ai.js)
CREATE TABLE IF NOT EXISTS ai_results (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(120) NOT NULL,
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  user_id INTEGER,
  model_used VARCHAR(255),
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_results_endpoint ON ai_results(endpoint);
CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at DESC);

-- Parts lookups (used by routes/ai.js lookup-parts)
CREATE TABLE IF NOT EXISTS parts_lookups (
  id SERIAL PRIMARY KEY,
  vehicle_year INTEGER,
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  damaged_parts TEXT[],
  ai_response JSONB,
  model_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
