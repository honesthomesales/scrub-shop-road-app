// Supabase API Service
// Replaces Google Sheets API with Supabase database operations

import { createClient } from '@supabase/supabase-js'

console.log('VITE_TEST_VAR:', import.meta.env.VITE_TEST_VAR);
console.log('All import.meta.env:', import.meta.env);

console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

// Hardcode the Supabase credentials since .env file isn't being read in production
const SUPABASE_URL = 'https://kvsbrrmzedadyffqtcdq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2c2Jycm16ZWRhZHlmZnF0Y2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTQxNzQsImV4cCI6MjA2Nzc3MDE3NH0.S3DSc-15No3SUr2Zmw_Qf7GQ4xABMYhMtN7LwvDDAiw'

// Create Supabase client with fallback for missing credentials
let supabase = null
try {
  if (SUPABASE_URL && SUPABASE_URL !== 'https://placeholder.supabase.co' && 
      SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'placeholder-key') {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log('Supabase client created successfully with hardcoded credentials')
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

  // ===== STAFF COMMUNICATION & TASK MANAGEMENT FUNCTIONS =====

  // Users Management
  async getUsers() {
    try {
      if (!supabase) {
        const mockUsers = [
          { id: 1, name: 'John Smith', email: 'john@scrubshop.com', role: 'manager', is_active: true },
          { id: 2, name: 'Jane Doe', email: 'jane@scrubshop.com', role: 'worker', is_active: true },
          { id: 3, name: 'Mike Johnson', email: 'mike@scrubshop.com', role: 'worker', is_active: true },
          { id: 4, name: 'Sarah Wilson', email: 'sarah@scrubshop.com', role: 'worker', is_active: true },
          { id: 5, name: 'Tom Brown', email: 'tom@scrubshop.com', role: 'admin', is_active: true },
          { id: 6, name: 'David Wilson', email: 'david@scrubshop.com', role: 'worker', is_active: true }
        ]
        return { success: true, data: mockUsers }
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get users:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async addUser(userData) {
    try {
      if (!supabase) {
        const newUser = { id: Date.now(), ...userData, created_at: new Date().toISOString() }
        return { success: true, data: newUser }
      }

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()

      if (error) throw new Error(error.message)

      return { success: true, data }
    } catch (error) {
      console.error('Failed to add user:', error)
      return { success: false, error: error.message }
    }
  }

  async updateUser(userId, userData) {
    try {
      if (!supabase) {
        return { success: true, data: { id: userId, ...userData } }
      }

      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw new Error(error.message)

      return { success: true, data }
    } catch (error) {
      console.error('Failed to update user:', error)
      return { success: false, error: error.message }
    }
  }

  // Message Groups Management
  async getMessageGroups() {
    try {
      if (!supabase) {
        const mockGroups = [
          { id: 1, group_name: 'Staff Chat', created_by: 1, is_active: true }
        ]
        return { success: true, data: mockGroups }
      }

      const { data, error } = await supabase
        .from('message_groups')
        .select('*')
        .eq('is_active', true)
        .order('group_name')

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get message groups:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async getGroupMembers(groupId) {
    try {
      if (!supabase) {
        const mockMembers = [
          { id: 1, group_id: 1, user_id: 1, role: 'admin' },
          { id: 2, group_id: 1, user_id: 2, role: 'member' },
          { id: 3, group_id: 1, user_id: 3, role: 'member' },
          { id: 4, group_id: 1, user_id: 4, role: 'member' },
          { id: 5, group_id: 1, user_id: 5, role: 'admin' }
        ]
        return { success: true, data: mockMembers }
      }

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          staff (id, name, email, role)
        `)
        .eq('group_id', groupId)

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get group members:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  // Staff Messages Management
  async getMessages(groupId = null, recipientId = null, limit = 50) {
    try {
      if (!supabase) {
        const mockMessages = [
          {
            id: 1,
            sender_id: 1,
            group_id: 1,
            message_text: 'Hello staff! How is everyone doing today?',
            message_type: 'text',
            created_at: new Date().toISOString(),
            sender: { id: 1, name: 'John Smith', email: 'john@scrubshop.com' }
          },
          {
            id: 2,
            sender_id: 2,
            group_id: 1,
            message_text: 'Doing great! Ready for the weekend shows.',
            message_type: 'text',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            sender: { id: 2, name: 'Jane Doe', email: 'jane@scrubshop.com' }
          }
        ]
        return { success: true, data: mockMessages }
      }

      let query = supabase
        .from('team_messages')
        .select(`
          *,
          sender:staff!team_messages_sender_id_fkey (id, name, email)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (groupId) {
        query = query.eq('group_id', groupId)
      } else if (recipientId) {
        query = query.eq('recipient_id', recipientId)
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get messages:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async sendMessage(messageData) {
    try {
      if (!supabase) {
        const newMessage = {
          id: Date.now(),
          ...messageData,
          created_at: new Date().toISOString(),
          sender: { id: messageData.sender_id, name: 'Current User', email: 'user@scrubshop.com' }
        }
        return { success: true, data: newMessage }
      }

      const { data, error } = await supabase
        .from('team_messages')
        .insert([messageData])
        .select(`
          *,
          sender:staff!team_messages_sender_id_fkey (id, name, email)
        `)
        .single()

      if (error) throw new Error(error.message)

      return { success: true, data }
    } catch (error) {
      console.error('Failed to send message:', error)
      return { success: false, error: error.message }
    }
  }

  // Tasks Management
  async getTasks(assignedTo = null, status = null) {
    try {
      if (!supabase) {
        const mockTasks = [
          {
            id: 1,
            title: 'Prepare trailer for weekend shows',
            description: 'Clean and stock the trailer for upcoming events',
            assigned_by: 1,
            assigned_to: 2,
            priority: 'high',
            status: 'pending',
            due_date: new Date(Date.now() + 86400000).toISOString(),
            category: 'maintenance'
          },
          {
            id: 2,
            title: 'Contact new venue',
            description: 'Follow up with the new venue we discussed',
            assigned_by: 1,
            assigned_to: 3,
            priority: 'normal',
            status: 'in_progress',
            due_date: new Date(Date.now() + 172800000).toISOString(),
            category: 'venue'
          }
        ]
        return { success: true, data: mockTasks }
      }

      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_by_user:staff!tasks_assigned_by_fkey (id, name, email),
          assigned_to_user:staff!tasks_assigned_to_fkey (id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get tasks:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async createTask(taskData) {
    try {
      if (!supabase) {
        const newTask = {
          id: Date.now(),
          ...taskData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return { success: true, data: newTask }
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select(`
          *,
          assigned_by_user:staff!tasks_assigned_by_fkey (id, name, email),
          assigned_to_user:staff!tasks_assigned_to_fkey (id, name, email)
        `)
        .single()

      if (error) throw new Error(error.message)

      return { success: true, data }
    } catch (error) {
      console.error('Failed to create task:', error)
      return { success: false, error: error.message }
    }
  }

  async updateTask(taskId, taskData) {
    try {
      if (!supabase) {
        return { success: true, data: { id: taskId, ...taskData } }
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({ ...taskData, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select(`
          *,
          assigned_by_user:staff!tasks_assigned_by_fkey (id, name, email),
          assigned_to_user:staff!tasks_assigned_to_fkey (id, name, email)
        `)
        .single()

      if (error) throw new Error(error.message)

      return { success: true, data }
    } catch (error) {
      console.error('Failed to update task:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteTask(taskId) {
    try {
      if (!supabase) {
        return { success: true }
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw new Error(error.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to delete task:', error)
      return { success: false, error: error.message }
    }
  }

  // Task Comments Management
  async getTaskComments(taskId) {
    try {
      if (!supabase) {
        const mockComments = [
          {
            id: 1,
            task_id: 1,
            user_id: 2,
            comment_text: 'Started working on this task',
            created_at: new Date().toISOString()
          }
        ]
        return { success: true, data: mockComments }
      }

      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user:staff (id, name, email)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get task comments:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async addTaskComment(commentData) {
    try {
      if (!supabase) {
        const newComment = {
          id: Date.now(),
          ...commentData,
          created_at: new Date().toISOString()
        }
        return { success: true, data: newComment }
      }

      const { data, error } = await supabase
        .from('task_comments')
        .insert([commentData])
        .select(`
          *,
          user:staff (id, name, email)
        `)
        .single()

      if (error) throw new Error(error.message)

      return { success: true, data }
    } catch (error) {
      console.error('Failed to add task comment:', error)
      return { success: false, error: error.message }
    }
  }

  // Sales Analysis Management
  async addSalesAnalysisBatch(salesData) {
    try {
      if (!supabase) {
        // Mock implementation for development
        console.log('Mock: Adding sales analysis batch:', salesData.length, 'records')
        return { success: true, data: salesData.map((item, index) => ({ ...item, id: Date.now() + index })) }
      }

      const { data, error } = await supabase
        .from('sales_analysis')
        .insert(salesData)
        .select()

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to add sales analysis batch:', error)
      return { success: false, error: error.message }
    }
  }

  async getSalesAnalysis(options = {}) {
    try {
      console.log('🔍 [getSalesAnalysis] Starting with options:', options)
      
      if (!supabase) {
        console.log('🔍 [getSalesAnalysis] Using mock data (no supabase client)')
        // Mock data for development
        const mockData = [
          {
            id: 1,
            store_id: 1,
            invoice_date: '2024-01-15',
            invoice_no: 'INV-001-123',
            po_no: 'PO-001',
            vendor: 'Sample Vendor',
            style: 'STYLE-001',
            color: 'Blue',
            size: 'M',
            product: 'Sample Product',
            description: 'Sample description',
            department: 'Clothing',
            sold_qty: 5,
            spec_qty: 2,
            total_qty: 7,
            cost: 25.00,
            retail: 50.00,
            actual: 45.00
          }
        ]
        return { success: true, data: mockData }
      }

      console.log('🔍 [getSalesAnalysis] Using pagination to fetch all data')
      // Use pagination to get all data beyond the 1000 limit
      let allData = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        console.log(`🔍 [getSalesAnalysis] Fetching page ${page + 1}...`)
        
        let query = supabase
          .from('sales_analysis')
          .select('*')
          .order('invoice_date', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        // Apply filters
        if (options.storeIds && options.storeIds.length > 0) {
          console.log(`🔍 [getSalesAnalysis] Filtering by store IDs:`, options.storeIds)
          query = query.in('store_id', options.storeIds)
        } else if (options.storeId) {
          console.log(`🔍 [getSalesAnalysis] Filtering by single store ID:`, options.storeId)
          query = query.eq('store_id', options.storeId)
        }
        if (options.startDate) {
          console.log(`🔍 [getSalesAnalysis] Filtering by start date:`, options.startDate)
          query = query.gte('invoice_date', options.startDate)
        }
        if (options.endDate) {
          console.log(`🔍 [getSalesAnalysis] Filtering by end date:`, options.endDate)
          query = query.lte('invoice_date', options.endDate)
        }
        if (options.vendor) {
          query = query.eq('vendor', options.vendor)
        }
        if (options.department) {
          query = query.eq('department', options.department)
        }

        const { data, error } = await query

        if (error) {
          console.error('🔍 [getSalesAnalysis] Database error:', error)
          throw new Error(error.message)
        }

        console.log(`🔍 [getSalesAnalysis] Page ${page + 1} returned ${data?.length || 0} records`)

        if (data && data.length > 0) {
          allData = allData.concat(data)
          page++
          
          // Stop if we got less than pageSize (means we're at the end)
          if (data.length < pageSize) {
            console.log(`🔍 [getSalesAnalysis] Got ${data.length} records (less than pageSize), stopping pagination`)
            hasMore = false
          }
          
          // Safety check to prevent infinite loops
          if (page > 10) {
            console.warn('🔍 [getSalesAnalysis] Stopping pagination after 10 pages to prevent infinite loop')
            hasMore = false
          }
        } else {
          console.log(`🔍 [getSalesAnalysis] No data returned for page ${page + 1}, stopping pagination`)
          hasMore = false
        }
      }

      console.log(`🔍 [getSalesAnalysis] Final result: Retrieved ${allData.length} records through pagination`)
      return { success: true, data: allData }
    } catch (error) {
      console.error('🔍 [getSalesAnalysis] Failed to get sales analysis:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async getSalesAnalysisStats(options = {}) {
    try {
      console.log('📊 [getSalesAnalysisStats] Starting with options:', options)
      
      if (!supabase) {
        console.log('📊 [getSalesAnalysisStats] Using mock stats (no supabase client)')
        // Mock stats for development
        return {
          success: true,
          data: {
            totalSales: 15000.00,
            totalCost: 7500.00,
            totalProfit: 7500.00,
            totalItems: 150,
            avgProfitMargin: 50.0,
            topVendors: [
              { vendor: 'Vendor A', sales: 5000.00 },
              { vendor: 'Vendor B', sales: 4000.00 }
            ],
            topDepartments: [
              { department: 'Clothing', sales: 8000.00 },
              { department: 'Accessories', sales: 4000.00 }
            ]
          }
        }
      }

      console.log('📊 [getSalesAnalysisStats] Using pagination to fetch all data for stats')
      // Get basic stats with pagination to handle large datasets
      let allSalesData = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        console.log(`📊 [getSalesAnalysisStats] Fetching page ${page + 1}...`)
        
        const { data, error } = await supabase
          .from('sales_analysis')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
          console.error('📊 [getSalesAnalysisStats] Database error:', error)
          throw new Error(error.message)
        }

        console.log(`📊 [getSalesAnalysisStats] Page ${page + 1} returned ${data?.length || 0} records`)

        if (data && data.length > 0) {
          allSalesData = allSalesData.concat(data)
          page++
          
          // Stop if we got less than pageSize (means we're at the end)
          if (data.length < pageSize) {
            console.log(`📊 [getSalesAnalysisStats] Got ${data.length} records (less than pageSize), stopping pagination`)
            hasMore = false
          }
          
          // Safety check to prevent infinite loops
          if (page > 10) {
            console.warn('📊 [getSalesAnalysisStats] Stopping pagination after 10 pages to prevent infinite loop')
            hasMore = false
          }
        } else {
          console.log(`📊 [getSalesAnalysisStats] No data returned for page ${page + 1}, stopping pagination`)
          hasMore = false
        }
      }

      console.log(`📊 [getSalesAnalysisStats] Final result: Retrieved ${allSalesData.length} records for stats through pagination`)
      const salesData = allSalesData

      // Calculate stats
      const stats = {
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
        totalItems: 0,
        vendors: {},
        departments: {}
      }

      salesData.forEach(item => {
        const actual = parseFloat(item.actual) || 0
        const cost = parseFloat(item.cost) || 0
        const soldQty = parseInt(item.sold_qty) || 0

        stats.totalSales += actual * soldQty
        stats.totalCost += cost * soldQty
        stats.totalItems += soldQty

        // Track vendors
        if (item.vendor) {
          if (!stats.vendors[item.vendor]) {
            stats.vendors[item.vendor] = 0
          }
          stats.vendors[item.vendor] += actual * soldQty
        }

        // Track departments
        if (item.department) {
          if (!stats.departments[item.department]) {
            stats.departments[item.department] = 0
          }
          stats.departments[item.department] += actual * soldQty
        }
      })

      stats.totalProfit = stats.totalSales - stats.totalCost
      stats.avgProfitMargin = stats.totalSales > 0 ? (stats.totalProfit / stats.totalSales) * 100 : 0

      // Get top vendors and departments
      const topVendors = Object.entries(stats.vendors)
        .map(([vendor, sales]) => ({ vendor, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      const topDepartments = Object.entries(stats.departments)
        .map(([department, sales]) => ({ department, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      return {
        success: true,
        data: {
          ...stats,
          topVendors,
          topDepartments
        }
      }
    } catch (error) {
      console.error('Failed to get sales analysis stats:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteSalesAnalysis(recordId) {
    try {
      if (!supabase) {
        return { success: true }
      }

      const { error } = await supabase
        .from('sales_analysis')
        .delete()
        .eq('id', recordId)

      if (error) throw new Error(error.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to delete sales analysis record:', error)
      return { success: false, error: error.message }
    }
  }

  async clearSalesAnalysis(storeId = null) {
    try {
      if (!supabase) {
        return { success: true }
      }

      let query = supabase
        .from('sales_analysis')
        .delete()

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { error } = await query

      if (error) throw new Error(error.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to clear sales analysis:', error)
      return { success: false, error: error.message }
    }
  }
}

// Create and export singleton instance
const supabaseAPI = new SupabaseAPI()
export default supabaseAPI 