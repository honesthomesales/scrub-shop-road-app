// Supabase API Service
// Replaces Google Sheets API with Supabase database operations

import { createClient } from '@supabase/supabase-js'

console.log('VITE_TEST_VAR:', import.meta.env.VITE_TEST_VAR);
console.log('All import.meta.env:', import.meta.env);

console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Create Supabase client with fallback for missing credentials
let supabase = null
try {
  if (SUPABASE_URL && SUPABASE_URL !== 'https://placeholder.supabase.co' && 
      SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'placeholder-key') {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  } else {
    console.warn('Supabase credentials not configured. Using mock data mode.')
  }
} catch (error) {
  console.error('Failed to create Supabase client:', error)
}

class SupabaseAPI {
  constructor() {
    this.isAuthenticated = true // Supabase handles auth differently
  }

  // Initialize the API
  async init() {
    try {
      if (!supabase) {
        console.log('Supabase API initialized in mock mode')
        return true
      }
      
      // Test connection
      const { data, error } = await supabase
        .from('venues')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('Supabase connection failed:', error)
        return false
      }
      
      console.log('Supabase API initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize Supabase API:', error)
      return false
    }
  }

  // Get mock data for testing
  getMockData(tableName) {
    const mockData = {
      venues: [
        { id: 1, promo: 'Venue A', address_city: 'New York', contact: 'John Doe', phone: '555-0101', email: 'john@venuea.com' },
        { id: 2, promo: 'Venue B', address_city: 'Los Angeles', contact: 'Jane Smith', phone: '555-0102', email: 'jane@venueb.com' },
        { id: 3, promo: 'Venue C', address_city: 'Chicago', contact: 'Bob Johnson', phone: '555-0103', email: 'bob@venuec.com' }
      ],
      trailer_history: [
        { 
          id: 1, 
          date: '2024-07-15', 
          venue_id: 1, 
          gross_sales: 2500, 
          net_sales: 2250, 
          sales_tax: 250, 
          items_sold: 25, 
          staff: 'Alice Johnson',
          venue_name: 'Venue A',
          address_city: 'New York'
        },
        { 
          id: 2, 
          date: '2024-07-16', 
          venue_id: 2, 
          gross_sales: 3200, 
          net_sales: 2880, 
          sales_tax: 320, 
          items_sold: 35, 
          staff: 'Bob Smith',
          venue_name: 'Venue B',
          address_city: 'Los Angeles'
        },
        { 
          id: 3, 
          date: '2024-07-17', 
          venue_id: 3, 
          gross_sales: 1800, 
          net_sales: 1620, 
          sales_tax: 180, 
          items_sold: 30, 
          staff: 'Charlie Brown',
          venue_name: 'Venue C',
          address_city: 'Chicago'
        }
      ],
      camper_history: [
        { 
          id: 1, 
          date: '2024-07-15', 
          venue_id: 1, 
          gross_sales: 1500, 
          net_sales: 1350, 
          sales_tax: 150, 
          items_sold: 15, 
          staff: 'Alice Johnson',
          venue_name: 'Venue A',
          address_city: 'New York'
        },
        { 
          id: 2, 
          date: '2024-07-16', 
          venue_id: 2, 
          gross_sales: 2200, 
          net_sales: 1980, 
          sales_tax: 220, 
          items_sold: 22, 
          staff: 'Bob Smith',
          venue_name: 'Venue B',
          address_city: 'Los Angeles'
        },
        { 
          id: 3, 
          date: '2024-07-17', 
          venue_id: 3, 
          gross_sales: 1900, 
          net_sales: 1710, 
          sales_tax: 190, 
          items_sold: 19, 
          staff: 'Charlie Brown',
          venue_name: 'Venue C',
          address_city: 'Chicago'
        }
      ],
      staff: [
        { id: 1, name: 'Alice Johnson', email: 'alice@scrubshop.com', phone: '555-0201', role: 'Sales Rep' },
        { id: 2, name: 'Bob Smith', email: 'bob@scrubshop.com', phone: '555-0202', role: 'Manager' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@scrubshop.com', phone: '555-0203', role: 'Sales Rep' }
      ]
    }
    return mockData[tableName] || []
  }

  // Read data from a table
  async readTable(tableName, options = {}) {
    try {
      if (!supabase) {
        // Return mock data when Supabase is not configured
        const mockData = this.getMockData(tableName)
        console.log(`Using mock data for ${tableName}:`, mockData)
        return {
          success: true,
          data: mockData
        }
      }
      
      let query = supabase.from(tableName).select('*')
      
      // Add filters if provided
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }
      
      // Add date range filter if provided
      if (options.dateFrom && options.dateTo) {
        query = query.gte('date', options.dateFrom).lte('date', options.dateTo)
      }
      
      // Add ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending !== false })
      } else {
        query = query.order('created_at', { ascending: false })
      }
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(error.message)
      }
      
      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      console.error(`Failed to read from ${tableName}:`, error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }

  // Add a new row to a table
  async addRow(tableName, rowData) {
    try {
      if (!supabase) {
        console.log(`Mock: Adding row to ${tableName}:`, rowData)
        return {
          success: true,
          data: { ...rowData, id: Date.now() },
          message: 'Row added successfully (mock mode)'
        }
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .insert([rowData])
        .select()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return {
        success: true,
        data: data[0],
        message: 'Row added successfully'
      }
    } catch (error) {
      console.error(`Failed to add row to ${tableName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Update a specific row
  async updateRow(tableName, rowId, rowData) {
    try {
      if (!supabase) {
        console.log(`Mock: Updating row ${rowId} in ${tableName}:`, rowData)
        return {
          success: true,
          data: { id: rowId, ...rowData },
          message: 'Row updated successfully (mock mode)'
        }
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .update(rowData)
        .eq('id', rowId)
        .select()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return {
        success: true,
        data: data[0],
        message: 'Row updated successfully'
      }
    } catch (error) {
      console.error(`Failed to update row in ${tableName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Delete a specific row
  async deleteRow(tableName, rowId) {
    try {
      if (!supabase) {
        console.log(`Mock: Deleting row ${rowId} from ${tableName}`)
        return {
          success: true,
          message: 'Row deleted successfully (mock mode)'
        }
      }
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', rowId)
      
      if (error) {
        throw new Error(error.message)
      }
      
      return {
        success: true,
        message: 'Row deleted successfully'
      }
    } catch (error) {
      console.error(`Failed to delete row from ${tableName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get table metadata
  async getTableInfo(tableName) {
    try {
      if (!supabase) {
        const mockData = this.getMockData(tableName)
        return {
          success: true,
          data: {
            title: tableName,
            rowCount: mockData.length,
            columnCount: mockData.length > 0 ? Object.keys(mockData[0]).length : 0
          }
        }
      }
      
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return {
        success: true,
        data: {
          title: tableName,
          rowCount: count || 0,
          columnCount: 10 // Approximate
        }
      }
    } catch (error) {
      console.error(`Failed to get table info for ${tableName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Search/filter data
  async searchData(tableName, query, column = null) {
    try {
      if (!supabase) {
        const mockData = this.getMockData(tableName)
        if (!query) {
          return {
            success: true,
            data: mockData
          }
        }
        
        // Simple mock search
        const filteredData = mockData.filter(item => {
          if (column) {
            return item[column] && item[column].toString().toLowerCase().includes(query.toLowerCase())
          }
          // Search across common fields
          return Object.values(item).some(value => 
            value && value.toString().toLowerCase().includes(query.toLowerCase())
          )
        })
        
        return {
          success: true,
          data: filteredData
        }
      }
      
      let supabaseQuery = supabase.from(tableName).select('*')
      
      if (query) {
        if (column) {
          supabaseQuery = supabaseQuery.ilike(column, `%${query}%`)
        } else {
          // Search across multiple columns (you can customize this)
          supabaseQuery = supabaseQuery.or(
            `name.ilike.%${query}%,email.ilike.%${query}%,promo.ilike.%${query}%`
          )
        }
      }
      
      const { data, error } = await supabaseQuery
      
      if (error) {
        throw new Error(error.message)
      }
      
      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      console.error(`Failed to search data in ${tableName}:`, error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }

  // Get sales data with venue information
  async getSalesWithVenues(tableName, options = {}) {
    try {
      if (!supabase) {
        const mockSales = this.getMockData(tableName)
        const mockVenues = this.getMockData('venues')
        
        // Combine sales with venue data
        const salesWithVenues = mockSales.map(sale => ({
          ...sale,
          venues: mockVenues.find(venue => venue.id === sale.venue_id) || {}
        }))
        
        return {
          success: true,
          data: salesWithVenues
        }
      }
      
      let query = supabase
        .from(tableName)
        .select(`
          *,
          venues (
            id,
            promo,
            address_city,
            contact,
            phone,
            email
          )
        `)
      
      // Add date range filter if provided
      if (options.dateFrom && options.dateTo) {
        query = query.gte('date', options.dateFrom).lte('date', options.dateTo)
      }
      
      // Add ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending !== false })
      } else {
        query = query.order('date', { ascending: false })
      }
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(error.message)
      }
      
      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      console.error(`Failed to get sales with venues from ${tableName}:`, error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      if (!supabase) {
        // Return mock dashboard stats when Supabase is not configured
        const mockTrailerHistory = this.getMockData('trailer_history')
        const mockCamperHistory = this.getMockData('camper_history')
        const mockVenues = this.getMockData('venues')
        const mockStaff = this.getMockData('staff')
        
        const mockStats = {
          trailerHistory: mockTrailerHistory,
          camperHistory: mockCamperHistory,
          venueCount: mockVenues.length,
          staffCount: mockStaff.length
        }
        console.log('Using mock dashboard stats:', mockStats)
        return {
          success: true,
          data: mockStats
        }
      }
      
      // Get trailer history stats
      const { data: trailerData, error: trailerError } = await supabase
        .from('trailer_history')
        .select('gross_sales, net_sales, sales_tax, date')
      
      if (trailerError) throw new Error(trailerError.message)
      
      // Get camper history stats
      const { data: camperData, error: camperError } = await supabase
        .from('camper_history')
        .select('gross_sales, net_sales, sales_tax, date')
      
      if (camperError) throw new Error(camperError.message)
      
      // Get venue count
      const { count: venueCount, error: venueError } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true })
      
      if (venueError) throw new Error(venueError.message)
      
      // Get staff count
      const { count: staffCount, error: staffError } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
      
      if (staffError) throw new Error(staffError.message)
      
      return {
        success: true,
        data: {
          trailerHistory: trailerData || [],
          camperHistory: camperData || [],
          venueCount: venueCount || 0,
          staffCount: staffCount || 0
        }
      }
    } catch (error) {
      console.error('Failed to get dashboard stats:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Authenticate user (placeholder for future auth implementation)
  async authenticate() {
    // For now, return true since we're using anonymous access
    // In the future, you can implement Supabase Auth here
    return true
  }
}

// Create and export singleton instance
const supabaseAPI = new SupabaseAPI()
export default supabaseAPI 