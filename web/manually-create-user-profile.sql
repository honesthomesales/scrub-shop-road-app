-- Manually Create User Profile for Existing Auth User
-- Run this script in your Supabase SQL editor to create a profile for a user that was created but doesn't have a profile

-- Replace these values with the actual user information:
-- User ID: 1e78059f-35a1-486c-8ed2-4142e5e077c6
-- Email: kylie@thescrubshop.com
-- Staff ID: (get this from the staff table where email matches)

-- Step 1: Get the staff ID for this email
-- Run this first to find the staff_id:
SELECT id, name, email FROM staff WHERE email = 'kylie@thescrubshop.com';

-- Step 2: Create the user profile (replace STAFF_ID_HERE with the ID from step 1)
-- If staff_id is NULL, the user will be created without a staff link (can be linked later)
INSERT INTO public.users (id, email, name, role, staff_id, is_active)
VALUES (
    '1e78059f-35a1-486c-8ed2-4142e5e077c6'::uuid,
    'kylie@thescrubshop.com',
    'Kylie', -- Update with actual name if different
    'user', -- Change to 'admin' or 'manager' if needed
    NULL, -- Replace with staff_id from step 1, or leave NULL to link later
    true
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    staff_id = COALESCE(EXCLUDED.staff_id, users.staff_id),
    is_active = EXCLUDED.is_active;

-- Step 3: Verify the profile was created
SELECT * FROM public.users WHERE id = '1e78059f-35a1-486c-8ed2-4142e5e077c6'::uuid;

-- Step 4: If you want to link to staff member, update with staff_id:
-- UPDATE public.users 
-- SET staff_id = (SELECT id FROM staff WHERE email = 'kylie@thescrubshop.com')
-- WHERE id = '1e78059f-35a1-486c-8ed2-4142e5e077c6'::uuid;


