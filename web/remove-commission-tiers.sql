-- Remove commission tiers from Spartanburg, Greenville, and Columbia stores
-- This script will delete all commission tiers for stores 1, 3, and 4

-- First, let's see what commission tiers exist
SELECT 
  ct.id,
  ct.tier_name,
  ct.sales_target,
  ct.commission_rate,
  ct.bonus_amount,
  s.name as store_name,
  s.number as store_number
FROM commission_tiers ct
JOIN stores s ON ct.store_id = s.id
ORDER BY s.number, ct.sales_target;

-- Now remove commission tiers for Spartanburg (store_id = 1), Greenville (store_id = 3), and Columbia (store_id = 4)
DELETE FROM commission_tiers 
WHERE store_id IN (1, 3, 4);

-- Verify the deletion
SELECT 
  ct.id,
  ct.tier_name,
  ct.sales_target,
  ct.commission_rate,
  ct.bonus_amount,
  s.name as store_name,
  s.number as store_number
FROM commission_tiers ct
JOIN stores s ON ct.store_id = s.id
ORDER BY s.number, ct.sales_target;

-- Also remove any staff commission rates for these stores
DELETE FROM staff_commission_rates 
WHERE store_id IN (1, 3, 4);

-- Verify staff commission rates deletion
SELECT 
  scr.id,
  scr.base_commission_rate,
  scr.commission_multiplier,
  scr.bonus_multiplier,
  s.name as store_name,
  s.number as store_number
FROM staff_commission_rates scr
JOIN stores s ON scr.store_id = s.id
ORDER BY s.number; 