// Supabase API Service
// Replaces Google Sheets API with Supabase database operations

import { createClient } from '@supabase/supabase-js'



// Hardcode the Supabase credentials since .env file isn't being read in production
const SUPABASE_URL = 'https://kvsbrrmzedadyffqtcdq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2c2Jycm16ZWRhZHlmZnF0Y2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTQxNzQsImV4cCI6MjA2Nzc3MDE3NH0.S3DSc-15No3SUr2Zmw_Qf7GQ4xABMYhMtN7LwvDDAiw'

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
    // Initialize mock message storage
    if (!SupabaseAPI.mockMessages) {
      SupabaseAPI.mockMessages = []
    }
  }

  // Initialize the API
  async init() {
    try {
      if (!supabase) {
  
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
      

      return true
    } catch (error) {
      console.error('Failed to initialize Supabase API:', error)
      return false
    }
  }

  // Get mock data for testing
  getMockData(tableName) {
    const mockData = {
      venues: [],
      trailer_history: [],
      camper_history: [],
      staff: []
    }
    return mockData[tableName] || []
  }

  // Read data from a table
  async readTable(tableName, options = {}) {
    try {
      if (!supabase) {
        // Return mock data when Supabase is not configured
        const mockData = this.getMockData(tableName)

        return {
          success: true,
          data: mockData
        }
      }
      
      // Use pagination to fetch all data beyond the 1000 limit
      let allData = []
      let page = 0
      const pageSize = 1000
      let hasMore = true



      while (hasMore) {

        
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
          // Default ordering by date if available, otherwise by id
          if (tableName.includes('history')) {
            query = query.order('date', { ascending: false })
          } else {
            query = query.order('id', { ascending: false })
          }
        }
        
        // Add pagination
        query = query.range(page * pageSize, (page + 1) * pageSize - 1)
        
        const { data, error } = await query
        
        if (error) {
          throw new Error(error.message)
        }
        

        
        if (data && data.length > 0) {
          allData = allData.concat(data)
          page++
          
          // Stop if we got less than pageSize (means we're at the end)
          if (data.length < pageSize) {

            hasMore = false
          }
          
          // Safety check to prevent infinite loops
          if (page > 50) {
            console.warn(`[readTable] Stopping pagination after 50 pages to prevent infinite loop for ${tableName}`)
            hasMore = false
          }
        } else {
          
          hasMore = false
        }
      }
      

      
      return {
        success: true,
        data: allData
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
          { id: 1, group_name: 'General', created_by: 1, is_active: true }
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
          { id: 5, group_id: 1, user_id: 5, role: 'admin' },
          { id: 6, group_id: 1, user_id: 6, role: 'member' }
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
        let messages = SupabaseAPI.mockMessages || []
        
        // Filter by group if specified
        if (groupId) {
          messages = messages.filter(msg => msg.group_id === groupId)
        }
        
        // Sort by created_at ascending (oldest first) for chat display
        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        
        // Apply limit
        if (limit) {
          messages = messages.slice(0, limit)
        }
        
        return { success: true, data: messages }
      }

      let query = supabase
        .from('team_messages')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
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
        // Get sender name from mock users
        const mockUsers = [
          { id: 1, name: 'John Smith', email: 'john@scrubshop.com', role: 'manager', is_active: true },
          { id: 2, name: 'Jane Doe', email: 'jane@scrubshop.com', role: 'worker', is_active: true },
          { id: 3, name: 'Mike Johnson', email: 'mike@scrubshop.com', role: 'worker', is_active: true },
          { id: 4, name: 'Sarah Wilson', email: 'sarah@scrubshop.com', role: 'worker', is_active: true },
          { id: 5, name: 'Tom Brown', email: 'tom@scrubshop.com', role: 'admin', is_active: true },
          { id: 6, name: 'David Wilson', email: 'david@scrubshop.com', role: 'worker', is_active: true }
        ]
        
        const sender = mockUsers.find(user => user.id === messageData.sender_id) || 
                      { id: messageData.sender_id, name: 'Unknown User', email: 'unknown@scrubshop.com' }
        
        const newMessage = {
          id: Date.now(),
          ...messageData,
          created_at: new Date().toISOString(),
          sender: { id: sender.id, name: sender.name, email: sender.email }
        }
        
        // Add to mock storage
        if (!SupabaseAPI.mockMessages) {
          SupabaseAPI.mockMessages = []
        }
        SupabaseAPI.mockMessages.push(newMessage)
        
        return { success: true, data: newMessage }
      }

      const { data, error } = await supabase
        .from('team_messages')
        .insert([messageData])
        .select('*')
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
        const mockTasks = []
        return { success: true, data: mockTasks }
      }

      let query = supabase
        .from('tasks')
        .select('*')
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
        .select('*')
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
        .select('*')
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
      // Task comments table doesn't exist yet, return empty array
      return { success: true, data: [] }
    } catch (error) {
      console.error('Failed to get task comments:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async addTaskComment(commentData) {
    try {
      // Task comments table doesn't exist yet, return mock success
      const newComment = {
        id: Date.now(),
        ...commentData,
        created_at: new Date().toISOString()
      }
      return { success: true, data: newComment }
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

      
      if (!supabase) {
        const mockData = []
        return { success: true, data: mockData }
      }


      // Use pagination to get all data beyond the 1000 limit
      let allData = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {

        
        let query = supabase
          .from('sales_analysis')
          .select('*')
          .order('invoice_date', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        // Apply filters
        if (options.storeIds && options.storeIds.length > 0) {
          query = query.in('store_id', options.storeIds)
        } else if (options.storeId) {
          query = query.eq('store_id', options.storeId)
        }
        if (options.startDate) {
          query = query.gte('invoice_date', options.startDate)
        }
        if (options.endDate) {
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



        if (data && data.length > 0) {
          allData = allData.concat(data)
          page++
          
          // Stop if we got less than pageSize (means we're at the end)
          if (data.length < pageSize) {

            hasMore = false
          }
          
          // Safety check to prevent infinite loops
          if (page > 10) {
            console.warn('🔍 [getSalesAnalysis] Stopping pagination after 10 pages to prevent infinite loop')
            hasMore = false
          }
        } else {
          
          hasMore = false
        }
      }


      return { success: true, data: allData }
    } catch (error) {
      console.error('🔍 [getSalesAnalysis] Failed to get sales analysis:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async getSalesAnalysisStats(options = {}) {
    try {

      
      if (!supabase) {
        return {
          success: true,
          data: {
            totalSales: 0,
            totalCost: 0,
            totalProfit: 0,
            totalItems: 0,
            avgProfitMargin: 0,
            topVendors: [],
            topDepartments: []
          }
        }
      }


      // Get basic stats with pagination to handle large datasets
      let allSalesData = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {

        
        const { data, error } = await supabase
          .from('sales_analysis')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
          console.error('📊 [getSalesAnalysisStats] Database error:', error)
          throw new Error(error.message)
        }



        if (data && data.length > 0) {
          allSalesData = allSalesData.concat(data)
          page++
          
          // Stop if we got less than pageSize (means we're at the end)
          if (data.length < pageSize) {

            hasMore = false
          }
          
          // Safety check to prevent infinite loops
          if (page > 10) {
            console.warn('📊 [getSalesAnalysisStats] Stopping pagination after 10 pages to prevent infinite loop')
            hasMore = false
          }
        } else {
          
          hasMore = false
        }
      }


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

  async importTrailerHistory(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: 'No data to import', processed: 0, failed: 0 }
    }
    if (!supabase) {
      // Mock mode: just return success
      return { success: true, processed: rows.length, failed: 0 }
    }

    // Aggregate data by date and store
    const aggregatedData = {}
    
    for (const row of rows) {
      const key = `${row.date}_${row.store}`
      
      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          date: row.date,
          Store: row.store,
          sales_tax: 0,
          net_sales: 0,
          gross_sales: 0
        }
      }
      
      // Sum the numeric fields
      aggregatedData[key].sales_tax += parseFloat(row.sales_tax || 0)
      aggregatedData[key].net_sales += parseFloat(row.net_sales || 0)
      aggregatedData[key].gross_sales += parseFloat(row.gross_sales || 0)
    }



    let processed = 0
    let failed = 0
    
    // Process each aggregated record
    for (const record of Object.values(aggregatedData)) {
      try {
        // Upsert by date and Store (capital S)
        const { error } = await supabase
          .from('trailer_history')
          .upsert([record], { onConflict: ['date', 'Store'] })
        
        if (error) {
          failed++
          console.error('Upsert error:', error)
        } else {
          processed++
        }
      } catch (err) {
        failed++
        console.error('Exception during upsert:', err)
      }
    }
    
    return { success: failed === 0, processed, failed }
  }
}

// Create and export singleton instance
const supabaseAPI = new SupabaseAPI()
export default supabaseAPI 