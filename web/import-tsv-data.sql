-- Supabase TSV Import Script for Scrub Shop Road App
-- Run this script in your Supabase SQL Editor

-- First, let's clear existing data to avoid duplicates
TRUNCATE TABLE trailer_history CASCADE;
TRUNCATE TABLE camper_history CASCADE;
TRUNCATE TABLE venues CASCADE;

-- Import Venues data first (since sales data references venues)
-- Copy and paste your venues TSV data here
-- Format: INSERT INTO venues (promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast) VALUES
-- Example based on your data:
INSERT INTO venues (promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast) VALUES
('Prisma Health Baptist Hospital', '', 'Taylor at Marion St Columbia, SC 29220', 'Leah / Teresa', 'Cell - 803-413-8056', '', '7:00 AM - 7:00 PM', 'Auditorium', '');

-- Import Trailer History data
-- Copy and paste your trailer history TSV data here
-- Format: INSERT INTO trailer_history (date, status, sales_tax, net_sales, gross_sales, common_venue_name) VALUES
-- Example based on your data:
INSERT INTO trailer_history (date, status, sales_tax, net_sales, gross_sales, common_venue_name) VALUES
('2022-01-20 00:00:00', 'CV', NULL, NULL, 19760, 'Prisma Health Baptist Hospital'),
('2022-03-02 00:00:00', 'CV', 237.23, NULL, 3626, 'Hillcrest Hospital');

-- Import Camper History data
-- Copy and paste your camper history TSV data here
-- Format: INSERT INTO camper_history (date, status, sales_tax, net_sales, gross_sales, common_venue_name) VALUES
-- Example based on your data:
INSERT INTO camper_history (date, status, sales_tax, net_sales, gross_sales, common_venue_name) VALUES
('2022-01-20 00:00:00', 'CV', NULL, NULL, 19760, 'Prisma Health Baptist Hospital'),
('2022-03-02 00:00:00', 'CV', 237.23, 3389, 3626, 'Hillcrest Hospital');

-- Update venues table with any missing venues from sales data
INSERT INTO venues (common_venue_name, promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast)
SELECT DISTINCT 
    th.common_venue_name,
    th.promo,
    th.promo_to_send,
    th.address_city,
    th.contact,
    th.phone,
    th.email,
    th.times,
    th.show_info,
    th.forecast
FROM trailer_history th
WHERE th.common_venue_name IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM venues v WHERE v.common_venue_name = th.common_venue_name
);

INSERT INTO venues (common_venue_name, promo, promo_to_send, address_city, contact, phone, email, times, show_info, forecast)
SELECT DISTINCT 
    ch.common_venue_name,
    ch.promo,
    ch.promo_to_send,
    ch.address_city,
    ch.contact,
    ch.phone,
    ch.email,
    ch.times,
    ch.show_info,
    ch.forecast
FROM camper_history ch
WHERE ch.common_venue_name IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM venues v WHERE v.common_venue_name = ch.common_venue_name
);

-- Verify the import
SELECT 'Venues imported:' as info, COUNT(*) as count FROM venues
UNION ALL
SELECT 'Trailer History imported:', COUNT(*) FROM trailer_history
UNION ALL
SELECT 'Camper History imported:', COUNT(*) FROM camper_history;

-- Show sample data to verify
SELECT 'Sample Venues:' as table_name, common_venue_name, promo FROM venues LIMIT 5;
SELECT 'Sample Trailer History:' as table_name, date, status, gross_sales, common_venue_name FROM trailer_history LIMIT 5;
SELECT 'Sample Camper History:' as table_name, date, status, gross_sales, common_venue_name FROM camper_history LIMIT 5; 