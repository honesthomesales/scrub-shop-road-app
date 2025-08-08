-- Debug script to check commission_tiers table
SELECT 
  ct.id,
  ct.store_id,
  s.name as store_name,
  ct.tier_name,
  ct.sales_target,
  ct.commission_rate,
  ct.bonus_amount,
  ct.created_at
FROM commission_tiers ct
JOIN stores s ON ct.store_id = s.id
ORDER BY ct.store_id, ct.sales_target;

-- Check stores table
SELECT * FROM stores ORDER BY id;

-- Count commission tiers by store
SELECT 
  s.name as store_name,
  COUNT(ct.id) as tier_count
FROM stores s
LEFT JOIN commission_tiers ct ON s.id = ct.store_id
GROUP BY s.id, s.name
ORDER BY s.id; 