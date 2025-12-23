-- Fix Infinite Recursion in RLS Policies for Users Table
-- Run this script in your Supabase SQL editor to fix the infinite recursion error
-- The issue is that admin policies query the users table from within a policy on users

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.users;

-- Step 2: Create fixed policies that don't cause recursion
-- These policies use auth.uid() to check if the user exists in auth.users
-- and then check their role without querying the users table recursively

-- Policy: Admins can view all profiles
-- This checks the role from the JWT token metadata or uses a function
CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT USING (
        -- Check if current user's email matches an admin in the users table
        -- But use a subquery that doesn't cause recursion by checking auth.uid() first
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
        )
    );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
        )
    );

-- Policy: Admins can insert profiles (for admin-created users)
-- Note: This still has the recursion issue, but we'll use the trigger for inserts instead
-- Actually, let's not create this policy - the trigger handles inserts with SECURITY DEFINER

-- Step 3: Alternative approach - Use a function to check admin status
-- This function can be cached and avoids recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id::text = auth.uid()::text
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 4: Recreate policies using the function (better approach)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;

CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON public.users
    FOR UPDATE USING (public.is_admin());

-- Step 5: Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- Note: The SECURITY DEFINER function should help avoid recursion,
-- but if you still get recursion errors, you may need to:
-- 1. Temporarily disable RLS: ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- 2. Fix the policies
-- 3. Re-enable RLS: ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

