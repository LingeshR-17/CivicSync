-- 🏛️ CivicSync Database Initialization Script
-- Automatically enables PostGIS for spatial spatial indexing and coordinates
CREATE EXTENSION IF NOT EXISTS postgis;

-- 📍 Municipal Ward & District Boundary Hierarchy
CREATE TABLE IF NOT EXISTS tn_local_bodies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    district_id INTEGER
);

CREATE TABLE IF NOT EXISTS tn_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    local_body_id INTEGER REFERENCES tn_local_bodies(id)
);

CREATE TABLE IF NOT EXISTS tn_wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    ward_number INTEGER,
    zone_id INTEGER REFERENCES tn_zones(id),
    geom GEOMETRY(Geometry, 4326)
);

-- Default spatial boundaries covering Tamil Nadu region
INSERT INTO tn_local_bodies (id, name, district_id) VALUES (1, 'Villupuram Municipality', 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO tn_zones (id, name, local_body_id) VALUES (1, 'Central Zone', 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO tn_wards (id, name, ward_number, zone_id, geom) 
VALUES (1, 'Ward 1', 1, 1, ST_GeomFromText('POLYGON((79.0 11.0, 81.0 11.0, 81.0 13.0, 79.0 13.0, 79.0 11.0))', 4326)) 
ON CONFLICT (id) DO NOTHING;

-- 🏢 Departments Directory
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL
);

INSERT INTO departments (id, name, code) VALUES
(1, 'Sanitation', 'SAN'),
(2, 'Roads & Bridges', 'ROA'),
(3, 'Water Supply', 'WAT'),
(4, 'Electricity', 'ELE'),
(5, 'Public Health', 'HEA'),
(6, 'Town Planning', 'PLN')
ON CONFLICT (id) DO NOTHING;
