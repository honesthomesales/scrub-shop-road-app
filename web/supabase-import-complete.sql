-- Complete Supabase Import Script for Scrub Shop Road App
-- This script recreates all tables with correct schema and imports your data

-- Drop all existing tables
DROP TABLE IF EXISTS trailer_history CASCADE;
DROP TABLE IF EXISTS camper_history CASCADE;
DROP TABLE IF EXISTS venues CASCADE;

-- Create Trailer History Table with correct structure
CREATE TABLE trailer_history (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  sales_tax DECIMAL(10,2),
  net_sales DECIMAL(10,2),
  gross_sales DECIMAL(10,2),
  common_venue_name VARCHAR(255),
  promo VARCHAR(255),
  promo_to_send TEXT,
  address_city TEXT,
  contact VARCHAR(255),
  phone VARCHAR(100),
  email VARCHAR(255),
  times VARCHAR(255),
  show_info TEXT,
  forecast VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Camper History Table with correct structure
CREATE TABLE camper_history (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  sales_tax DECIMAL(10,2),
  net_sales DECIMAL(10,2),
  gross_sales DECIMAL(10,2),
  common_venue_name VARCHAR(255),
  promo VARCHAR(255),
  promo_to_send TEXT,
  address_city TEXT,
  contact VARCHAR(255),
  phone VARCHAR(100),
  email VARCHAR(255),
  times VARCHAR(255),
  show_info TEXT,
  forecast VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Venues Table with correct structure
CREATE TABLE venues (
  id BIGSERIAL PRIMARY KEY,
  common_venue_name VARCHAR(255) UNIQUE,
  promo VARCHAR(255),
  promo_to_send TEXT,
  address_city TEXT,
  contact VARCHAR(255),
  phone VARCHAR(100),
  email VARCHAR(255),
  times VARCHAR(255),
  show_info TEXT,
  forecast VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import Venues data
INSERT INTO venues (common_venue_name, promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast) VALUES
('Prisma Health Baptist Hospital', 'Prisma Health Baptist Hospital', '', 'Taylor at Marion St Columbia, SC 29220', 'Leah / Teresa', 'Cell - 803-413-8056', '', '7:00 AM - 7:00 PM', 'Auditorium', '');

-- Import Trailer History data
INSERT INTO trailer_history (date, status, sales_tax, net_sales, gross_sales, common_venue_name) VALUES
('2022-01-20 00:00:00'::timestamp with time zone, 'CV', NULL, NULL, 19760, 'Prisma Health Baptist Hospital'),
('2022-03-02 00:00:00'::timestamp with time zone, 'CV', 237.23, NULL, 3626, 'Hillcrest Hospital');

-- Import Camper History data
INSERT INTO camper_history (date, status, sales_tax, net_sales, gross_sales, common_venue_name) VALUES
('2022-01-20 00:00:00'::timestamp with time zone, 'CV', NULL, NULL, 19760, 'Prisma Health Baptist Hospital'),
('2022-03-02 00:00:00'::timestamp with time zone, 'CV', 237.23, 3389, 3626, 'Hillcrest Hospital');

-- Add missing venue for Hillcrest Hospital
INSERT INTO venues (common_venue_name, promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast)
SELECT 'Hillcrest Hospital', 'Hillcrest Hospital', '', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE common_venue_name = 'Hillcrest Hospital');

-- Create indexes for better performance
CREATE INDEX idx_trailer_history_date ON trailer_history(date);
CREATE INDEX idx_trailer_history_common_venue_name ON trailer_history(common_venue_name);
CREATE INDEX idx_trailer_history_status ON trailer_history(status);
CREATE INDEX idx_camper_history_date ON camper_history(date);
CREATE INDEX idx_camper_history_common_venue_name ON camper_history(common_venue_name);
CREATE INDEX idx_camper_history_status ON camper_history(status);
CREATE INDEX idx_venues_common_venue_name ON venues(common_venue_name);
CREATE INDEX idx_venues_promo ON venues(promo);

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

-- Enable Row Level Security (RLS)
ALTER TABLE trailer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE camper_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

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

-- Verification queries
SELECT 'Venues imported:' as info, COUNT(*) as count FROM venues
UNION ALL
SELECT 'Trailer History imported:', COUNT(*) FROM trailer_history
UNION ALL
SELECT 'Camper History imported:', COUNT(*) FROM camper_history;

-- Show sample data to verify
SELECT 'Sample Venues:' as table_name, common_venue_name, promo, address_city FROM venues LIMIT 5;
SELECT 'Sample Trailer History:' as table_name, date, status, gross_sales, common_venue_name FROM trailer_history LIMIT 5;
SELECT 'Sample Camper History:' as table_name, date, status, gross_sales, common_venue_name FROM camper_history LIMIT 5; 