# 🏕️ Camper Data Loading Guide

This guide will help you load your camper data into Supabase for the Scrub Shop Road App.

## 📋 Prerequisites

1. **Supabase Project Setup**
   - You need a Supabase project with the `camper_history` table
   - The table should match the structure defined in `DATABASE_STRUCTURE.md`

2. **Environment Configuration**
   - Copy `env.supabase.example` to `.env`
   - Add your Supabase URL and anon key

3. **Data Source**
   - Your camper data in TSV, CSV, or Google Sheets format

## 🚀 Quick Start

### Option 1: Automated Script (Recommended)

1. **Navigate to the web directory:**
   ```bash
   cd web
   ```

2. **Set up environment variables:**
   ```bash
   cp env.supabase.example .env
   # Edit .env and add your Supabase credentials
   ```

3. **Run the camper data loader:**
   ```bash
   node load-camper-data.js
   ```

4. **Follow the interactive menu:**
   - Choose option 1 for TSV files (Google Sheets export)
   - Choose option 2 for CSV files
   - Choose option 3 for sample data (testing)

### Option 2: Manual Import

1. **Export from Google Sheets:**
   - Open your Camper_History sheet
   - File → Download → Tab-separated values (.tsv)
   - Save as `camper_history.tsv`

2. **Use the existing import script:**
   ```bash
   node find-and-import-tsv.cjs
   ```

3. **Copy the generated SQL:**
   - The script creates `supabase-import-from-files.sql`
   - Copy the contents to your Supabase SQL Editor

## 📊 Data Format Requirements

### Expected Column Headers

Your camper data should have these columns (case-insensitive):

| Column Name | Description | Required | Data Type |
|-------------|-------------|----------|-----------|
| Date | Sale date | Yes | Date (YYYY-MM-DD) |
| Status | Sale status | No | Text (default: 'Confirmed') |
| Sales Tax | Tax amount | No | Number |
| Net Sales | Net sales amount | No | Number |
| Gross Sales | Gross sales amount | No | Number |
| Venue ID | Venue identifier | No | Text |

### Sample Data Format

```tsv
Date	Status	Sales Tax	Net Sales	Gross Sales	Venue ID
2024-01-15	Confirmed	45.00	855.00	900.00	Venue 1
2024-01-20	Closed	52.50	997.50	1050.00	Venue 2
2024-01-25	Pending	60.00	1140.00	1200.00	Venue 3
```

## 🔧 Troubleshooting

### Common Issues

1. **"Supabase credentials not found"**
   - Check that your `.env` file exists and has the correct credentials
   - Verify the environment variable names match exactly

2. **"Connection failed"**
   - Verify your Supabase URL and anon key are correct
   - Check that your Supabase project is active
   - Ensure you have internet connectivity

3. **"Table camper_history does not exist"**
   - Run the database setup script: `supabase-setup.sql`
   - Or create the table manually using the structure from `DATABASE_STRUCTURE.md`

4. **"Error reading TSV file"**
   - Check that the file path is correct
   - Verify the file has the expected format with headers
   - Ensure the file is not corrupted

5. **"Error inserting data"**
   - Check that the data types match the table schema
   - Verify that required fields are not null
   - Check for duplicate records if using unique constraints

### Data Validation

The script automatically:
- Cleans and validates dates
- Converts numbers (removes currency symbols, commas)
- Handles empty values
- Maps column names (case-insensitive)
- Skips rows without dates

## 📁 File Locations

The script looks for TSV files in these locations:
- `./camper_history.tsv`
- `./camper-history.tsv`
- `./Camper_History.tsv`
- `./downloads/camper_history.tsv`
- `./Downloads/camper_history.tsv`
- `../camper_history.tsv`
- `../camper-history.tsv`

## 🔄 Updating Existing Data

The script will:
1. Clear existing camper data (optional)
2. Insert new data in batches of 100 records
3. Verify the insertion was successful
4. Show sample records for confirmation

## 📈 Verification

After loading data, you can verify it by:

1. **Using the script:**
   ```bash
   node load-camper-data.js
   # Choose option 4: Verify existing data
   ```

2. **Checking in Supabase Dashboard:**
   - Go to your Supabase project
   - Navigate to Table Editor
   - Select the `camper_history` table
   - View the imported records

3. **Testing in the app:**
   - Start the web app: `npm run dev`
   - Navigate to Daily Sales
   - Switch to "Camper" view
   - Verify your data appears

## 🛠️ Advanced Usage

### Custom Data Transformation

If you need custom data transformation, you can modify the script:

```javascript
// In load-camper-data.js, modify the parseNumber function:
function parseNumber(value) {
  // Add your custom logic here
  if (!value || value.trim() === '') return null
  const num = parseFloat(value.trim().replace(/[$,]/g, ''))
  return isNaN(num) ? null : num
}
```

### Batch Processing

For large datasets, the script processes data in batches of 100 records. You can adjust this:

```javascript
// In the insertCamperData function:
const batchSize = 50 // Change from 100 to your preferred size
```

### Error Handling

The script includes comprehensive error handling:
- Connection testing
- File validation
- Data type checking
- Batch processing with rollback
- Detailed error messages

## 📞 Support

If you encounter issues:

1. **Check the logs** - The script provides detailed output
2. **Verify your data** - Ensure your TSV/CSV file matches the expected format
3. **Test with sample data** - Use option 3 to test with sample data first
4. **Check Supabase** - Verify your project and table structure

## 🎯 Next Steps

After successfully loading camper data:

1. **Test the application** - Verify data appears correctly
2. **Load other data** - Consider loading trailer and venue data
3. **Set up regular imports** - Consider automating the import process
4. **Backup your data** - Ensure your data is safely stored

## 📚 Related Files

- `load-camper-data.js` - Main loading script
- `DATABASE_STRUCTURE.md` - Database schema reference
- `find-and-import-tsv.cjs` - Alternative import script
- `supabase-setup.sql` - Database setup script
- `env.supabase.example` - Environment configuration template 