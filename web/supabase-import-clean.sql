-- Fixed Supabase Import Script for Scrub Shop Road App
-- This script ensures the schema is correct and then imports your data

-- First, let's make sure the venues table has the correct structure
DROP TABLE IF EXISTS venues CASCADE;

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

-- Clear existing data
TRUNCATE TABLE trailer_history CASCADE;
TRUNCATE TABLE camper_history CASCADE;

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
SELECT 'Hillcrest Hospital', 'Hillcrest Hospital', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE common_venue_name = 'Hillcrest Hospital');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_venues_common_venue_name ON venues(common_venue_name);
CREATE INDEX IF NOT EXISTS idx_venues_promo ON venues(promo);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to venues
DROP TRIGGER IF EXISTS update_venues_updated_at ON venues;
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
DROP POLICY IF EXISTS "Allow public read access to venues" ON venues;
DROP POLICY IF EXISTS "Allow public insert access to venues" ON venues;
DROP POLICY IF EXISTS "Allow public update access to venues" ON venues;
DROP POLICY IF EXISTS "Allow public delete access to venues" ON venues;

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