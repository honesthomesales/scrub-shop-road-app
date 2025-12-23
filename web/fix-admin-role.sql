-- Fix Admin Role for User
-- Run this script in your Supabase SQL editor to restore admin access
-- Replace the email with your actual email address

-- Option 1: Update by email (recommended)
UPDATE public.users 
SET role = 'admin', is_active = true
WHERE email = 'honesthomesales@gmail.com';

-- Option 2: Update by user ID (if you know the ID from auth.users table)
-- First, find your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'honesthomesales@gmail.com';
-- Then update:
-- UPDATE public.users 
-- SET role = 'admin', is_active = true
-- WHERE id = 'YOUR_USER_ID_HERE'::uuid;

-- Verify the update
SELECT id, email, name, role, is_active, staff_id 
FROM public.users 
WHERE email = 'honesthomesales@gmail.com';

-- If the user doesn't exist in the users table, create it:
-- First get your auth user ID:
-- SELECT id FROM auth.users WHERE email = 'honesthomesales@gmail.com';
-- Then insert (replace YOUR_AUTH_USER_ID with the ID from above):
/*
INSERT INTO public.users (id, email, name, role, is_active)
VALUES (
    'YOUR_AUTH_USER_ID'::uuid,
    'honesthomesales@gmail.com',
    'Your Name',
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true;
*/

