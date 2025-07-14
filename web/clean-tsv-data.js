// Clean TSV Data for Supabase Import
// Handles ######## values, date formatting, and data preparation

import fs from 'fs'

function cleanTSVData(inputFile, outputFile) {
  try {
    console.log(`🧹 Cleaning data from ${inputFile}...`)
    
    // Read the TSV file
    const content = fs.readFileSync(inputFile, 'utf8')
    const lines = content.split('\n')
    
    if (lines.length === 0) {
      throw new Error('Empty file')
    }
    
    // Get headers (first line)
    const headers = lines[0].split('\t')
    console.log(`📋 Original headers: ${headers.join(', ')}`)
    
    // Clean and process data rows
    const cleanedLines = []
    cleanedLines.push(headers.join('\t')) // Keep headers as-is
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines
      
      const values = line.split('\t')
      const cleanedValues = values.map((value, index) => {
        const header = headers[index]
        
        // Handle different column types
        switch (header) {
          case 'Date':
            // Convert "2022-01-20 0:00:00" to "2022-01-20"
            return cleanDate(value)
            
          case 'Sales Tax':
          case 'Net Sales':
            // Handle ######## values - set to 0 or null
            return cleanNumericValue(value)
            
          case 'Gross Sales':
            // Keep actual numeric values
            return cleanNumericValue(value)
            
          case 'Status':
            // Convert "CV" to "Confirmed" or keep as-is
            return cleanStatus(value)
            
          default:
            // For text fields, just clean whitespace and quotes
            return cleanTextValue(value)
        }
      })
      
      cleanedLines.push(cleanedValues.join('\t'))
    }
    
    // Write cleaned data
    const cleanedContent = cleanedLines.join('\n')
    fs.writeFileSync(outputFile, cleanedContent)
    
    console.log(`✅ Cleaned data saved to ${outputFile}`)
    console.log(`📊 Processed ${cleanedLines.length - 1} data rows`)
    
    return {
      success: true,
      inputRows: lines.length - 1,
      outputRows: cleanedLines.length - 1,
      headers: headers
    }
    
  } catch (error) {
    console.error(`❌ Error cleaning ${inputFile}:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

function cleanDate(dateString) {
  if (!dateString || dateString === '########') return ''
  
  // Handle "2022-01-20 0:00:00" format
  const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) {
    return match[1] // Return just the date part
  }
  
  // Handle other date formats
  const date = new Date(dateString)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }
  
  return dateString // Return as-is if can't parse
}

function cleanNumericValue(value) {
  if (!value || value === '########' || value.trim() === '') {
    return '0' // Set to 0 for missing/hidden values
  }
  
  // Remove currency symbols and commas
  const cleaned = value.replace(/[$,]/g, '').trim()
  
  // Check if it's a valid number
  const num = parseFloat(cleaned)
  if (!isNaN(num)) {
    return num.toString()
  }
  
  return '0' // Default to 0 if not a valid number
}

function cleanStatus(status) {
  if (!status) return 'Confirmed'
  
  // Map status values
  const statusMap = {
    'CV': 'Confirmed',
    'confirmed': 'Confirmed',
    'CONFIRMED': 'Confirmed',
    'pending': 'Pending',
    'closed': 'Closed',
    'cancelled': 'Cancelled'
  }
  
  return statusMap[status.toLowerCase()] || status
}

function cleanTextValue(value) {
  if (!value) return ''
  
  // Remove extra whitespace and quotes
  return value.trim().replace(/^["']|["']$/g, '')
}

// Process all TSV files
function processAllTSVFiles() {
  const files = [
    { input: 'trailer_history.tsv', output: 'trailer_history_cleaned.tsv' },
    { input: 'camper_history.tsv', output: 'camper_history_cleaned.tsv' }
  ]
  
  console.log('🚀 Starting TSV data cleaning process...\n')
  
  const results = []
  
  for (const file of files) {
    if (fs.existsSync(file.input)) {
      console.log(`📁 Processing ${file.input}...`)
      const result = cleanTSVData(file.input, file.output)
      results.push({ file: file.input, ...result })
      console.log('')
    } else {
      console.log(`⚠️  File not found: ${file.input}`)
    }
  }
  
  console.log('📋 Cleaning Summary:')
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.file}: ${result.outputRows} rows processed`)
    } else {
      console.log(`❌ ${result.file}: ${result.error}`)
    }
  })
  
  console.log('\n📤 Next Steps:')
  console.log('1. Import the cleaned TSV files to Supabase')
  console.log('2. Use the updated database schema (supabase-setup-updated.sql)')
  console.log('3. Map columns according to the new structure')
}

// Column mapping for the updated schema
function showColumnMapping() {
  console.log(`
📋 COLUMN MAPPING FOR UPDATED SCHEMA

Your TSV columns → Supabase columns:

Date → date
Status → status
Sales Tax → sales_tax
Net Sales → net_sales
Gross Sales → gross_sales
Common Venue Name → common_venue_name
Promo → promo
Promo To Send → promo_to_send
Address / City → address_city
Contact → contact
Phone → phone
Email → email
Times → times
Show Info → show_info
Forecast → forecast

IMPORT STEPS:

1. 🗄️ Run the updated SQL schema (supabase-setup-updated.sql)
2. 📁 Import your cleaned TSV files
3. 🎯 Map columns according to the list above
4. ✅ Verify data after import

NOTES:
- ######## values are converted to 0
- Dates are cleaned to YYYY-MM-DD format
- "CV" status is converted to "Confirmed"
- All text fields are cleaned of extra whitespace
  `)
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processAllTSVFiles()
} else {
  showColumnMapping()
}

export { cleanTSVData, processAllTSVFiles, showColumnMapping } 