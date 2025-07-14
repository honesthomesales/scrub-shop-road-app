-- Auto-generated Supabase Import Script
-- Generated on 2025-07-11T01:29:06.023Z

-- Clear existing data
TRUNCATE TABLE trailer_history CASCADE;
TRUNCATE TABLE camper_history CASCADE;
TRUNCATE TABLE venues CASCADE;

-- Verification queries
SELECT 'Venues imported:' as info, COUNT(*) as count FROM venues
UNION ALL
SELECT 'Trailer History imported:', COUNT(*) FROM trailer_history
UNION ALL
SELECT 'Camper History imported:', COUNT(*) FROM camper_history;

-- Sample data verification
SELECT 'Sample Venues:' as table_name, promo, address_city FROM venues LIMIT 5;
SELECT 'Sample Trailer History:' as table_name, date, status, gross_sales, common_venue_name FROM trailer_history LIMIT 5;
SELECT 'Sample Camper History:' as table_name, date, status, gross_sales, common_venue_name FROM camper_history LIMIT 5;
