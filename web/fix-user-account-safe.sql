-- Safe User Account Fix Script
-- This script checks the schema first and fixes your user account
-- Email: honesthomesales@gmail.com

-- Step 1: Check what columns exist in the users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 2: Check if user exists in auth.users
SELECT 
    id as auth_user_id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'honesthomesales@gmail.com';

-- Step 3: Check if user profile exists in public.users
SELECT *
FROM public.users 
WHERE email = 'honesthomesales@gmail.com';

-- Step 4: Fix the user profile (only updates columns that exist)
-- This will work regardless of whether staff_id exists or not
UPDATE public.users 
SET 
    role = 'admin',
    is_active = true
WHERE email = 'honesthomesales@gmail.com';

-- Step 5: If user profile doesn't exist, create it
-- First get your auth user ID from Step 2, then uncomment and run:
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
    is_active = true;
*/

-- Step 6: Verify the fix
SELECT id, email, name, role, is_active, created_at
FROM public.users 
WHERE email = 'honesthomesales@gmail.com';


