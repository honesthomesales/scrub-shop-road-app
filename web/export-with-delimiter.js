// Export Google Sheets Data with Custom Delimiters
// Handles data with commas by using alternative delimiters

import fs from 'fs'
import { google } from 'googleapis'

// Configuration
const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID
const API_KEY = process.env.VITE_GOOGLE_SHEETS_API_KEY

// Choose your delimiter (recommended: tab or pipe)
const DELIMITER = '\t' // Options: '\t' (tab), '|' (pipe), ';' (semicolon)
const DELIMITER_NAME = 'tab' // For file naming

// Sheets to export
const SHEETS_TO_EXPORT = [
  { name: 'Trailer_History', filename: `trailer_history.${DELIMITER_NAME}.csv` },
  { name: 'Camper_History', filename: `camper_history.${DELIMITER_NAME}.csv` },
  { name: 'Venues', filename: `venues.${DELIMITER_NAME}.csv` },
  { name: 'Staff', filename: `staff.${DELIMITER_NAME}.csv` }
]

async function exportWithCustomDelimiter() {
  try {
    console.log(`🚀 Starting Google Sheets export with ${DELIMITER_NAME} delimiter...`)
    
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
      console.log(`📋 Headers: ${headers.join(' | ')}`)

      // Get data rows (skip header)
      const dataRows = rows.slice(1)
      console.log(`📈 Found ${dataRows.length} data rows`)

      // Convert to custom delimiter format
      const delimiterContent = convertToDelimiterFormat(dataRows, headers, DELIMITER)
      
      // Write to file
      fs.writeFileSync(sheetConfig.filename, delimiterContent)
      console.log(`✅ Exported to ${sheetConfig.filename}`)
    }

    console.log('\n🎉 Export completed successfully!')
    console.log(`\n📁 Generated files with ${DELIMITER_NAME} delimiter:`)
    SHEETS_TO_EXPORT.forEach(sheet => {
      console.log(`   - ${sheet.filename}`)
    })
    
    console.log('\n📋 Import Instructions:')
    console.log('1. Go to Supabase Table Editor')
    console.log('2. Click "Import data" for each table')
    console.log('3. Upload the corresponding file')
    console.log('4. Supabase will auto-detect the delimiter')
    console.log('5. Map columns according to the guide')

  } catch (error) {
    console.error('❌ Export failed:', error.message)
    process.exit(1)
  }
}

function convertToDelimiterFormat(rows, headers, delimiter) {
  // Create header row
  const headerRow = headers.map(header => `"${escapeField(header)}"`).join(delimiter)
  let content = headerRow + '\n'

  // Add data rows
  for (const row of rows) {
    // Ensure row has same length as headers
    const paddedRow = [...row]
    while (paddedRow.length < headers.length) {
      paddedRow.push('')
    }

    // Escape and format values
    const formattedRow = paddedRow.map(value => {
      if (value === null || value === undefined) {
        return '""'
      }
      return `"${escapeField(String(value))}"`
    }).join(delimiter)

    content += formattedRow + '\n'
  }

  return content
}

function escapeField(value) {
  // Escape quotes and handle special characters
  return value.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' ')
}

// Manual export instructions for different delimiters
function showDelimiterOptions() {
  console.log(`
📋 DELIMITER OPTIONS FOR COMMA-CONTAINING DATA

Your data has commas, so you need to use a different delimiter:

1. 🎯 TAB-DELIMITED (RECOMMENDED):
   - File → Download → Tab-separated values (.tsv)
   - Supabase handles TSV files perfectly
   - No special characters to worry about

2. 🔧 PIPE-DELIMITED:
   - File → Download → CSV (.csv)
   - Open in text editor
   - Replace all commas with pipes (|)
   - Save as .txt or .csv

3. 🔧 SEMICOLON-DELIMITED:
   - File → Download → CSV (.csv)
   - Open in text editor
   - Replace all commas with semicolons (;)
   - Save as .txt or .csv

4. 🔧 CUSTOM DELIMITER:
   - Use any character that doesn't appear in your data
   - Common options: | (pipe), ; (semicolon), ~ (tilde)

IMPORT STEPS FOR ANY DELIMITER:

1. 📥 Export from Google Sheets with your chosen delimiter
2. 📤 Go to Supabase Table Editor
3. 🔄 Click "Import data" for each table
4. 📁 Upload your delimiter-separated file
5. 🎯 Supabase will auto-detect the delimiter
6. 📋 Map columns according to the database structure
7. ✅ Click "Import" and verify data

COLUMN MAPPING (same for all delimiters):

Trailer_History & Camper_History:
- Date → date
- Status → status
- Sales Tax → sales_tax
- Net Sales → net_sales
- Gross Sales → gross_sales
- Venue ID → venue_id

Venues:
- Promo → promo
- Promo to Send → promo_to_send
- Address City → address_city
- Contact → contact
- Phone → phone
- Email → email
- Times → times
- Show Info → show_info
- Forecast Will → forecast_will

Staff:
- Name → name
- Email → email
- Phone → phone
- Role → role
- Status → status
- Hire Date → hire_date
- Notes → notes

TROUBLESHOOTING:

❌ "Import failed" - Check delimiter detection
❌ "Column mismatch" - Verify column mapping
❌ "Data type error" - Check date formats and numbers
✅ Success - Verify row count matches your data
  `)
}

// Run export if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportWithCustomDelimiter()
} else {
  showDelimiterOptions()
}

export { exportWithCustomDelimiter, showDelimiterOptions } 