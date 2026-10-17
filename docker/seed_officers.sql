-- 🏛️ Seed Complete Set of Field Officers across all Municipal Departments

-- Ensure Departments Table has correct IDs matching FrontEnd
TRUNCATE TABLE departments CASCADE;
INSERT INTO departments (id, name, code) VALUES
(1, 'Sanitation', 'SAN'),
(2, 'Electricity', 'ELE'),
(3, 'Water Supply', 'WAT'),
(4, 'Roads & Bridges', 'ROA'),
(5, 'Public Health', 'HEA'),
(6, 'Education', 'EDU'),
(7, 'Transport', 'TRA'),
(8, 'Sewage & Drains', 'SEW')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- Seed Field Officers for every Department (Password for all: officer123)
-- BCrypt Hash: $2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG

INSERT INTO enterprise_users (name, email, phone_number, password_hash, role, department_id, ward_id, is_verified, city, district, ward_name) VALUES
('Field Officer Raman', 'officer@civicsync.gov.in', '9876543210', '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG', 'FIELD_OFFICER', 1, 1, true, 'Villupuram', 'Villupuram', 'Ward 1'),
('Officer Priya (Electricity)', 'officer.ele@civicsync.gov.in', '9876543212', '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG', 'FIELD_OFFICER', 2, 1, true, 'Villupuram', 'Villupuram', 'Ward 1'),
('Officer Murugan (Water Supply)', 'officer.water@civicsync.gov.in', '9876543213', '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG', 'FIELD_OFFICER', 3, 1, true, 'Villupuram', 'Villupuram', 'Ward 1'),
('Officer Suresh (Roads & Bridges)', 'officer.roads@civicsync.gov.in', '9876543214', '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG', 'FIELD_OFFICER', 4, 1, true, 'Villupuram', 'Villupuram', 'Ward 1'),
('Officer Anitha (Public Health)', 'officer.health@civicsync.gov.in', '9876543215', '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG', 'FIELD_OFFICER', 5, 1, true, 'Villupuram', 'Villupuram', 'Ward 1'),
('Officer Karthik (Education)', 'officer.edu@civicsync.gov.in', '9876543216', '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG', 'FIELD_OFFICER', 6, 1, true, 'Villupuram', 'Villupuram', 'Ward 1'),
('Officer Selvam (Transport)', 'officer.trans@civicsync.gov.in', '9876543217', '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG', 'FIELD_OFFICER', 7, 1, true, 'Villupuram', 'Villupuram', 'Ward 1'),
('Officer Deepa (Sewage & Drains)', 'officer.sewage@civicsync.gov.in', '9876543218', '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG', 'FIELD_OFFICER', 8, 1, true, 'Villupuram', 'Villupuram', 'Ward 1')
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name, 
  role = 'FIELD_OFFICER', 
  department_id = EXCLUDED.department_id, 
  ward_id = EXCLUDED.ward_id,
  password_hash = EXCLUDED.password_hash;

-- Ensure Supervisor exists
INSERT INTO enterprise_users (name, email, phone_number, password_hash, role, department_id, ward_id, is_verified, city, district, ward_name) VALUES
('Supervisor Kumar', 'supervisor@civicsync.gov.in', '9876543211', '$2a$10$8hdMpXFpPbzQeOnrCIccBOFttgPc.zNci5ER2s4LRDnoCLVJ4HJfG', 'SUPERVISOR', 1, 1, true, 'Villupuram', 'Villupuram', 'Ward 1')
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name, 
  role = 'SUPERVISOR', 
  password_hash = EXCLUDED.password_hash;
