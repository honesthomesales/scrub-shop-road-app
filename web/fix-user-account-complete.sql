-- Complete User Account Fix Script
-- Run this script in your Supabase SQL editor to diagnose and fix user account issues
-- Email: honesthomesales@gmail.com

-- Step 1: Check if user exists in auth.users
SELECT 
    id as auth_user_id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'honesthomesales@gmail.com';

-- Step 2: Check if user profile exists in public.users
SELECT 
    id,
    email,
    name,
    role,
    staff_id,
    is_active,
    created_at,
    updated_at
FROM public.users 
WHERE email = 'honesthomesales@gmail.com';

-- Step 3: Check if staff member exists with this email
SELECT 
    id as staff_id,
    name,
    email,
    role as staff_role,
    status
FROM public.staff 
WHERE email = 'honesthomesales@gmail.com';

-- Step 4: Fix the user profile
-- Option A: If user profile exists but role is wrong
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true
WHERE email = 'honesthomesales@gmail.com';

-- Option B: If user profile doesn't exist, create it
-- First, get the auth user ID from Step 1, then run:
/*
INSERT INTO public.users (id, email, name, role, is_active)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', email) as name,
    'admin' as role,
    true as is_active
FROM auth.users
WHERE email = 'honesthomesales@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    email = EXCLUDED.email;
*/

-- Step 5: Link user to staff member (if staff exists)
-- First check Step 3 to see if staff_id exists, then:
/*
UPDATE public.users 
SET staff_id = (
    SELECT id FROM public.staff 
    WHERE email = 'honesthomesales@gmail.com'
    LIMIT 1
)
WHERE email = 'honesthomesales@gmail.com';
*/

-- Step 6: Verify everything is correct
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.role,
    u.staff_id,
    u.is_active,
    s.name as staff_name,
    s.role as staff_role
FROM public.users u
LEFT JOIN public.staff s ON u.staff_id = s.id
WHERE u.email = 'honesthomesales@gmail.com';

-- Step 7: If you need to create a staff member for this user:
/*
INSERT INTO public.staff (name, email, role, status)
VALUES (
    'Your Name',  -- Replace with your actual name
    'honesthomesales@gmail.com',
    'Manager',    -- or 'Worker' or 'Admin'
    'Active'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status
RETURNING id;

-- Then link the user to the staff member:
UPDATE public.users 
SET staff_id = (
    SELECT id FROM public.staff 
    WHERE email = 'honesthomesales@gmail.com'
)
WHERE email = 'honesthomesales@gmail.com';
*/

