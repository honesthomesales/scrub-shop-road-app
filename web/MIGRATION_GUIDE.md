# 🚀 Migration Guide: Google Sheets → Supabase

This guide will walk you through migrating your Scrub Shop Road App from Google Sheets to Supabase.

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js**: Ensure you have Node.js installed
3. **Your Google Sheets Data**: Have access to your current Google Sheets

## 🗄️ Step 1: Create Supabase Project

1. **Sign up/Login** to Supabase
2. **Create New Project**:
   - Click "New Project"
   - Choose your organization
   - Enter project name: `scrub-shop-road-app`
   - Enter database password (save this!)
   - Choose region closest to you
   - Click "Create new project"

3. **Wait for Setup** (2-3 minutes)

## 🏗️ Step 2: Set Up Database Schema

1. **Open SQL Editor** in your Supabase dashboard
2. **Copy and paste** the contents of `supabase-setup.sql`
3. **Run the script** to create all tables and sample data
4. **Verify tables** were created in the Table Editor

## 📊 Step 3: Export Data from Google Sheets

### Option A: Manual Export (Recommended)
1. **Open each Google Sheet**:
   - `Trailer_History`
   - `Camper_History` 
   - `Venues`
   - `Staff`

2. **Export as CSV**:
   - File → Download → CSV
   - Save each file with descriptive names

### Option B: Google Sheets API Export
If you have programming experience, you can use the Google Sheets API to export data programmatically.

## 📥 Step 4: Import Data to Supabase

### For Each Table:

1. **Go to Table Editor** in Supabase dashboard
2. **Select the table** (e.g., `trailer_history`)
3. **Click "Import data"**
4. **Upload the corresponding CSV file**
5. **Map columns** correctly:

#### Trailer_History & Camper_History Mapping:
```
Google Sheets → Supabase
Date → date
Status → status  
Sales Tax → sales_tax
Net Sales → net_sales
Gross Sales → gross_sales
Venue ID → venue_id
```

#### Venues Mapping:
```
Google Sheets → Supabase
Promo → promo
Promo to Send → promo_to_send
Address City → address_city
Contact → contact
Phone → phone
Email → email
Times → times
Show Info → show_info
Forecast Will → forecast_will
```

#### Staff Mapping:
```
Google Sheets → Supabase
Name → name
Email → email
Phone → phone
Role → role
Status → status
Hire Date → hire_date
Notes → notes
```

6. **Click "Import"** and verify the data

## ⚙️ Step 5: Configure Environment Variables

1. **Get Supabase Credentials**:
   - Go to Settings → API in your Supabase dashboard
   - Copy the "Project URL" and "anon public" key

2. **Update your `.env` file**:
```env
# Remove Google Sheets variables
# VITE_GOOGLE_SHEETS_API_KEY=
# VITE_GOOGLE_SHEETS_CLIENT_ID=
# VITE_GOOGLE_SHEETS_CLIENT_SECRET=
# VITE_SPREADSHEET_ID=

# Add Supabase variables
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🔄 Step 6: Update Application Code

### Install Supabase Client:
```bash
cd web
npm install @supabase/supabase-js
```

### Replace Google Sheets API with Supabase:

1. **Update AppContext.jsx**:
   - Replace `import googleSheetsAPI` with `import supabaseAPI`
   - Update all API calls to use the new service

2. **Update API calls**:
   - `googleSheetsAPI.readSheet()` → `supabaseAPI.readTable()`
   - `googleSheetsAPI.addRow()` → `supabaseAPI.addRow()`
   - `googleSheetsAPI.updateRow()` → `supabaseAPI.updateRow()`
   - `googleSheetsAPI.deleteRow()` → `supabaseAPI.deleteRow()`

## 🧪 Step 7: Test the Application

1. **Start the development server**:
```bash
npm run dev
```

2. **Test each feature**:
   - ✅ Dashboard loads with real data
   - ✅ Daily Sales shows correct information
   - ✅ Calendar displays events
   - ✅ Venues management works
   - ✅ Staff management works

3. **Verify data integrity**:
   - Check that all records are present
   - Verify calculations are correct
   - Test adding/editing/deleting records

## 🔧 Step 8: Update Data Transformation

The new Supabase API uses different data structures. Update your transformation functions:

### Before (Google Sheets):
```javascript
// Column letters as keys
{
  A: '2024-01-15',
  B: 'Confirmed',
  C: 45.00,
  // ...
}
```

### After (Supabase):
```javascript
// Field names as keys
{
  date: '2024-01-15',
  status: 'Confirmed',
  sales_tax: 45.00,
  // ...
}
```

## 🎯 Benefits of Supabase Migration

### ✅ **Performance**
- Faster queries and real-time updates
- Better indexing and optimization
- Reduced API rate limits

### ✅ **Features**
- Real-time subscriptions
- Built-in authentication
- Row Level Security
- Database backups

### ✅ **Scalability**
- Automatic scaling
- Better data relationships
- Advanced querying capabilities

### ✅ **Development**
- Better debugging tools
- SQL interface
- Built-in API documentation

## 🚨 Troubleshooting

### Common Issues:

1. **"Table doesn't exist"**
   - Run the SQL setup script again
   - Check table names match exactly

2. **"Permission denied"**
   - Verify RLS policies are set correctly
   - Check your API key permissions

3. **"Data not loading"**
   - Check environment variables
   - Verify Supabase connection
   - Check browser console for errors

4. **"Import failed"**
   - Check CSV format
   - Verify column mapping
   - Check data types match

## 📞 Support

If you encounter issues:

1. **Check Supabase logs** in the dashboard
2. **Review browser console** for errors
3. **Verify environment variables** are set correctly
4. **Test with sample data** first

## 🎉 Migration Complete!

Once all steps are completed, your app will be running on Supabase with:
- ✅ Better performance
- ✅ Real-time capabilities  
- ✅ More reliable data storage
- ✅ Enhanced security features

Your Scrub Shop Road App is now powered by Supabase! 🚀 