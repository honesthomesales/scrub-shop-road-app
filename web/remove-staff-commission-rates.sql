-- Remove staff_commission_rates table since we're using flat rate bonus system
-- This table is no longer needed as we use commission_tiers for flat rate bonuses

-- Drop the staff_commission_rates table
DROP TABLE IF EXISTS staff_commission_rates CASCADE;

-- Verify the table is removed
SELECT 'staff_commission_rates table removed successfully' as status; 