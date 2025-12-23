# User Management Feature Verification Guide

## Version Check
**App Version:** v1.1.0  
**User Management Feature:** v1.0.0  
**Date:** Latest changes include user creation in Staff page

## How to Verify Changes Are Working

### 1. Check Version Display
- **Desktop:** Look at the top right of the header (next to Auth Status) - you should see `v1.1.0` in a gray box
- **Mobile:** Look at the top of the mobile navigation menu - you should see `v1.1.0`
- This confirms you're running the latest version with user management features

### 2. Verify You're Logged In as Admin
- Check the top right of the page - should show your user info
- Your role must be "admin" to see user management features
- If not admin, you won't see the "Create Login Account" checkbox

### 3. Check Staff Page Features

#### A. Staff Table - "Login Account" Column
1. Go to `/staff` page
2. Look at the staff table
3. You should see a **"Login Account"** column (between "Pay Structure" and "Notes")
4. For each staff member, you should see:
   - "Active" with role (if they have an account)
   - "No account" (if they don't have an account)
   - "-" (if you're not admin)

#### B. Add/Edit Staff Form - Create Login Account
1. Click **"Add Staff Member"** button
2. Fill in Name and Email
3. **Scroll down** to the bottom of the form
4. You should see a blue info box titled "User Account Management"
5. You should see a checkbox: **"Create Login Account for this Staff Member"**
6. When checked, you should see:
   - Password field (required, min 6 characters)
   - Role dropdown (user/manager/admin)

#### C. Manage User Accounts Button
1. On Staff page, look for button: **"Manage User Accounts"** (was "Link Users")
2. Click it to open modal
3. You should see:
   - **"Create New User Account"** section at top with "+ Create New User" button
   - Form to create new user (name, email, password, role, link to staff)
   - Below: List of unlinked users to link to staff

### 4. Code Verification

#### Check Files Exist and Have Changes:

**File: `web/src/pages/Staff.jsx`**
- Line ~20-23: Should have state variables: `createLoginAccount`, `userPassword`, `userRole`, `userAccounts`
- Line ~740-810: Should have "Create Login Account Section" with checkbox and form fields
- Line ~344: Should have `<th>Login Account</th>` in table header
- Line ~445-459: Should show account status in table cells

**File: `web/src/services/supabaseAPI.js`**
- Line ~814: Should have `async createUserForStaff(email, password, name, role, staffId)` method

**File: `web/src/components/UserStaffLinker.jsx`**
- Line ~129-200: Should have "Create New User Section" with form

### 5. Test Creating a User Account

1. Go to Staff page (`/staff`)
2. Click "Add Staff Member"
3. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Check "Create Login Account"
   - Password: test123
   - Role: user
4. Click "Add Staff Member"
5. Should create staff AND user account
6. Check Staff table - should show "Active" in Login Account column
7. Try signing in with test@example.com / test123

### 6. Test UserStaffLinker

1. Click "Manage User Accounts" button
2. Click "+ Create New User"
3. Fill in form and select staff member
4. Click "Create User Account"
5. Should create account and link to staff

## Troubleshooting

### If you don't see "Create Login Account" checkbox:
- ✅ Are you logged in as admin? (Check top right)
- ✅ Did you click "Add Staff Member" or edit a staff member?
- ✅ Did you scroll to bottom of the form?
- ✅ Check browser console for errors

### If "Login Account" column is missing:
- ✅ Are you logged in as admin?
- ✅ Refresh the page (Ctrl+F5)
- ✅ Check browser console for errors

### If "Manage User Accounts" button doesn't work:
- ✅ Are you logged in as admin?
- ✅ Check browser console for errors
- ✅ Verify `UserStaffLinker` component exists

## Version Check Commands

In browser console, run:
```javascript
// Check if createUserForStaff method exists
console.log('createUserForStaff exists:', typeof window.supabaseAPI?.createUserForStaff === 'function')

// Check Staff component version
// Look for console log: "[Staff Page] User Management Integration v1.0 loaded"
```

## Files Modified
- ✅ `web/src/pages/Staff.jsx` - Added user creation UI
- ✅ `web/src/services/supabaseAPI.js` - Added `createUserForStaff()` method
- ✅ `web/src/components/UserStaffLinker.jsx` - Added create user form

