# Authentication Tables and Schema

## Overview
The login system uses **two main tables**:

1. **`auth.users`** (Supabase built-in) - Stores authentication credentials
2. **`public.users`** (Custom) - Stores user profile and role information

## Table: `auth.users` (Supabase Built-in)
This is Supabase's authentication table. You cannot modify its structure.

**Key columns used by the code:**
- `id` (UUID) - Primary key, matches `public.users.id`
- `email` (TEXT) - User's email address
- `created_at` (TIMESTAMP)
- `last_sign_in_at` (TIMESTAMP)
- `raw_user_meta_data` (JSONB) - Can contain `name` field

**How it's used:**
- `supabase.auth.signInWithPassword()` authenticates against this table
- `supabase.auth.getUser()` gets the current authenticated user
- `supabase.auth.signUp()` creates new users in this table

## Table: `public.users` (Custom Profile Table)
This table stores additional user information and roles.

**Base schema (from `supabase-auth-setup.sql`):**
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY,              -- Links to auth.users.id
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',         -- 'admin', 'manager', or 'user'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Optional column (may not exist in your database):**
- `staff_id INTEGER REFERENCES public.staff(id)` - Links user to staff member

**How it's used:**
- Code queries this table to get user's `role` and `name`
- Code uses `id` (UUID) to link to `auth.users`
- Code may use `staff_id` to link to `public.staff` table (if column exists)

## Table: `public.staff` (Staff Members)
This table stores staff member information.

**Key columns:**
- `id` (INTEGER) - Primary key
- `email` (TEXT) - Staff member's email
- `name` (TEXT) - Staff member's name
- `role` (TEXT) - Staff role (different from user role)
- `status` (TEXT) - 'Active', 'Inactive', etc.

**Relationship:**
- `public.users.staff_id` → `public.staff.id` (if `staff_id` column exists)

## Login Flow

1. User enters email/password
2. `supabase.auth.signInWithPassword()` authenticates against `auth.users`
3. Code queries `public.users` using `id` from `auth.users`:
   ```javascript
   supabase.from('users').select('*').eq('id', authUser.id).maybeSingle()
   ```
4. Code gets `role` from `public.users` to determine permissions
5. If `staff_id` exists, code may query `public.staff` for additional info

## Important Notes

- The `public.users` table **may or may not** have a `staff_id` column depending on which SQL setup script was run
- The code checks for `profile?.staff_id` before using it (defensive coding)
- All queries use `id` (UUID) to link `auth.users` and `public.users`, NOT email
- The `role` field in `public.users` determines user permissions in the app

## Checking Your Schema

Run this query in Supabase SQL Editor to see what columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
```


