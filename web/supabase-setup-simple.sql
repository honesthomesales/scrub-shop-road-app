-- Simplified Supabase Database Schema for Scrub Shop Road App
-- Based on actual TSV data structure

-- Drop existing tables if they exist
DROP TABLE IF EXISTS trailer_history CASCADE;
DROP TABLE IF EXISTS camper_history CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- Create tables based on actual TSV data structure

-- Trailer History Table (matches actual TSV data)
CREATE TABLE trailer_history (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  sales_tax DECIMAL(10,2),
  net_sales DECIMAL(10,2),
  gross_sales DECIMAL(10,2),
  venue_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Camper History Table (identical structure to trailer_history)
CREATE TABLE camper_history (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  sales_tax DECIMAL(10,2),
  net_sales DECIMAL(10,2),
  gross_sales DECIMAL(10,2),
  venue_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues Table (extracted from venue_id values)
CREATE TABLE venues (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff Table
CREATE TABLE staff (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'Worker' CHECK (role IN ('Manager', 'Worker', 'Driver', 'Sales', 'Support')),
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave', 'Terminated')),
  hire_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_trailer_history_date ON trailer_history(date);
CREATE INDEX idx_trailer_history_venue_id ON trailer_history(venue_id);
CREATE INDEX idx_trailer_history_status ON trailer_history(status);
CREATE INDEX idx_camper_history_date ON camper_history(date);
CREATE INDEX idx_camper_history_venue_id ON camper_history(venue_id);
CREATE INDEX idx_camper_history_status ON camper_history(status);
CREATE INDEX idx_venues_name ON venues(name);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_role ON staff(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_trailer_history_updated_at BEFORE UPDATE ON trailer_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_camper_history_updated_at BEFORE UPDATE ON camper_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE trailer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE camper_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to trailer_history" ON trailer_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to trailer_history" ON trailer_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to trailer_history" ON trailer_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to trailer_history" ON trailer_history FOR DELETE USING (true);

CREATE POLICY "Allow public read access to camper_history" ON camper_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to camper_history" ON camper_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to camper_history" ON camper_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to camper_history" ON camper_history FOR DELETE USING (true);

CREATE POLICY "Allow public read access to venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to venues" ON venues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to venues" ON venues FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to venues" ON venues FOR DELETE USING (true);

CREATE POLICY "Allow public read access to staff" ON staff FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to staff" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to staff" ON staff FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to staff" ON staff FOR DELETE USING (true);

-- Insert sample staff data
INSERT INTO staff (name, email, phone, role, status, hire_date, notes) VALUES
('John Smith', 'john@scrubshop.com', '555-123-4567', 'Worker', 'Active', '2024-01-01', 'Experienced team member'),
('Jane Doe', 'jane@scrubshop.com', '555-987-6543', 'Worker', 'Active', '2024-01-15', 'New hire'),
('Mike Johnson', 'mike@scrubshop.com', '555-456-7890', 'Manager', 'Active', '2023-12-01', 'Team lead');

-- Insert venues from your data
INSERT INTO venues (name) VALUES
('Prisma Health Baptist Hospital'),
('Hillcrest Hospital'),
('North Greenville Medical Campus'),
('Rosecrest Nursing Home'),
('Oconee Medical Center'),
('Southpointe Healthcare and Rehabilitation BUS'),
('PRWC - Fundamental BUS'),
('HMR Charlotte Hall Veterans Home'),
('Col Robert L Howard Veterans Home'),
('Floyd E. "Tut" Fann Veterans Home'); 