# Tasks Table Fix - Issue Resolution

## Problem Description

The application was throwing the following error when trying to load tasks:

```
GET https://kvsbrrmzedadyffqtcdq.supabase.co/rest/v1/tasks?select=*%2Cassigned_by_user%3Astaff%21tasks_assigned_by_fkey%28id%2Cname%2Cemail%29%2Cassigned_to_user%3Astaff!tasks_assigned_to_fkey%28id%2Cname%2Cemail%29&order=created_at.desc 400 (Bad Request)

Failed to get tasks: Error: Could not find a relationship between 'tasks' and 'staff' in the schema cache
```

## Root Cause

The issue was caused by two main problems:

1. **Missing `tasks` table**: The `tasks` table did not exist in the Supabase database schema
2. **Incorrect foreign key relationships**: The code was trying to use foreign key relationships (`tasks_assigned_by_fkey` and `tasks_assigned_to_fkey`) that didn't exist

## Solution Applied

### 1. Created the Missing Tasks Table

Created `add-tasks-table.sql` with the proper table structure:

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_by BIGINT REFERENCES staff(id) ON DELETE SET NULL,
  assigned_to BIGINT REFERENCES staff(id) ON DELETE SET NULL,
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Fixed the API Code

Updated `web/src/services/supabaseAPI.js`:

- **Fixed `updateTask` method**: Removed incorrect foreign key relationship syntax
- **Simplified `getTaskComments` and `addTaskComment` methods**: Disabled task comments functionality until the `task_comments` table is created

### 3. Database Setup

The SQL script includes:
- Proper foreign key relationships to the `staff` table
- Indexes for performance optimization
- Row Level Security (RLS) policies
- Sample data for testing

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the content from `add-tasks-table.sql`
4. Click 'Run' to execute the SQL commands

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:
```bash
supabase db push --file add-tasks-table.sql
```

## Files Modified

1. **`web/add-tasks-table.sql`** - New SQL script to create the tasks table
2. **`web/add-tasks-table.ps1`** - PowerShell script to guide the database setup
3. **`web/src/services/supabaseAPI.js`** - Fixed foreign key relationship issues
4. **`web/TASKS_TABLE_FIX.md`** - This documentation file

## Verification

After applying the fix:

1. The tasks page should load without errors
2. You should be able to create, edit, and delete tasks
3. Tasks should be properly associated with staff members
4. The foreign key relationship errors should be resolved

## Future Enhancements

If you want to enable task comments functionality:

1. Create a `task_comments` table with proper foreign key relationships
2. Update the `getTaskComments` and `addTaskComment` methods in `supabaseAPI.js`
3. Implement the comments UI in the Tasks page

## Notes

- The task comments functionality has been temporarily disabled to prevent errors
- The sample data includes 4 tasks that reference existing staff members (IDs 1, 2, 3)
- All foreign key relationships use `ON DELETE SET NULL` to prevent cascade deletion issues 