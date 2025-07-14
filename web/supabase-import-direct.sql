-- Direct Supabase Import Script for Scrub Shop Road App
-- Based on your TSV data - run this in Supabase SQL Editor

-- Clear existing data to avoid duplicates
TRUNCATE TABLE trailer_history CASCADE;
TRUNCATE TABLE camper_history CASCADE;
TRUNCATE TABLE venues CASCADE;

-- Import Venues data
INSERT INTO venues (promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast) VALUES
('Prisma Health Baptist Hospital', '', 'Taylor at Marion St Columbia, SC 29220', 'Leah / Teresa', 'Cell - 803-413-8056', '', '7:00 AM - 7:00 PM', 'Auditorium', '');

-- Import Trailer History data
INSERT INTO trailer_history (date, status, sales_tax, net_sales, gross_sales, common_venue_name) VALUES
('2022-01-20 00:00:00'::timestamp with time zone, 'CV', NULL, NULL, 19760, 'Prisma Health Baptist Hospital'),
('2022-03-02 00:00:00'::timestamp with time zone, 'CV', 237.23, NULL, 3626, 'Hillcrest Hospital');

-- Import Camper History data
INSERT INTO camper_history (date, status, sales_tax, net_sales, gross_sales, common_venue_name) VALUES
('2022-01-20 00:00:00'::timestamp with time zone, 'CV', NULL, NULL, 19760, 'Prisma Health Baptist Hospital'),
('2022-03-02 00:00:00'::timestamp with time zone, 'CV', 237.23, 3389, 3626, 'Hillcrest Hospital');

-- Add missing venue for Hillcrest Hospital (from sales data)
INSERT INTO venues (common_venue_name, promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast)
SELECT 'Hillcrest Hospital', '', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE common_venue_name = 'Hillcrest Hospital');

-- Verification queries
SELECT 'Venues imported:' as info, COUNT(*) as count FROM venues
UNION ALL
SELECT 'Trailer History imported:', COUNT(*) FROM trailer_history
UNION ALL
SELECT 'Camper History imported:', COUNT(*) FROM camper_history;

-- Show sample data to verify
SELECT 'Sample Venues:' as table_name, promo, address_city FROM venues LIMIT 5;
SELECT 'Sample Trailer History:' as table_name, date, status, gross_sales, common_venue_name FROM trailer_history LIMIT 5;
SELECT 'Sample Camper History:' as table_name, date, status, gross_sales, common_venue_name FROM camper_history LIMIT 5; 