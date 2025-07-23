#!/usr/bin/env node

/**
 * Camper Data Loader for Supabase
 * 
 * This script helps you load camper data from various sources into your Supabase database.
 * It supports loading from:
 * - TSV files (exported from Google Sheets)
 * - CSV files
 * - Direct data entry
 * - Sample data for testing
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

// Configuration
import { config } from 'dotenv'
config() // Load .env file

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase credentials not found!')
  console.log('\n📋 Please set up your environment variables:')
  console.log('1. Copy web/env.supabase.example to web/.env')
  console.log('2. Add your Supabase URL and anon key')
  console.log('3. Or set SUPABASE_URL and SUPABASE_ANON_KEY environment variables')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sample camper data for testing
const SAMPLE_CAMPER_DATA = [
  {
    date: '2024-01-15',
    status: 'Confirmed',
    sales_tax: 45.00,
    net_sales: 855.00,
    gross_sales: 900.00,
    venue_id: 'Sample Venue 1'
  },
  {
    date: '2024-01-20',
    status: 'Closed',
    sales_tax: 52.50,
    net_sales: 997.50,
    gross_sales: 1050.00,
    venue_id: 'Sample Venue 2'
  },
  {
    date: '2024-01-25',
    status: 'Pending',
    sales_tax: 60.00,
    net_sales: 1140.00,
    gross_sales: 1200.00,
    venue_id: 'Sample Venue 3'
  }
]

// Utility functions
function cleanValue(value) {
  if (!value || value.trim() === '') return null
  return value.trim().replace(/^["']|["']$/g, '') // Remove quotes
}

function parseNumber(value) {
  if (!value || value.trim() === '' || value.trim() === '########') {
    return null
  }
  const num = parseFloat(value.trim().replace(/[$,]/g, ''))
  return isNaN(num) ? null : num
}

function parseDate(value) {
  if (!value || value.trim() === '') return null
  const cleaned = value.trim().replace(/\s+0:00:00$/, '')
  return cleaned
}

// Data loading functions
async function loadFromTSV(filePath) {
  console.log(`📁 Loading camper data from TSV file: ${filePath}`)
  
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('File must have at least a header row and one data row')
    }
    
    const headers = lines[0].split('\t').map(h => h.trim())
    const data = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      const row = {}
      
      headers.forEach((header, index) => {
        const value = values[index] || ''
        
        switch (header.toLowerCase()) {
          case 'date':
            row.date = parseDate(value)
            break
          case 'status':
            row.status = cleanValue(value) || 'Confirmed'
            break
          case 'sales tax':
          case 'sales_tax':
            row.sales_tax = parseNumber(value)
            break
          case 'net sales':
          case 'net_sales':
            row.net_sales = parseNumber(value)
            break
          case 'gross sales':
          case 'gross_sales':
            row.gross_sales = parseNumber(value)
            break
          case 'venue id':
          case 'venue_id':
          case 'venue':
            row.venue_id = cleanValue(value)
            break
          default:
            // Store unknown columns as additional data
            row[header.toLowerCase().replace(/\s+/g, '_')] = cleanValue(value)
        }
      })
      
      if (row.date) { // Only add rows with a date
        data.push(row)
      }
    }
    
    console.log(`✅ Parsed ${data.length} camper records from TSV file`)
    return data
    
  } catch (error) {
    console.error(`❌ Error reading TSV file: ${error.message}`)
    return null
  }
}

async function loadFromCSV(filePath) {
  console.log(`📁 Loading camper data from CSV file: ${filePath}`)
  
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('File must have at least a header row and one data row')
    }
    
    const headers = lines[0].split(',').map(h => h.trim())
    const data = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row = {}
      
      headers.forEach((header, index) => {
        const value = values[index] || ''
        
        switch (header.toLowerCase()) {
          case 'date':
            row.date = parseDate(value)
            break
          case 'status':
            row.status = cleanValue(value) || 'Confirmed'
            break
          case 'sales tax':
          case 'sales_tax':
            row.sales_tax = parseNumber(value)
            break
          case 'net sales':
          case 'net_sales':
            row.net_sales = parseNumber(value)
            break
          case 'gross sales':
          case 'gross_sales':
            row.gross_sales = parseNumber(value)
            break
          case 'venue id':
          case 'venue_id':
          case 'venue':
            row.venue_id = cleanValue(value)
            break
          default:
            row[header.toLowerCase().replace(/\s+/g, '_')] = cleanValue(value)
        }
      })
      
      if (row.date) {
        data.push(row)
      }
    }
    
    console.log(`✅ Parsed ${data.length} camper records from CSV file`)
    return data
    
  } catch (error) {
    console.error(`❌ Error reading CSV file: ${error.message}`)
    return null
  }
}

async function loadSampleData() {
  console.log('📊 Loading sample camper data for testing...')
  return SAMPLE_CAMPER_DATA
}

async function insertCamperData(data) {
  console.log(`🚀 Inserting ${data.length} camper records into Supabase...`)
  
  try {
    // Clear existing data first (optional)
    const { error: deleteError } = await supabase
      .from('camper_history')
      .delete()
      .neq('id', 0) // Delete all records
    
    if (deleteError) {
      console.warn(`⚠️ Warning: Could not clear existing data: ${deleteError.message}`)
    } else {
      console.log('🗑️ Cleared existing camper data')
    }
    
    // Insert new data in batches
    const batchSize = 100
    let insertedCount = 0
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      const { data: insertedData, error } = await supabase
        .from('camper_history')
        .insert(batch)
        .select()
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        return false
      }
      
      insertedCount += insertedData.length
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${insertedData.length} records`)
    }
    
    console.log(`🎉 Successfully inserted ${insertedCount} camper records!`)
    return true
    
  } catch (error) {
    console.error(`❌ Error inserting camper data: ${error.message}`)
    return false
  }
}

async function verifyData() {
  console.log('🔍 Verifying camper data in database...')
  
  try {
    const { data, error, count } = await supabase
      .from('camper_history')
      .select('*', { count: 'exact' })
    
    if (error) {
      console.error(`❌ Error verifying data: ${error.message}`)
      return false
    }
    
    console.log(`✅ Found ${count} camper records in database`)
    
    if (data && data.length > 0) {
      console.log('\n📋 Sample records:')
      data.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.date} - ${record.venue_id} - $${record.gross_sales}`)
      })
    }
    
    return true
    
  } catch (error) {
    console.error(`❌ Error verifying data: ${error.message}`)
    return false
  }
}

// Interactive CLI
async function showMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve))
  
  console.log('\n🏕️ Camper Data Loader for Supabase')
  console.log('=====================================\n')
  
  console.log('Choose an option:')
  console.log('1. Load from TSV file (Google Sheets export)')
  console.log('2. Load from CSV file')
  console.log('3. Load sample data (for testing)')
  console.log('4. Verify existing data')
  console.log('5. Exit')
  
  const choice = await question('\nEnter your choice (1-5): ')
  
  switch (choice.trim()) {
    case '1':
      const tsvPath = await question('Enter the path to your TSV file: ')
      const tsvData = await loadFromTSV(tsvPath.trim())
      if (tsvData) {
        const success = await insertCamperData(tsvData)
        if (success) {
          await verifyData()
        }
      }
      break
      
    case '2':
      const csvPath = await question('Enter the path to your CSV file: ')
      const csvData = await loadFromCSV(csvPath.trim())
      if (csvData) {
        const success = await insertCamperData(csvData)
        if (success) {
          await verifyData()
        }
      }
      break
      
    case '3':
      const sampleData = await loadSampleData()
      const success = await insertCamperData(sampleData)
      if (success) {
        await verifyData()
      }
      break
      
    case '4':
      await verifyData()
      break
      
    case '5':
      console.log('👋 Goodbye!')
      rl.close()
      return
      
    default:
      console.log('❌ Invalid choice. Please try again.')
  }
  
  rl.close()
}

// Auto-detect and load TSV files
async function autoLoadTSV() {
  console.log('🔍 Auto-detecting TSV files...')
  
  const possiblePaths = [
    './camper_history.tsv',
    './camper-history.tsv',
    './Camper_History.tsv',
    './downloads/camper_history.tsv',
    './Downloads/camper_history.tsv',
    '../camper_history.tsv',
    '../camper-history.tsv'
  ]
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`📁 Found TSV file: ${filePath}`)
      const data = await loadFromTSV(filePath)
      if (data) {
        const success = await insertCamperData(data)
        if (success) {
          await verifyData()
          return true
        }
      }
    }
  }
  
  console.log('❌ No TSV files found. Please run the interactive menu.')
  return false
}

// Main execution
async function main() {
  console.log('🚀 Camper Data Loader Starting...')
  
  try {
    // Test Supabase connection
    console.log('📡 Testing Supabase connection...')
    const { data, error } = await supabase
      .from('camper_history')
      .select('count')
      .limit(1)
    
    if (error) {
      throw new Error(`Connection failed: ${error.message}`)
    }
    
    console.log('✅ Supabase connection successful!')
    
    // Check if TSV file exists in current directory
    const hasTSV = await autoLoadTSV()
    
    if (!hasTSV) {
      await showMenu()
    }
    
  } catch (error) {
    console.error('❌ Failed to start:', error.message)
    console.log('\n📋 Troubleshooting:')
    console.log('1. Check your Supabase credentials in .env file')
    console.log('2. Ensure your Supabase project has the camper_history table')
    console.log('3. Verify your internet connection')
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { loadFromTSV, loadFromCSV, insertCamperData, verifyData } 