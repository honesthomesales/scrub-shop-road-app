// Migration Script: Google Sheets to Supabase
// Run this script to migrate your existing data

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sample data structure (replace with your actual Google Sheets data)
const SAMPLE_DATA = {
  venues: [
    {
      promo: 'Summer Festival',
      promo_to_send: 'Yes',
      address_city: '123 Main St, City A',
      contact: 'John Smith',
      phone: '555-123-4567',
      email: 'john@venue.com',
      times: '9 AM - 5 PM',
      show_info: 'Outdoor event',
      forecast_will: 'High'
    },
    {
      promo: 'Winter Market',
      promo_to_send: 'No',
      address_city: '456 Oak Ave, City B',
      contact: 'Jane Doe',
      phone: '555-987-6543',
      email: 'jane@venue.com',
      times: '10 AM - 6 PM',
      show_info: 'Indoor market',
      forecast_will: 'Medium'
    }
  ],
  staff: [
    {
      name: 'John Smith',
      email: 'john@scrubshop.com',
      phone: '555-123-4567',
      role: 'Worker',
      status: 'Active',
      hire_date: '2024-01-01',
      notes: 'Experienced team member'
    },
    {
      name: 'Jane Doe',
      email: 'jane@scrubshop.com',
      phone: '555-987-6543',
      role: 'Worker',
      status: 'Active',
      hire_date: '2024-01-15',
      notes: 'New hire'
    },
    {
      name: 'Mike Johnson',
      email: 'mike@scrubshop.com',
      phone: '555-456-7890',
      role: 'Manager',
      status: 'Active',
      hire_date: '2023-12-01',
      notes: 'Team lead'
    }
  ],
  trailer_history: [
    {
      date: '2024-01-15',
      status: 'Confirmed',
      sales_tax: 45.00,
      net_sales: 855.00,
      gross_sales: 900.00,
      venue_id: 'Venue 1'
    },
    {
      date: '2024-01-20',
      status: 'Closed',
      sales_tax: 52.50,
      net_sales: 997.50,
      gross_sales: 1050.00,
      venue_id: 'Venue 2'
    }
  ],
  camper_history: [
    {
      date: '2024-01-10',
      status: 'Confirmed',
      sales_tax: 38.00,
      net_sales: 722.00,
      gross_sales: 760.00,
      venue_id: 'Venue 3'
    },
    {
      date: '2024-01-25',
      status: 'Pending',
      sales_tax: 60.00,
      net_sales: 1140.00,
      gross_sales: 1200.00,
      venue_id: 'Venue 1'
    }
  ]
}

async function migrateData() {
  console.log('🚀 Starting migration from Google Sheets to Supabase...')
  
  try {
    // Test connection
    console.log('📡 Testing Supabase connection...')
    const { data, error } = await supabase.from('venues').select('count').limit(1)
    
    if (error) {
      throw new Error(`Connection failed: ${error.message}`)
    }
    
    console.log('✅ Supabase connection successful!')
    
    // Migrate venues
    console.log('\n📊 Migrating venues...')
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .insert(SAMPLE_DATA.venues)
      .select()
    
    if (venuesError) {
      console.error('❌ Venues migration failed:', venuesError.message)
    } else {
      console.log(`✅ Migrated ${venues.length} venues`)
    }
    
    // Migrate staff
    console.log('\n👥 Migrating staff...')
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert(SAMPLE_DATA.staff)
      .select()
    
    if (staffError) {
      console.error('❌ Staff migration failed:', staffError.message)
    } else {
      console.log(`✅ Migrated ${staff.length} staff members`)
    }
    
    // Migrate trailer history
    console.log('\n🚛 Migrating trailer history...')
    const { data: trailerHistory, error: trailerError } = await supabase
      .from('trailer_history')
      .insert(SAMPLE_DATA.trailer_history)
      .select()
    
    if (trailerError) {
      console.error('❌ Trailer history migration failed:', trailerError.message)
    } else {
      console.log(`✅ Migrated ${trailerHistory.length} trailer history records`)
    }
    
    // Migrate camper history
    console.log('\n🏕️ Migrating camper history...')
    const { data: camperHistory, error: camperError } = await supabase
      .from('camper_history')
      .insert(SAMPLE_DATA.camper_history)
      .select()
    
    if (camperError) {
      console.error('❌ Camper history migration failed:', camperError.message)
    } else {
      console.log(`✅ Migrated ${camperHistory.length} camper history records`)
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your .env file with Supabase credentials')
    console.log('2. Replace googleSheetsAPI with supabaseAPI in your app')
    console.log('3. Test the application with the new database')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Instructions for manual migration
function showManualMigrationInstructions() {
  console.log(`
📋 MANUAL MIGRATION INSTRUCTIONS

If you prefer to migrate manually, follow these steps:

1. 📊 EXPORT FROM GOOGLE SHEETS:
   - Open each sheet (Trailer_History, Camper_History, Venues, Staff)
   - File → Download → CSV
   - Save each CSV file

2. 🗄️ IMPORT TO SUPABASE:
   - Go to your Supabase dashboard
   - Navigate to Table Editor
   - For each table, click "Import data"
   - Upload the corresponding CSV file
   - Map columns correctly

3. 📝 COLUMN MAPPING:
   
   TRAILER_HISTORY & CAMPER_HISTORY:
   - Date → date
   - Status → status
   - Sales Tax → sales_tax
   - Net Sales → net_sales
   - Gross Sales → gross_sales
   - Venue ID → venue_id
   
   VENUES:
   - Promo → promo
   - Promo to Send → promo_to_send
   - Address City → address_city
   - Contact → contact
   - Phone → phone
   - Email → email
   - Times → times
   - Show Info → show_info
   - Forecast Will → forecast_will
   
   STAFF:
   - Name → name
   - Email → email
   - Phone → phone
   - Role → role
   - Status → status
   - Hire Date → hire_date
   - Notes → notes

4. ✅ VERIFY DATA:
   - Check that all records were imported
   - Verify data types are correct
   - Test the application

5. 🔄 UPDATE ENVIRONMENT VARIABLES:
   Add to your .env file:
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  `)
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData()
} else {
  showManualMigrationInstructions()
}

export { migrateData, showManualMigrationInstructions } 