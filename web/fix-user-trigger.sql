-- Fix User Profile Creation Trigger
-- Run this script in your Supabase SQL editor to ensure the trigger works correctly
-- This will recreate the trigger function and trigger if they don't exist or are broken

-- Step 1: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create the function that will create user profiles
-- This function uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user profile with proper error handling
    -- This runs with SECURITY DEFINER privileges, so it bypasses RLS
    BEGIN
        INSERT INTO public.users (id, email, name, role, is_active)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
            'user',
            true
        )
        ON CONFLICT (id) DO NOTHING; -- Don't error if profile already exists
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the auth signup
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger that fires when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 5: Test the function (optional - uncomment to test)
-- This simulates what happens when a user signs up
-- DO NOT RUN THIS UNLESS YOU WANT TO CREATE A TEST USER
/*
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Simulate trigger execution
    PERFORM public.handle_new_user() FROM (
        SELECT 
            test_user_id as id,
            'test@example.com' as email,
            '{"name": "Test User"}'::jsonb as raw_user_meta_data
    ) AS NEW;
    
    -- Check if profile was created
    IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
        RAISE NOTICE 'SUCCESS: User profile created successfully';
        DELETE FROM public.users WHERE id = test_user_id;
    ELSE
        RAISE WARNING 'FAILED: User profile was not created';
    END IF;
END $$;
*/

-- Step 6: Grant necessary permissions (if not already granted)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Note: If you still have issues, check:
-- 1. That the users table exists and has the correct structure
-- 2. That RLS is enabled on the users table
-- 3. That the function owner has proper permissions
-- 4. Check Supabase logs for any trigger execution errors

