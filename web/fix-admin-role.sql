-- Fix Admin Role for User
-- Run this script in your Supabase SQL editor to restore admin access
-- Email: honesthomesales@gmail.com

-- IMPORTANT: This script checks what columns exist first, then updates accordingly.
-- It does NOT reference staff_id unless that column exists in your database.

-- Step 1: Check what columns exist in your users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 2: Check if user exists in auth.users (Supabase authentication table)
SELECT 
    id as auth_user_id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'honesthomesales@gmail.com';

-- Step 3: Check if user profile exists in public.users
SELECT *
FROM public.users 
WHERE email = 'honesthomesales@gmail.com';

-- Step 4: Create or update user profile in public.users from auth.users
-- This will create the profile if missing, or update role to admin if it exists
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
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name);

-- Step 6: Verify the fix
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.is_active,
    au.created_at as auth_created_at,
    au.last_sign_in_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'honesthomesales@gmail.com';
