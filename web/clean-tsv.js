// Clean TSV file by replacing empty cells with zeros
import fs from 'fs'

function cleanTSV(inputFile, outputFile) {
  try {
    console.log(`🧹 Cleaning TSV file: ${inputFile}`)
    
    // Read the TSV file
    const content = fs.readFileSync(inputFile, 'utf8')
    const lines = content.split('\n')
    
    // Process each line
    const cleanedLines = lines.map((line, index) => {
      if (index === 0) {
        // Keep header line as is
        return line
      }
      
      if (!line.trim()) {
        // Skip empty lines
        return line
      }
      
      // Split by tab
      const columns = line.split('\t')
      
      // Clean numeric columns (Sales Tax and Net Sales)
      // Assuming columns 2 and 3 are Sales Tax and Net Sales (0-indexed)
      if (columns.length >= 4) {
        // Sales Tax (column 2) - replace empty with 0
        if (!columns[2] || columns[2].trim() === '' || columns[2] === '########') {
          columns[2] = '0'
        }
        
        // Net Sales (column 3) - replace empty with 0
        if (!columns[3] || columns[3].trim() === '' || columns[3] === '########') {
          columns[3] = '0'
        }
      }
      
      return columns.join('\t')
    })
    
    // Write cleaned content
    const cleanedContent = cleanedLines.join('\n')
    fs.writeFileSync(outputFile, cleanedContent)
    
    console.log(`✅ Cleaned TSV saved to: ${outputFile}`)
    console.log(`📊 Processed ${lines.length} lines`)
    
  } catch (error) {
    console.error('❌ Error cleaning TSV:', error.message)
  }
}

// Manual cleaning instructions
function showManualCleaningInstructions() {
  console.log(`
🧹 MANUAL TSV CLEANING INSTRUCTIONS

Your TSV has empty cells that need to be filled with zeros:

1. 📝 OPEN IN TEXT EDITOR:
   - Open your TSV file in Notepad++, VS Code, or any text editor
   - Look for patterns like: Date\\tStatus\\t\\tGross Sales\\tVenue ID

2. 🔍 FIND AND REPLACE:
   - Find: \\t\\t (two tabs with nothing between)
   - Replace with: \\t0\\t
   - Find: \\t\\n (tab followed by newline)
   - Replace with: \\t0\\n

3. 📊 OR USE EXCEL/GOOGLE SHEETS:
   - Open TSV in Excel or Google Sheets
   - Select Sales Tax column
   - Find empty cells and fill with 0
   - Select Net Sales column
   - Find empty cells and fill with 0
   - Save as TSV again

4. ✅ EXPECTED RESULT:
   Before: 2022-01-20 0:00:00\\tCV\\t\\t\\t19760\\tPrisma Health Baptist Hospital
   After:  2022-01-20 0:00:00\\tCV\\t0\\t0\\t19760\\tPrisma Health Baptist Hospital

5. 📤 IMPORT TO SUPABASE:
   - Use the cleaned TSV file
   - Map columns as before
   - Should import without errors

COLUMN MAPPING:
Date → date
Status → status  
Sales Tax → sales_tax
Net Sales → net_sales
Gross Sales → gross_sales
Venue ID → venue_id
  `)
}

// Run cleaning if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const inputFile = process.argv[2] || 'trailer_history.tsv'
  const outputFile = process.argv[3] || 'trailer_history_cleaned.tsv'
  cleanTSV(inputFile, outputFile)
} else {
  showManualCleaningInstructions()
}

export { cleanTSV, showManualCleaningInstructions } 