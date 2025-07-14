// Export Data from Google Sheets to CSV
// Run this script to export your Google Sheets data for Supabase migration

import fs from 'fs'
import { google } from 'googleapis'

// Configuration
const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID
const API_KEY = process.env.VITE_GOOGLE_SHEETS_API_KEY

// Sheets to export
const SHEETS_TO_EXPORT = [
  { name: 'Trailer_History', filename: 'trailer_history.csv' },
  { name: 'Camper_History', filename: 'camper_history.csv' },
  { name: 'Venues', filename: 'venues.csv' },
  { name: 'Staff', filename: 'staff.csv' }
]

// Column mappings for each sheet
const COLUMN_MAPPINGS = {
  Trailer_History: [
    { sheet: 'A', db: 'date' },
    { sheet: 'B', db: 'status' },
    { sheet: 'C', db: 'sales_tax' },
    { sheet: 'D', db: 'net_sales' },
    { sheet: 'E', db: 'gross_sales' },
    { sheet: 'F', db: 'venue_id' }
  ],
  Camper_History: [
    { sheet: 'A', db: 'date' },
    { sheet: 'B', db: 'status' },
    { sheet: 'C', db: 'sales_tax' },
    { sheet: 'D', db: 'net_sales' },
    { sheet: 'E', db: 'gross_sales' },
    { sheet: 'F', db: 'venue_id' }
  ],
  Venues: [
    { sheet: 'A', db: 'promo' },
    { sheet: 'B', db: 'promo_to_send' },
    { sheet: 'C', db: 'address_city' },
    { sheet: 'D', db: 'contact' },
    { sheet: 'E', db: 'phone' },
    { sheet: 'F', db: 'email' },
    { sheet: 'G', db: 'times' },
    { sheet: 'H', db: 'show_info' },
    { sheet: 'I', db: 'forecast_will' }
  ],
  Staff: [
    { sheet: 'A', db: 'name' },
    { sheet: 'B', db: 'email' },
    { sheet: 'C', db: 'phone' },
    { sheet: 'D', db: 'role' },
    { sheet: 'E', db: 'status' },
    { sheet: 'F', db: 'hire_date' },
    { sheet: 'G', db: 'notes' }
  ]
}

async function exportSheetData() {
  try {
    console.log('🚀 Starting Google Sheets export...')
    
    if (!SPREADSHEET_ID || !API_KEY) {
      throw new Error('Missing environment variables: VITE_SPREADSHEET_ID and VITE_GOOGLE_SHEETS_API_KEY')
    }

    const sheets = google.sheets({ version: 'v4', auth: API_KEY })

    for (const sheetConfig of SHEETS_TO_EXPORT) {
      console.log(`\n📊 Exporting ${sheetConfig.name}...`)
      
      // Get the sheet data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetConfig.name}!A:Z`
      })

      const rows = response.data.values
      
      if (!rows || rows.length === 0) {
        console.log(`⚠️  No data found in ${sheetConfig.name}`)
        continue
      }

      // Get headers (first row)
      const headers = rows[0]
      console.log(`📋 Headers: ${headers.join(', ')}`)

      // Get data rows (skip header)
      const dataRows = rows.slice(1)
      console.log(`📈 Found ${dataRows.length} data rows`)

      // Convert to CSV format
      const csvContent = convertToCSV(dataRows, headers, sheetConfig.name)
      
      // Write to file
      fs.writeFileSync(sheetConfig.filename, csvContent)
      console.log(`✅ Exported to ${sheetConfig.filename}`)
    }

    console.log('\n🎉 Export completed successfully!')
    console.log('\n📁 Generated files:')
    SHEETS_TO_EXPORT.forEach(sheet => {
      console.log(`   - ${sheet.filename}`)
    })
    
    console.log('\n📋 Next steps:')
    console.log('1. Import these CSV files into Supabase')
    console.log('2. Follow the column mapping guide in MIGRATION_GUIDE.md')
    console.log('3. Verify data integrity after import')

  } catch (error) {
    console.error('❌ Export failed:', error.message)
    process.exit(1)
  }
}

function convertToCSV(rows, headers, sheetName) {
  // Create CSV header row
  const csvHeaders = headers.map(header => `"${header}"`).join(',')
  let csvContent = csvHeaders + '\n'

  // Add data rows
  for (const row of rows) {
    // Ensure row has same length as headers
    const paddedRow = [...row]
    while (paddedRow.length < headers.length) {
      paddedRow.push('')
    }

    // Escape and quote values
    const csvRow = paddedRow.map(value => {
      if (value === null || value === undefined) {
        return '""'
      }
      const stringValue = String(value)
      // Escape quotes and wrap in quotes
      return `"${stringValue.replace(/"/g, '""')}"`
    }).join(',')

    csvContent += csvRow + '\n'
  }

  return csvContent
}

// Manual export instructions
function showManualExportInstructions() {
  console.log(`
📋 MANUAL EXPORT INSTRUCTIONS

If the automated export doesn't work, follow these steps:

1. 📊 OPEN EACH GOOGLE SHEET:
   - Trailer_History
   - Camper_History
   - Venues
   - Staff

2. 📥 EXPORT AS CSV:
   - File → Download → CSV (.csv)
   - Save with descriptive names:
     * trailer_history.csv
     * camper_history.csv
     * venues.csv
     * staff.csv

3. 📁 SAVE FILES:
   - Save all CSV files in your project directory
   - Keep the original column headers

4. 🔍 VERIFY DATA:
   - Open each CSV file in a text editor
   - Check that data looks correct
   - Ensure no special characters are corrupted

5. 📤 IMPORT TO SUPABASE:
   - Follow the import instructions in MIGRATION_GUIDE.md
   - Map columns according to the database structure

COLUMN MAPPING REFERENCE:

Trailer_History & Camper_History:
- Column A (Date) → date
- Column B (Status) → status
- Column C (Sales Tax) → sales_tax
- Column D (Net Sales) → net_sales
- Column E (Gross Sales) → gross_sales
- Column F (Venue ID) → venue_id

Venues:
- Column A (Promo) → promo
- Column B (Promo to Send) → promo_to_send
- Column C (Address City) → address_city
- Column D (Contact) → contact
- Column E (Phone) → phone
- Column F (Email) → email
- Column G (Times) → times
- Column H (Show Info) → show_info
- Column I (Forecast Will) → forecast_will

Staff:
- Column A (Name) → name
- Column B (Email) → email
- Column C (Phone) → phone
- Column D (Role) → role
- Column E (Status) → status
- Column F (Hire Date) → hire_date
- Column G (Notes) → notes
  `)
}

// Run export if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportSheetData()
} else {
  showManualExportInstructions()
}

export { exportSheetData, showManualExportInstructions } 