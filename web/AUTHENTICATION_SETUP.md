# Authentication Setup Guide

This guide will help you set up user authentication for the Scrub Shop Road App using Supabase Auth.

## Prerequisites

- A Supabase project with the existing database tables
- Access to your Supabase dashboard

## Step 1: Enable Authentication in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Authentication** > **Settings**
3. Enable **Email Auth** if not already enabled
4. Configure email templates (optional but recommended)

## Step 2: Set Up Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-auth-setup.sql`
3. Run the script to create the necessary tables and policies

## Step 3: Configure Authentication Settings

### Email Confirmation (Recommended)
1. In **Authentication** > **Settings**
2. Enable **Enable email confirmations**
3. This requires users to verify their email before they can sign in

### Password Reset
1. Enable **Enable password reset**
2. Configure the reset email template

## Step 4: Create Your First Admin User

### Option 1: Through the App (Recommended)
1. Deploy the app with authentication enabled
2. Register a new account through the app
3. Manually update the user's role to 'admin' in the database:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Option 2: Direct Database Insert
1. Go to **Authentication** > **Users**
2. Create a new user manually
3. Run this SQL to set them as admin:

```sql
INSERT INTO public.users (id, email, name, role) 
VALUES ('user-uuid-from-auth', 'admin@scrubshop.com', 'Admin User', 'admin');
```

## Step 5: Test Authentication

1. Visit your deployed app
2. You should see a login form
3. Try registering a new account
4. Test logging in and out

## User Roles

The app supports three user roles:

- **user**: Basic access to view data
- **manager**: Can edit data and manage staff
- **admin**: Full access to all features including user management

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Email Verification**: Users must verify their email before accessing the app
- **Password Requirements**: Minimum 6 characters
- **Session Management**: Automatic session handling with Supabase

## Troubleshooting

### Common Issues

1. **"Supabase not configured" error**
   - Check that your Supabase URL and anon key are correct in `supabaseAPI.js`

2. **"No user found" error**
   - Ensure the `users` table was created correctly
   - Check that the trigger function is working

3. **Permission denied errors**
   - Verify that RLS policies are set up correctly
   - Check that the user has the correct role

4. **Email not sending**
   - Check your Supabase email settings
   - Verify your email provider configuration

### Debug Steps

1. Check the browser console for errors
2. Verify Supabase connection in the Network tab
3. Check the Supabase logs in your dashboard
4. Test database queries directly in the SQL editor

## Next Steps

After setting up authentication:

1. **Customize User Roles**: Modify the role system to match your business needs
2. **Add User Management**: Create admin interfaces for managing users
3. **Implement Permissions**: Add role-based access control to specific features
4. **Audit Logging**: Track user actions for security purposes

## Support

If you encounter issues:

1. Check the Supabase documentation
2. Review the browser console for error messages
3. Check the Supabase dashboard logs
4. Verify your database schema matches the setup script
