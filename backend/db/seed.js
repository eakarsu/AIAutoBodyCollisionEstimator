const pool = require('./pool');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function seed() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created successfully');

    // Clear existing data
    await client.query('TRUNCATE users, photos, invoices, work_orders, suppliers, technicians, cost_estimates, repair_timelines, insurance_claims, damage_assessments, parts_pricing, vehicles, customers, appointments, inventory, shop_settings RESTART IDENTITY CASCADE');

    // Seed Users
    const hashedPassword = await bcrypt.hash(requireDemoPassword(), 10);
    await client.query(`
      INSERT INTO users (email, password, full_name, role) VALUES
      ('admin@autobody.com', $1, 'John Admin', 'admin'),
      ('estimator@autobody.com', $1, 'Sarah Estimator', 'estimator'),
      ('tech@autobody.com', $1, 'Mike Technician', 'technician')
    `, [hashedPassword]);
    console.log('Users seeded');

    // Seed Customers (15 items)
    await client.query(`
      INSERT INTO customers (first_name, last_name, email, phone, address, insurance_provider, policy_number) VALUES
      ('James', 'Wilson', 'james.wilson@email.com', '555-0101', '123 Oak Street, Austin, TX 78701', 'State Farm', 'SF-2024-001'),
      ('Maria', 'Garcia', 'maria.garcia@email.com', '555-0102', '456 Pine Ave, Houston, TX 77001', 'Geico', 'GE-2024-002'),
      ('Robert', 'Johnson', 'robert.j@email.com', '555-0103', '789 Elm Blvd, Dallas, TX 75201', 'Progressive', 'PR-2024-003'),
      ('Emily', 'Chen', 'emily.chen@email.com', '555-0104', '321 Maple Dr, San Antonio, TX 78201', 'Allstate', 'AL-2024-004'),
      ('Michael', 'Brown', 'michael.b@email.com', '555-0105', '654 Cedar Ln, Fort Worth, TX 76101', 'USAA', 'US-2024-005'),
      ('Sarah', 'Davis', 'sarah.d@email.com', '555-0106', '987 Birch Ct, Plano, TX 75023', 'Liberty Mutual', 'LM-2024-006'),
      ('David', 'Martinez', 'david.m@email.com', '555-0107', '246 Walnut Way, Irving, TX 75060', 'Farmers', 'FM-2024-007'),
      ('Jennifer', 'Anderson', 'jennifer.a@email.com', '555-0108', '135 Cherry Rd, Arlington, TX 76010', 'Nationwide', 'NW-2024-008'),
      ('William', 'Taylor', 'william.t@email.com', '555-0109', '864 Spruce St, Frisco, TX 75033', 'State Farm', 'SF-2024-009'),
      ('Jessica', 'Thomas', 'jessica.t@email.com', '555-0110', '573 Ash Pl, McKinney, TX 75069', 'Geico', 'GE-2024-010'),
      ('Christopher', 'Lee', 'chris.lee@email.com', '555-0111', '192 Poplar Ave, Round Rock, TX 78664', 'Progressive', 'PR-2024-011'),
      ('Amanda', 'White', 'amanda.w@email.com', '555-0112', '847 Hickory Ln, Georgetown, TX 78626', 'Allstate', 'AL-2024-012'),
      ('Daniel', 'Harris', 'daniel.h@email.com', '555-0113', '365 Sycamore Dr, Cedar Park, TX 78613', 'USAA', 'US-2024-013'),
      ('Ashley', 'Clark', 'ashley.c@email.com', '555-0114', '728 Magnolia Ct, Leander, TX 78641', 'Liberty Mutual', 'LM-2024-014'),
      ('Matthew', 'Lewis', 'matthew.l@email.com', '555-0115', '491 Redwood Blvd, Pflugerville, TX 78660', 'Farmers', 'FM-2024-015')
    `);
    console.log('Customers seeded (15)');

    // Seed Vehicles (15 items)
    await client.query(`
      INSERT INTO vehicles (customer_id, year, make, model, trim_level, vin, color, mileage, license_plate) VALUES
      (1, 2023, 'Toyota', 'Camry', 'XSE', '1HGBH41JXMN109186', 'White', 15000, 'ABC-1234'),
      (2, 2022, 'Honda', 'Accord', 'Sport', '2HGFC2F59MH512345', 'Black', 28000, 'DEF-5678'),
      (3, 2024, 'Ford', 'F-150', 'XLT', '1FTFW1E50MFA12345', 'Blue', 8000, 'GHI-9012'),
      (4, 2023, 'BMW', '330i', 'M Sport', 'WBA5R1C51MWX12345', 'Silver', 12000, 'JKL-3456'),
      (5, 2021, 'Chevrolet', 'Silverado', 'LT', '3GCUYDED5MG123456', 'Red', 42000, 'MNO-7890'),
      (6, 2023, 'Mercedes-Benz', 'C300', 'AMG Line', 'W1KWF8DB5MR123456', 'Gray', 18000, 'PQR-1234'),
      (7, 2022, 'Tesla', 'Model 3', 'Long Range', '5YJ3E1EA5MF123456', 'White', 25000, 'STU-5678'),
      (8, 2024, 'Hyundai', 'Tucson', 'SEL', 'KM8J3CAL5MU123456', 'Green', 5000, 'VWX-9012'),
      (9, 2020, 'Nissan', 'Altima', 'SV', '1N4BL4BV5MC123456', 'Black', 55000, 'YZA-3456'),
      (10, 2023, 'Subaru', 'Outback', 'Premium', '4S4BTACC5M3123456', 'Blue', 20000, 'BCD-7890'),
      (11, 2022, 'Audi', 'A4', 'Premium Plus', 'WAUENAF43MA123456', 'White', 30000, 'EFG-1234'),
      (12, 2024, 'Kia', 'Telluride', 'SX', '5XYP6DHC5MG123456', 'Brown', 3000, 'HIJ-5678'),
      (13, 2021, 'Jeep', 'Grand Cherokee', 'Limited', '1C4RJFBG5MC123456', 'Black', 38000, 'KLM-9012'),
      (14, 2023, 'Lexus', 'RX350', 'F Sport', '2T2HZMDA5MC123456', 'Pearl', 14000, 'NOP-3456'),
      (15, 2022, 'Volkswagen', 'Tiguan', 'SE', '3VV2B7AX5MM123456', 'Gray', 32000, 'QRS-7890')
    `);
    console.log('Vehicles seeded (15)');

    // Seed Damage Assessments (15 items)
    await client.query(`
      INSERT INTO damage_assessments (vehicle_id, customer_id, description, damage_type, severity, location_on_vehicle, estimated_cost, status) VALUES
      (1, 1, 'Front bumper collision damage with cracked headlight assembly', 'Collision', 'moderate', 'Front bumper, left headlight', 3500.00, 'assessed'),
      (2, 2, 'Rear-end collision with trunk lid and taillight damage', 'Collision', 'moderate', 'Rear bumper, trunk lid, right taillight', 4200.00, 'assessed'),
      (3, 3, 'Hail damage across hood, roof, and trunk', 'Weather', 'minor', 'Hood, roof, trunk lid', 2800.00, 'pending'),
      (4, 4, 'Side-swipe damage to driver door and fender', 'Collision', 'moderate', 'Left front fender, driver door', 5100.00, 'assessed'),
      (5, 5, 'Deer collision with extensive front-end damage', 'Animal', 'severe', 'Front bumper, hood, grille, radiator', 8500.00, 'in_progress'),
      (6, 6, 'Parking lot door ding and paint scratch', 'Minor Impact', 'minor', 'Right rear door', 800.00, 'assessed'),
      (7, 7, 'Rear quarter panel dent from backing accident', 'Collision', 'moderate', 'Left rear quarter panel', 3200.00, 'pending'),
      (8, 8, 'Windshield crack from road debris', 'Road Hazard', 'minor', 'Front windshield', 450.00, 'completed'),
      (9, 9, 'T-bone collision damage to passenger side', 'Collision', 'severe', 'Right front door, right rear door, B-pillar', 12000.00, 'assessed'),
      (10, 10, 'Flood water damage to undercarriage and interior', 'Weather', 'severe', 'Undercarriage, interior floor, electrical', 15000.00, 'pending'),
      (11, 11, 'Vandalism key scratch along entire left side', 'Vandalism', 'moderate', 'Left front fender, left doors, left rear quarter', 4500.00, 'assessed'),
      (12, 12, 'Minor fender bender at low speed', 'Collision', 'minor', 'Front bumper cover', 1200.00, 'completed'),
      (13, 13, 'Rollover accident with roof and pillar damage', 'Collision', 'total_loss', 'Roof, A-pillars, B-pillars, multiple panels', 28000.00, 'assessed'),
      (14, 14, 'Shopping cart damage to right rear quarter', 'Minor Impact', 'minor', 'Right rear quarter panel', 950.00, 'pending'),
      (15, 15, 'Multi-vehicle pileup with front and rear damage', 'Collision', 'severe', 'Front bumper, hood, rear bumper, trunk', 11000.00, 'in_progress')
    `);
    console.log('Damage Assessments seeded (15)');

    // Seed Parts Pricing (15 items)
    await client.query(`
      INSERT INTO parts_pricing (part_number, part_name, category, oem_price, aftermarket_price, labor_hours, labor_rate, vehicle_make, vehicle_model, year_range, supplier, in_stock) VALUES
      ('TOY-BMP-F01', 'Front Bumper Cover', 'Bumper', 485.00, 285.00, 2.5, 75.00, 'Toyota', 'Camry', '2021-2024', 'Toyota Parts Direct', true),
      ('HON-TRK-R01', 'Trunk Lid Assembly', 'Body Panel', 1250.00, 750.00, 3.0, 75.00, 'Honda', 'Accord', '2020-2023', 'Honda Parts Warehouse', true),
      ('FRD-HDL-F01', 'Headlight Assembly LED', 'Lighting', 890.00, 420.00, 1.0, 75.00, 'Ford', 'F-150', '2022-2024', 'Ford Motorcraft', true),
      ('BMW-FND-L01', 'Left Front Fender', 'Body Panel', 780.00, 380.00, 2.0, 95.00, 'BMW', '3 Series', '2022-2024', 'BMW Parts Plus', false),
      ('CHV-RAD-F01', 'Radiator Assembly', 'Cooling', 560.00, 320.00, 2.5, 75.00, 'Chevrolet', 'Silverado', '2019-2023', 'GM Parts Direct', true),
      ('MBZ-DOR-L01', 'Driver Door Shell', 'Body Panel', 1850.00, 950.00, 4.0, 95.00, 'Mercedes-Benz', 'C-Class', '2022-2024', 'MB Parts Network', false),
      ('TSL-QTR-L01', 'Left Rear Quarter Panel', 'Body Panel', 2200.00, null, 8.0, 85.00, 'Tesla', 'Model 3', '2020-2024', 'Tesla Parts', true),
      ('HYN-WND-F01', 'Front Windshield', 'Glass', 380.00, 220.00, 1.5, 75.00, 'Hyundai', 'Tucson', '2022-2024', 'Hyundai Parts Hub', true),
      ('NIS-DOR-R01', 'Passenger Front Door', 'Body Panel', 920.00, 520.00, 3.5, 75.00, 'Nissan', 'Altima', '2019-2023', 'Nissan Parts Online', true),
      ('SUB-HDL-R01', 'Rear Taillight Assembly', 'Lighting', 340.00, 180.00, 0.5, 75.00, 'Subaru', 'Outback', '2021-2024', 'Subaru Parts Plus', true),
      ('AUD-BMP-R01', 'Rear Bumper Cover', 'Bumper', 620.00, 350.00, 2.5, 85.00, 'Audi', 'A4', '2020-2023', 'Audi Parts Direct', true),
      ('KIA-HDD-F01', 'Hood Panel', 'Body Panel', 680.00, 380.00, 1.5, 75.00, 'Kia', 'Telluride', '2023-2025', 'Kia Parts Center', true),
      ('JEP-ROF-001', 'Roof Panel', 'Body Panel', 1450.00, null, 6.0, 85.00, 'Jeep', 'Grand Cherokee', '2021-2024', 'Mopar Parts', false),
      ('LEX-QTR-R01', 'Right Rear Quarter Panel', 'Body Panel', 1680.00, 880.00, 7.0, 85.00, 'Lexus', 'RX', '2022-2024', 'Lexus Parts Hub', true),
      ('VWG-GRL-F01', 'Front Grille Assembly', 'Exterior', 420.00, 240.00, 1.0, 75.00, 'Volkswagen', 'Tiguan', '2021-2024', 'VW Parts Direct', true)
    `);
    console.log('Parts Pricing seeded (15)');

    // Seed Insurance Claims (15 items)
    await client.query(`
      INSERT INTO insurance_claims (claim_number, customer_id, vehicle_id, insurance_company, adjuster_name, adjuster_phone, adjuster_email, date_of_loss, loss_description, claim_amount, deductible, status) VALUES
      ('CLM-2024-0001', 1, 1, 'State Farm', 'Tom Reynolds', '555-9001', 'tom.r@statefarm.com', '2024-01-15', 'Front collision at intersection - other driver ran red light', 3500.00, 500.00, 'approved'),
      ('CLM-2024-0002', 2, 2, 'Geico', 'Lisa Park', '555-9002', 'lisa.p@geico.com', '2024-01-22', 'Rear-ended at stoplight during rush hour', 4200.00, 500.00, 'in_review'),
      ('CLM-2024-0003', 3, 3, 'Progressive', 'Mark Stevens', '555-9003', 'mark.s@progressive.com', '2024-02-10', 'Severe hailstorm caused multiple dents', 2800.00, 1000.00, 'filed'),
      ('CLM-2024-0004', 4, 4, 'Allstate', 'Karen Wu', '555-9004', 'karen.w@allstate.com', '2024-02-18', 'Side-swiped while parked on street', 5100.00, 500.00, 'approved'),
      ('CLM-2024-0005', 5, 5, 'USAA', 'Bob Miller', '555-9005', 'bob.m@usaa.com', '2024-03-01', 'Deer jumped in front of vehicle on highway', 8500.00, 250.00, 'approved'),
      ('CLM-2024-0006', 6, 6, 'Liberty Mutual', 'Amy Foster', '555-9006', 'amy.f@libertymutual.com', '2024-03-10', 'Door dinged in grocery store parking lot', 800.00, 500.00, 'denied'),
      ('CLM-2024-0007', 7, 7, 'Farmers', 'Steve Kim', '555-9007', 'steve.k@farmers.com', '2024-03-15', 'Backed into concrete pillar in parking garage', 3200.00, 500.00, 'in_review'),
      ('CLM-2024-0008', 8, 8, 'Nationwide', 'Rachel Green', '555-9008', 'rachel.g@nationwide.com', '2024-03-20', 'Rock thrown by truck on highway cracked windshield', 450.00, 100.00, 'approved'),
      ('CLM-2024-0009', 9, 9, 'State Farm', 'Jim Brady', '555-9009', 'jim.b@statefarm.com', '2024-04-02', 'T-boned at four-way stop by distracted driver', 12000.00, 500.00, 'in_review'),
      ('CLM-2024-0010', 10, 10, 'Geico', 'Nicole Adams', '555-9010', 'nicole.a@geico.com', '2024-04-15', 'Flash flood damaged vehicle parked in low area', 15000.00, 1000.00, 'filed'),
      ('CLM-2024-0011', 11, 11, 'Progressive', 'David Cole', '555-9011', 'david.c@progressive.com', '2024-04-28', 'Vehicle keyed overnight in apartment complex', 4500.00, 500.00, 'approved'),
      ('CLM-2024-0012', 12, 12, 'Allstate', 'Susan Bell', '555-9012', 'susan.b@allstate.com', '2024-05-05', 'Low speed fender bender in drive-through', 1200.00, 500.00, 'approved'),
      ('CLM-2024-0013', 13, 13, 'USAA', 'Paul Wright', '555-9013', 'paul.w@usaa.com', '2024-05-12', 'Single vehicle rollover on wet road', 28000.00, 500.00, 'total_loss'),
      ('CLM-2024-0014', 14, 14, 'Liberty Mutual', 'Linda Scott', '555-9014', 'linda.s@libertymutual.com', '2024-05-20', 'Shopping cart rolled into vehicle in parking lot', 950.00, 250.00, 'filed'),
      ('CLM-2024-0015', 15, 15, 'Farmers', 'Chris Evans', '555-9015', 'chris.e@farmers.com', '2024-06-01', 'Multi-car pileup on foggy highway', 11000.00, 500.00, 'in_review')
    `);
    console.log('Insurance Claims seeded (15)');

    // Seed Repair Timelines (15 items)
    await client.query(`
      INSERT INTO repair_timelines (vehicle_id, customer_id, claim_id, repair_type, description, estimated_days, start_date, estimated_completion, status, priority, assigned_technician) VALUES
      (1, 1, 1, 'Bumper Replacement', 'Replace front bumper cover and repair headlight mounting', 3, '2024-02-01', '2024-02-04', 'completed', 'normal', 'Mike Torres'),
      (2, 2, 2, 'Rear Body Repair', 'Trunk lid replacement, bumper repair, taillight installation', 5, '2024-02-15', '2024-02-20', 'in_progress', 'normal', 'Jake Smith'),
      (3, 3, 3, 'PDR Hail Repair', 'Paintless dent repair for hail damage across body', 4, '2024-03-01', '2024-03-05', 'scheduled', 'low', 'Carlos Mendez'),
      (4, 4, 4, 'Side Panel Repair', 'Fender replacement and door panel repair with paint match', 6, '2024-03-10', '2024-03-16', 'in_progress', 'normal', 'Mike Torres'),
      (5, 5, 5, 'Major Front End', 'Complete front-end rebuild including bumper, hood, grille, radiator', 10, '2024-03-20', '2024-03-30', 'in_progress', 'high', 'Jake Smith'),
      (6, 6, 6, 'Minor Door Repair', 'Door ding repair with touch-up paint', 1, '2024-04-01', '2024-04-02', 'completed', 'low', 'Carlos Mendez'),
      (7, 7, 7, 'Quarter Panel Work', 'Left rear quarter panel dent repair and repaint', 4, '2024-04-10', '2024-04-14', 'scheduled', 'normal', 'Mike Torres'),
      (8, 8, 8, 'Windshield Replace', 'Remove and replace front windshield with OEM glass', 1, '2024-04-05', '2024-04-05', 'completed', 'normal', 'Luis Garcia'),
      (9, 9, 9, 'Major Side Repair', 'Replace both right doors, repair B-pillar, align frame', 14, '2024-04-20', '2024-05-04', 'in_progress', 'high', 'Jake Smith'),
      (10, 10, 10, 'Flood Restoration', 'Interior gutting, electrical repair, undercarriage treatment', 21, '2024-05-01', '2024-05-22', 'scheduled', 'high', 'Mike Torres'),
      (11, 11, 11, 'Full Side Repaint', 'Sand, prime, and repaint entire left side of vehicle', 5, '2024-05-15', '2024-05-20', 'completed', 'normal', 'Carlos Mendez'),
      (12, 12, 12, 'Bumper Repair', 'Repair and repaint front bumper cover', 2, '2024-05-25', '2024-05-27', 'completed', 'low', 'Luis Garcia'),
      (13, 13, 13, 'Total Loss Review', 'Inspection and documentation for total loss assessment', 3, '2024-06-01', '2024-06-04', 'completed', 'high', 'Jake Smith'),
      (14, 14, 14, 'Panel Repair', 'Right rear quarter panel dent removal and spot paint', 2, '2024-06-10', '2024-06-12', 'scheduled', 'low', 'Carlos Mendez'),
      (15, 15, 15, 'Front & Rear Repair', 'Replace front and rear bumpers, repair hood and trunk', 8, '2024-06-15', '2024-06-23', 'scheduled', 'high', 'Mike Torres')
    `);
    console.log('Repair Timelines seeded (15)');

    // Seed Cost Estimates (15 items)
    await client.query(`
      INSERT INTO cost_estimates (estimate_number, customer_id, vehicle_id, damage_assessment_id, parts_cost, labor_cost, paint_cost, additional_cost, subtotal, tax_rate, tax_amount, total, status, notes) VALUES
      ('EST-2024-0001', 1, 1, 1, 1285.00, 562.50, 450.00, 120.00, 2417.50, 0.0825, 199.44, 2616.94, 'approved', 'OEM bumper cover + aftermarket headlight assembly'),
      ('EST-2024-0002', 2, 2, 2, 1890.00, 675.00, 580.00, 150.00, 3295.00, 0.0825, 271.84, 3566.84, 'approved', 'OEM trunk lid, aftermarket taillight'),
      ('EST-2024-0003', 3, 3, 3, 0.00, 1200.00, 0.00, 200.00, 1400.00, 0.0825, 115.50, 1515.50, 'pending', 'PDR only - no parts needed'),
      ('EST-2024-0004', 4, 4, 4, 2650.00, 950.00, 720.00, 180.00, 4500.00, 0.0825, 371.25, 4871.25, 'approved', 'BMW OEM fender + door skin with color match'),
      ('EST-2024-0005', 5, 5, 5, 3450.00, 1500.00, 680.00, 350.00, 5980.00, 0.0825, 493.35, 6473.35, 'in_review', 'Major rebuild - OEM bumper, aftermarket hood and grille'),
      ('EST-2024-0006', 6, 6, 6, 0.00, 150.00, 85.00, 0.00, 235.00, 0.0825, 19.39, 254.39, 'approved', 'Minor PDR and touch-up paint'),
      ('EST-2024-0007', 7, 7, 7, 2200.00, 680.00, 520.00, 100.00, 3500.00, 0.0825, 288.75, 3788.75, 'pending', 'Tesla quarter panel - OEM only available'),
      ('EST-2024-0008', 8, 8, 8, 380.00, 112.50, 0.00, 45.00, 537.50, 0.0825, 44.34, 581.84, 'completed', 'OEM windshield with calibration'),
      ('EST-2024-0009', 9, 9, 9, 4200.00, 2100.00, 1200.00, 800.00, 8300.00, 0.0825, 684.75, 8984.75, 'approved', 'Major structural repair with frame alignment'),
      ('EST-2024-0010', 10, 10, 10, 2800.00, 3500.00, 0.00, 2500.00, 8800.00, 0.0825, 726.00, 9526.00, 'pending', 'Flood damage - electrical and interior restoration'),
      ('EST-2024-0011', 11, 11, 11, 450.00, 800.00, 1800.00, 200.00, 3250.00, 0.0825, 268.13, 3518.13, 'approved', 'Full left side respray with clear coat'),
      ('EST-2024-0012', 12, 12, 12, 285.00, 225.00, 320.00, 50.00, 880.00, 0.0825, 72.60, 952.60, 'completed', 'Aftermarket bumper cover with paint match'),
      ('EST-2024-0013', 13, 13, 13, 0.00, 450.00, 0.00, 200.00, 650.00, 0.0825, 53.63, 703.63, 'total_loss', 'Inspection only - declared total loss'),
      ('EST-2024-0014', 14, 14, 14, 0.00, 280.00, 350.00, 50.00, 680.00, 0.0825, 56.10, 736.10, 'pending', 'PDR with spot paint and blend'),
      ('EST-2024-0015', 15, 15, 15, 3200.00, 1200.00, 980.00, 450.00, 5830.00, 0.0825, 480.98, 6310.98, 'in_review', 'Front and rear bumper replacement with paint')
    `);
    console.log('Cost Estimates seeded (15)');

    // Seed Technicians (15 items)
    await client.query(`
      INSERT INTO technicians (first_name, last_name, email, phone, specialization, certification_level, hourly_rate, years_experience, status, notes) VALUES
      ('Mike', 'Torres', 'mike.t@autobody.com', '555-8001', 'Body Repair & Frame Alignment', 'ASE Master', 95.00, 18, 'active', 'Lead technician, specializes in structural repairs'),
      ('Jake', 'Smith', 'jake.s@autobody.com', '555-8002', 'Major Collision Repair', 'ASE Certified', 85.00, 12, 'active', 'Expert in major collision reconstruction'),
      ('Carlos', 'Mendez', 'carlos.m@autobody.com', '555-8003', 'Paint & Refinishing', 'PPG Certified', 80.00, 15, 'active', 'Master painter, color matching specialist'),
      ('Luis', 'Garcia', 'luis.g@autobody.com', '555-8004', 'Glass & Trim', 'I-CAR Gold', 70.00, 8, 'active', 'Windshield and glass replacement expert'),
      ('Tony', 'Russo', 'tony.r@autobody.com', '555-8005', 'PDR Specialist', 'Vale National PDR', 90.00, 20, 'active', 'Paintless dent repair master technician'),
      ('Ryan', 'Cooper', 'ryan.c@autobody.com', '555-8006', 'Electrical & ADAS', 'ASE Certified', 85.00, 10, 'active', 'Advanced driver assistance system calibration'),
      ('David', 'Kim', 'david.k@autobody.com', '555-8007', 'Mechanical Repair', 'ASE Certified', 75.00, 7, 'active', 'Suspension and mechanical components'),
      ('Jason', 'Wright', 'jason.w@autobody.com', '555-8008', 'Welding & Fabrication', 'AWS Certified', 90.00, 14, 'active', 'MIG/TIG welding, panel fabrication'),
      ('Mark', 'Johnson', 'mark.j@autobody.com', '555-8009', 'Estimating & Blueprinting', 'I-CAR Platinum', 80.00, 16, 'active', 'Tear-down and damage blueprinting'),
      ('Alex', 'Rivera', 'alex.r@autobody.com', '555-8010', 'Detailing & Finishing', 'IDA Certified', 55.00, 5, 'active', 'Final detail, buffing, and quality check'),
      ('Brian', 'Patel', 'brian.p@autobody.com', '555-8011', 'Aluminum Repair', 'Ford Aluminum Cert', 95.00, 11, 'active', 'Ford F-150 aluminum body specialist'),
      ('Chris', 'Nelson', 'chris.n@autobody.com', '555-8012', 'European Vehicles', 'BMW/MB Certified', 100.00, 13, 'active', 'BMW, Mercedes, Audi specialist'),
      ('Steve', 'Okafor', 'steve.o@autobody.com', '555-8013', 'Frame & Unibody', 'I-CAR Gold', 85.00, 9, 'on_leave', 'Currently on medical leave until April'),
      ('Matt', 'Thompson', 'matt.t@autobody.com', '555-8014', 'Body Repair General', 'ASE Certified', 70.00, 4, 'active', 'Junior technician, fast learner'),
      ('Kevin', 'Lee', 'kevin.l@autobody.com', '555-8015', 'Tesla & EV Repair', 'Tesla Approved', 105.00, 6, 'active', 'Electric vehicle and Tesla body repair certified')
    `);
    console.log('Technicians seeded (15)');

    // Seed Suppliers (15 items)
    await client.query(`
      INSERT INTO suppliers (company_name, contact_name, email, phone, address, website, specialty, rating, lead_time_days, payment_terms, status, notes) VALUES
      ('Toyota Parts Direct', 'Sarah Kim', 'orders@toyotaparts.com', '800-555-0001', '100 Industrial Blvd, Dallas, TX 75201', 'toyotapartsdirect.com', 'Toyota OEM Parts', 4.8, 2, 'Net 30', 'active', 'Primary Toyota supplier, excellent fill rate'),
      ('Honda Parts Warehouse', 'Jim Chen', 'sales@hondaparts.com', '800-555-0002', '200 Commerce Dr, Houston, TX 77001', 'hondapartswarehouse.com', 'Honda/Acura OEM', 4.6, 3, 'Net 30', 'active', 'Good pricing on bulk orders'),
      ('Ford Motorcraft Central', 'Bob Williams', 'orders@fordmotorcraft.com', '800-555-0003', '300 Auto Way, Detroit, MI 48201', 'fordmotorcraft.com', 'Ford/Lincoln OEM', 4.5, 2, 'Net 45', 'active', 'Motorcraft and OEM Ford parts'),
      ('BMW Parts Plus', 'Klaus Weber', 'parts@bmwplus.com', '800-555-0004', '400 Precision Ln, Chicago, IL 60601', 'bmwpartsplus.com', 'BMW OEM & Performance', 4.7, 5, 'Net 30', 'active', 'Genuine BMW parts, premium pricing'),
      ('GM Parts Direct', 'Mike Ross', 'gm@gmparts.com', '800-555-0005', '500 Motor Ave, Flint, MI 48501', 'gmpartsdirect.com', 'GM/Chevrolet OEM', 4.3, 3, 'Net 30', 'active', 'Full GM lineup coverage'),
      ('LKQ Auto Parts', 'Linda Park', 'sales@lkq.com', '800-555-0006', '600 Salvage Rd, Nashville, TN 37201', 'lkqonline.com', 'Aftermarket & Recycled', 4.2, 1, 'Net 15', 'active', 'Best aftermarket pricing, recycled OEM available'),
      ('Keystone Automotive', 'Tom Baker', 'orders@keystone.com', '800-555-0007', '700 Parts Blvd, Exeter, PA 18643', 'keystoneauto.com', 'Aftermarket Body Parts', 4.1, 2, 'Net 30', 'active', 'Wide aftermarket selection, competitive pricing'),
      ('PPG Industries', 'Maria Santos', 'auto@ppg.com', '800-555-0008', '800 Paint Way, Pittsburgh, PA 15201', 'ppgrefinish.com', 'Paint & Coatings', 4.9, 1, 'Net 30', 'active', 'Premium automotive paint and materials'),
      ('3M Automotive', 'Dave Cooper', 'auto@3m.com', '800-555-0009', '900 Innovation Dr, St Paul, MN 55101', '3m.com/auto', 'Abrasives & Materials', 4.8, 2, 'Net 45', 'active', 'Sandpaper, tape, adhesives, finishing materials'),
      ('Safelite AutoGlass', 'Jenny Liu', 'wholesale@safelite.com', '800-555-0010', '1000 Glass Ave, Columbus, OH 43201', 'safelite.com', 'Auto Glass', 4.4, 1, 'Net 15', 'active', 'OEM and aftermarket windshields and glass'),
      ('Tesla Parts Supply', 'Elon Jr.', 'parts@teslaparts.com', '800-555-0011', '1100 Electric Blvd, Fremont, CA 94538', 'teslaparts.com', 'Tesla OEM Only', 4.0, 7, 'Prepay', 'active', 'Only source for Tesla OEM parts, longer lead times'),
      ('Mopar Parts Network', 'Chris Dodge', 'mopar@moparparts.com', '800-555-0012', '1200 Chrysler Way, Auburn Hills, MI 48321', 'mopar.com', 'Chrysler/Jeep/Dodge OEM', 4.3, 3, 'Net 30', 'active', 'Full FCA parts coverage'),
      ('AutoZone Commercial', 'Pat Green', 'commercial@autozone.com', '800-555-0013', '1300 Retail Blvd, Memphis, TN 38101', 'autozone.com', 'General Parts & Supplies', 3.9, 0, 'Net 15', 'active', 'Same-day pickup for common items'),
      ('MB Parts Network', 'Hans Mueller', 'parts@mbparts.com', '800-555-0014', '1400 Luxury Ln, Montvale, NJ 07645', 'mbpartsnetwork.com', 'Mercedes-Benz OEM', 4.6, 5, 'Net 30', 'active', 'Genuine Mercedes parts with dealer pricing'),
      ('Hyundai/Kia Parts Hub', 'Sun Lee', 'orders@hkparts.com', '800-555-0015', '1500 Korea Way, West Point, GA 31833', 'hkpartshub.com', 'Hyundai/Kia OEM', 4.4, 3, 'Net 30', 'active', 'Growing brand, good discount program')
    `);
    console.log('Suppliers seeded (15)');

    // Seed Work Orders (15 items)
    await client.query(`
      INSERT INTO work_orders (work_order_number, customer_id, vehicle_id, estimate_id, technician_id, description, repair_type, priority, status, start_date, due_date, completed_date, labor_hours_estimated, labor_hours_actual, notes) VALUES
      ('WO-2024-0001', 1, 1, 1, 1, 'Front bumper replacement and headlight repair', 'Collision Repair', 'normal', 'completed', '2024-02-01', '2024-02-04', '2024-02-03', 7.5, 7.0, 'Completed ahead of schedule'),
      ('WO-2024-0002', 2, 2, 2, 2, 'Rear-end damage: trunk, bumper, taillight', 'Collision Repair', 'normal', 'in_progress', '2024-02-15', '2024-02-22', NULL, 9.0, 6.5, 'Waiting on trunk lid delivery'),
      ('WO-2024-0003', 3, 3, 3, 5, 'Hail damage PDR across hood, roof, trunk', 'PDR', 'low', 'pending', '2024-03-01', '2024-03-05', NULL, 16.0, NULL, 'Large hail - may need traditional repair on some dents'),
      ('WO-2024-0004', 4, 4, 4, 12, 'BMW fender and door repair with paint match', 'Collision Repair', 'normal', 'in_progress', '2024-03-10', '2024-03-18', NULL, 12.0, 8.0, 'Color match requires tri-coat process'),
      ('WO-2024-0005', 5, 5, 5, 2, 'Major front-end rebuild from deer collision', 'Major Collision', 'high', 'in_progress', '2024-03-20', '2024-04-01', NULL, 20.0, 14.0, 'Frame pull needed before parts install'),
      ('WO-2024-0006', 6, 6, 6, 5, 'Minor door ding repair and touch-up', 'PDR', 'low', 'completed', '2024-04-01', '2024-04-01', '2024-04-01', 2.0, 1.5, 'Quick PDR fix, customer waited'),
      ('WO-2024-0007', 7, 7, 7, 15, 'Tesla quarter panel dent repair', 'Body Repair', 'normal', 'pending', '2024-04-10', '2024-04-16', NULL, 9.0, NULL, 'Tesla-certified repair required'),
      ('WO-2024-0008', 8, 8, 8, 4, 'Windshield replacement with ADAS calibration', 'Glass', 'normal', 'completed', '2024-04-05', '2024-04-05', '2024-04-05', 1.5, 1.5, 'Calibration completed and verified'),
      ('WO-2024-0009', 9, 9, 9, 2, 'T-bone repair: doors, B-pillar, frame align', 'Major Collision', 'high', 'in_progress', '2024-04-20', '2024-05-10', NULL, 28.0, 18.0, 'Structural repair in progress'),
      ('WO-2024-0010', 10, 10, 10, 6, 'Flood damage restoration - electrical focus', 'Specialty', 'high', 'pending', '2024-05-01', '2024-05-25', NULL, 46.0, NULL, 'Full interior strip and electrical diagnostic needed'),
      ('WO-2024-0011', 11, 11, 11, 3, 'Full left side repaint from vandalism', 'Paint', 'normal', 'completed', '2024-05-15', '2024-05-21', '2024-05-20', 10.5, 10.0, 'PPG Envirobase waterborne paint used'),
      ('WO-2024-0012', 12, 12, 12, 14, 'Front bumper repair and repaint', 'Body Repair', 'low', 'completed', '2024-05-25', '2024-05-27', '2024-05-27', 3.0, 3.0, 'Aftermarket bumper installed per customer request'),
      ('WO-2024-0013', 13, 13, 13, 9, 'Total loss documentation and teardown', 'Inspection', 'high', 'completed', '2024-06-01', '2024-06-04', '2024-06-03', 6.0, 5.0, 'Full photo documentation for insurance'),
      ('WO-2024-0014', 14, 14, 14, 5, 'Quarter panel PDR with spot paint blend', 'PDR', 'low', 'pending', '2024-06-10', '2024-06-12', NULL, 3.5, NULL, 'Blend into adjacent panels needed'),
      ('WO-2024-0015', 15, 15, 15, 1, 'Front and rear bumper replacement', 'Collision Repair', 'high', 'pending', '2024-06-15', '2024-06-25', NULL, 16.0, NULL, 'Both bumpers OEM ordered')
    `);
    console.log('Work Orders seeded (15)');

    // Seed Invoices (15 items)
    await client.query(`
      INSERT INTO invoices (invoice_number, customer_id, vehicle_id, estimate_id, work_order_id, parts_total, labor_total, paint_total, other_charges, subtotal, tax_rate, tax_amount, total, amount_paid, balance_due, payment_method, payment_status, due_date, paid_date, notes) VALUES
      ('INV-2024-0001', 1, 1, 1, 1, 1285.00, 525.00, 450.00, 120.00, 2380.00, 0.0825, 196.35, 2576.35, 2576.35, 0.00, 'Insurance', 'paid', '2024-03-04', '2024-02-28', 'State Farm claim payment received'),
      ('INV-2024-0002', 2, 2, 2, 2, 1890.00, 487.50, 580.00, 150.00, 3107.50, 0.0825, 256.37, 3363.87, 0.00, 3363.87, NULL, 'unpaid', '2024-03-22', NULL, 'Awaiting Geico approval'),
      ('INV-2024-0003', 3, 3, 3, 3, 0.00, 1200.00, 0.00, 200.00, 1400.00, 0.0825, 115.50, 1515.50, 0.00, 1515.50, NULL, 'unpaid', '2024-04-05', NULL, 'PDR estimate pending approval'),
      ('INV-2024-0004', 4, 4, 4, 4, 2650.00, 760.00, 720.00, 180.00, 4310.00, 0.0825, 355.58, 4665.58, 4665.58, 0.00, 'Insurance', 'paid', '2024-04-18', '2024-04-10', 'Allstate direct payment'),
      ('INV-2024-0005', 5, 5, 5, 5, 3450.00, 1050.00, 680.00, 350.00, 5530.00, 0.0825, 456.23, 5986.23, 2000.00, 3986.23, 'Insurance', 'partial', '2024-04-30', NULL, 'USAA initial payment, supplement pending'),
      ('INV-2024-0006', 6, 6, 6, 6, 0.00, 112.50, 85.00, 0.00, 197.50, 0.0825, 16.29, 213.79, 213.79, 0.00, 'Credit Card', 'paid', '2024-04-15', '2024-04-01', 'Customer paid out of pocket'),
      ('INV-2024-0007', 7, 7, 7, 7, 2200.00, 680.00, 520.00, 100.00, 3500.00, 0.0825, 288.75, 3788.75, 0.00, 3788.75, NULL, 'unpaid', '2024-05-16', NULL, 'Farmers claim in review'),
      ('INV-2024-0008', 8, 8, 8, 8, 380.00, 112.50, 0.00, 45.00, 537.50, 0.0825, 44.34, 581.84, 581.84, 0.00, 'Insurance', 'paid', '2024-04-20', '2024-04-12', 'Nationwide windshield claim'),
      ('INV-2024-0009', 9, 9, 9, 9, 4200.00, 1350.00, 1200.00, 800.00, 7550.00, 0.0825, 622.88, 8172.88, 3000.00, 5172.88, 'Insurance', 'partial', '2024-06-04', NULL, 'State Farm partial payment, awaiting supplement'),
      ('INV-2024-0010', 10, 10, 10, 10, 2800.00, 3450.00, 0.00, 2500.00, 8750.00, 0.0825, 721.88, 9471.88, 0.00, 9471.88, NULL, 'unpaid', '2024-06-22', NULL, 'Pending flood claim decision from Geico'),
      ('INV-2024-0011', 11, 11, 11, 11, 450.00, 750.00, 1800.00, 200.00, 3200.00, 0.0825, 264.00, 3464.00, 3464.00, 0.00, 'Insurance', 'paid', '2024-06-20', '2024-06-15', 'Progressive vandalism claim paid'),
      ('INV-2024-0012', 12, 12, 12, 12, 285.00, 225.00, 320.00, 50.00, 880.00, 0.0825, 72.60, 952.60, 952.60, 0.00, 'Debit Card', 'paid', '2024-06-10', '2024-05-28', 'Customer paid, under deductible'),
      ('INV-2024-0013', 13, 13, 13, 13, 0.00, 375.00, 0.00, 200.00, 575.00, 0.0825, 47.44, 622.44, 622.44, 0.00, 'Insurance', 'paid', '2024-07-04', '2024-06-20', 'Teardown fee for total loss inspection'),
      ('INV-2024-0014', 14, 14, 14, 14, 0.00, 262.50, 350.00, 50.00, 662.50, 0.0825, 54.66, 717.16, 0.00, 717.16, NULL, 'unpaid', '2024-07-12', NULL, 'Liberty Mutual claim filed'),
      ('INV-2024-0015', 15, 15, 15, 15, 3200.00, 1200.00, 980.00, 450.00, 5830.00, 0.0825, 480.98, 6310.98, 0.00, 6310.98, NULL, 'unpaid', '2024-07-25', NULL, 'Farmers multi-vehicle claim in review')
    `);
    console.log('Invoices seeded (15)');

    // Seed Photos (15 items)
    await client.query(`
      INSERT INTO photos (damage_assessment_id, vehicle_id, customer_id, title, description, photo_type, taken_date, tags) VALUES
      (1, 1, 1, 'Front Bumper Impact - Driver Side', 'Close-up of cracked bumper cover and headlight damage', 'damage', '2024-01-15', 'bumper,headlight,front,collision'),
      (1, 1, 1, 'Front Bumper Impact - Full View', 'Full front view showing extent of bumper damage', 'damage', '2024-01-15', 'bumper,front,overview'),
      (2, 2, 2, 'Rear Trunk Damage', 'Trunk lid buckled from rear-end impact', 'damage', '2024-01-22', 'trunk,rear,collision'),
      (2, 2, 2, 'Rear Taillight Shattered', 'Right taillight assembly destroyed on impact', 'damage', '2024-01-22', 'taillight,rear,glass'),
      (3, 3, 3, 'Hail Damage - Hood', 'Multiple dents visible on hood from hailstorm', 'damage', '2024-02-10', 'hail,hood,dents'),
      (4, 4, 4, 'Side Swipe - Fender', 'Deep paint scratches and dent on left front fender', 'damage', '2024-02-18', 'fender,scratch,sideswipe'),
      (5, 5, 5, 'Deer Strike - Front End', 'Major front end damage from deer collision', 'damage', '2024-03-01', 'deer,front,grille,hood'),
      (5, 5, 5, 'Radiator Damage Close-up', 'Radiator punctured by grille debris', 'damage', '2024-03-01', 'radiator,cooling,front'),
      (9, 9, 9, 'T-Bone Impact - Passenger Side', 'Severe door and B-pillar damage from T-bone collision', 'damage', '2024-04-02', 'door,bpillar,structural'),
      (1, 1, 1, 'Repair Complete - Front View', 'Completed bumper and headlight repair', 'after_repair', '2024-02-03', 'complete,bumper,headlight'),
      (6, 6, 6, 'Door Ding Before PDR', 'Small dent on right rear door', 'damage', '2024-03-10', 'door,ding,minor'),
      (6, 6, 6, 'Door Ding After PDR', 'Dent removed via paintless dent repair', 'after_repair', '2024-04-01', 'pdr,complete,door'),
      (11, 11, 11, 'Key Scratch - Full Left Side', 'Vandalism scratches running entire left side', 'damage', '2024-04-28', 'vandalism,scratch,paint'),
      (13, 13, 13, 'Rollover - Roof Crush', 'Roof crushed from rollover, A and B pillars damaged', 'damage', '2024-05-12', 'rollover,roof,structural,total_loss'),
      (10, 10, 10, 'Flood Water Line Interior', 'Water line visible on interior door panel', 'damage', '2024-04-15', 'flood,interior,water,electrical')
    `);
    console.log('Photos seeded (15)');

    // Seed Appointments
    await client.query(`
      INSERT INTO appointments (customer_id, vehicle_id, title, appointment_type, date, time_start, time_end, technician_id, status, notes) VALUES
      (1, 1, 'Bumper repair estimate', 'estimate', '2024-03-25', '09:00', '09:30', NULL, 'scheduled', 'Customer requesting quote for front bumper repair'),
      (2, 2, 'Trunk repair drop-off', 'repair', '2024-03-25', '08:00', '08:30', 1, 'confirmed', 'Customer dropping off vehicle for trunk repair'),
      (3, 3, 'Hail damage inspection', 'inspection', '2024-03-26', '10:00', '10:45', 2, 'scheduled', 'Insurance adjuster will be present'),
      (4, 4, 'Fender repair pickup', 'pickup', '2024-03-26', '15:00', '15:30', NULL, 'scheduled', 'Vehicle ready for pickup'),
      (5, 5, 'Follow-up on deer strike repair', 'followup', '2024-03-27', '11:00', '11:30', 3, 'scheduled', 'Check quality of front end repair'),
      (6, 6, 'PDR estimate', 'estimate', '2024-03-27', '14:00', '14:30', 4, 'confirmed', 'Small door ding - PDR candidate'),
      (7, 7, 'Windshield replacement', 'repair', '2024-03-28', '09:00', '11:00', 5, 'scheduled', 'Full windshield replacement'),
      (8, 8, 'Paint job consultation', 'estimate', '2024-03-28', '13:00', '13:45', NULL, 'scheduled', 'Full vehicle repaint consultation'),
      (1, 1, 'Final inspection', 'inspection', '2024-03-20', '10:00', '10:30', 1, 'completed', 'Repair completed successfully'),
      (9, 9, 'T-bone damage assessment', 'estimate', '2024-03-29', '08:30', '09:15', 2, 'scheduled', 'Structural damage needs assessment')
    `);
    console.log('Appointments seeded (10)');

    // Seed Inventory
    await client.query(`
      INSERT INTO inventory (part_name, part_number, category, quantity, min_quantity, unit_cost, sell_price, supplier_id, location, status, notes) VALUES
      ('Front Bumper Cover - Universal', 'BMP-UNI-001', 'Bumpers', 12, 5, 85.00, 150.00, 1, 'Shelf A-1', 'in_stock', 'Universal fit for most sedans'),
      ('Rear Bumper Cover - Universal', 'BMP-UNI-002', 'Bumpers', 8, 5, 90.00, 160.00, 1, 'Shelf A-2', 'in_stock', NULL),
      ('Headlight Assembly - Left', 'LGT-HL-L01', 'Lights', 4, 3, 120.00, 220.00, 2, 'Shelf B-1', 'in_stock', 'LED compatible'),
      ('Headlight Assembly - Right', 'LGT-HL-R01', 'Lights', 2, 3, 120.00, 220.00, 2, 'Shelf B-2', 'in_stock', 'LOW STOCK - reorder needed'),
      ('Taillight Assembly - Left', 'LGT-TL-L01', 'Lights', 6, 3, 65.00, 130.00, 2, 'Shelf B-3', 'in_stock', NULL),
      ('Windshield Glass - Standard', 'GLS-WS-001', 'Glass', 3, 2, 180.00, 350.00, 3, 'Rack C-1', 'in_stock', 'Standard laminated safety glass'),
      ('Door Panel - Front Left', 'BDY-DP-FL1', 'Body Panels', 1, 2, 250.00, 450.00, 1, 'Bay D-1', 'in_stock', 'Low stock alert'),
      ('Fender - Front Right', 'BDY-FN-FR1', 'Body Panels', 5, 3, 150.00, 280.00, 1, 'Bay D-2', 'in_stock', NULL),
      ('Base Coat Paint - White', 'PNT-BC-WHT', 'Paint', 15, 5, 45.00, 0.00, 4, 'Paint Room', 'in_stock', 'Per quart'),
      ('Base Coat Paint - Black', 'PNT-BC-BLK', 'Paint', 18, 5, 45.00, 0.00, 4, 'Paint Room', 'in_stock', 'Per quart'),
      ('Clear Coat', 'PNT-CC-001', 'Paint', 20, 8, 55.00, 0.00, 4, 'Paint Room', 'in_stock', 'Per quart'),
      ('Body Filler - Bondo', 'HW-BF-001', 'Hardware', 10, 4, 22.00, 0.00, 5, 'Shelf E-1', 'in_stock', 'Per gallon'),
      ('Sandpaper Assortment', 'HW-SP-AST', 'Hardware', 25, 10, 8.00, 0.00, 5, 'Shelf E-2', 'in_stock', 'Mixed grit pack'),
      ('Masking Tape - 2 inch', 'HW-MT-002', 'Hardware', 30, 10, 5.50, 0.00, 5, 'Shelf E-3', 'in_stock', 'Blue painters tape'),
      ('Welding Wire - MIG', 'HW-WW-MIG', 'Hardware', 3, 5, 35.00, 0.00, 5, 'Welding Station', 'in_stock', 'Low stock - reorder soon')
    `);
    console.log('Inventory seeded (15)');

    // Seed Shop Settings
    await client.query(`
      INSERT INTO shop_settings (key, value, category) VALUES
      ('shop_name', 'Premium Auto Body & Collision', 'general'),
      ('shop_address', '4521 Main Street, Austin, TX 78701', 'general'),
      ('shop_phone', '(512) 555-0100', 'general'),
      ('shop_email', 'info@premiumautobody.com', 'general'),
      ('shop_website', 'www.premiumautobody.com', 'general'),
      ('shop_license', 'TX-AB-2024-5521', 'general'),
      ('default_tax_rate', '8.25', 'financial'),
      ('default_labor_rate', '75.00', 'financial'),
      ('default_paint_rate', '50.00', 'financial'),
      ('currency', 'USD', 'financial'),
      ('payment_terms', 'Net 30', 'financial'),
      ('business_hours_start', '08:00', 'operations'),
      ('business_hours_end', '17:00', 'operations'),
      ('business_days', 'Mon-Fri', 'operations'),
      ('max_daily_appointments', '10', 'operations'),
      ('default_appointment_duration', '60', 'operations'),
      ('default_estimate_validity', '30', 'operations'),
      ('low_stock_alert', 'true', 'notifications'),
      ('appointment_reminder', 'true', 'notifications'),
      ('payment_overdue_days', '30', 'notifications')
    `);
    console.log('Shop settings seeded');

    console.log('\n✅ All seed data inserted successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
