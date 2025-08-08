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

  // ===== AUTHENTICATION METHODS =====

  // Get current user
  async getCurrentUser() {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
      }

      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        return { success: false, error: error.message }
      }

      if (!user) {
        return { success: false, error: 'No user found' }
      }

      // Get user profile from our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Could not fetch user profile:', profileError)
      }

      const userData = {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || user.email,
        role: profile?.role || 'user',
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at
      }

      return { success: true, data: userData }
    } catch (error) {
      console.error('Failed to get current user:', error)
      return { success: false, error: error.message }
    }
  }

  // Sign in user
  async signIn(email, password) {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Get user profile
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        role: 'user', // Will be updated from profile
        created_at: data.user.created_at,
        last_sign_in: data.user.last_sign_in_at
      }

      // Try to get profile from users table
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .single()

      if (profile) {
        userData.name = profile.name
        userData.role = profile.role
      }

      return { success: true, data: userData }
    } catch (error) {
      console.error('Failed to sign in:', error)
      return { success: false, error: error.message }
    }
  }

  // Sign up user
  async signUp(email, password, name) {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Create user profile in our users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            email: data.user.email,
            name: name,
            role: 'user',
            is_active: true
          }])

        if (profileError) {
          console.warn('Could not create user profile:', profileError)
        }
      }

      return { success: true, data: data.user }
    } catch (error) {
      console.error('Failed to sign up:', error)
      return { success: false, error: error.message }
    }
  }

  // Sign out user
  async signOut() {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
      }

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to sign out:', error)
      return { success: false, error: error.message }
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to reset password:', error)
      return { success: false, error: error.message }
    }
  }

  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
      }

      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Failed to update profile:', error)
      return { success: false, error: error.message }
    }
  }

  // Authenticate user (legacy method - now uses getCurrentUser)
  async authenticate() {
    const result = await this.getCurrentUser()
    return result.success
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

  // ===== STORE HOURS & HOLIDAYS MANAGEMENT =====
  
  async getStoreHours(storeId) {
    try {
      if (!supabase) {
        // Mock data for development
        return { success: true, data: [] }
      }

      const { data, error } = await supabase
        .from('store_hours')
        .select('*')
        .eq('store_id', storeId)
        .order('day_of_week')

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get store hours:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async saveStoreHours(storeId, hoursData) {
    try {
      if (!supabase) {
        console.log('Mock: Saving store hours:', hoursData)
        return { success: true }
      }

      // First, delete existing hours for this store
      const { error: deleteError } = await supabase
        .from('store_hours')
        .delete()
        .eq('store_id', storeId)

      if (deleteError) throw new Error(deleteError.message)

      // Then insert new hours
      const { error: insertError } = await supabase
        .from('store_hours')
        .insert(hoursData)

      if (insertError) throw new Error(insertError.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to save store hours:', error)
      return { success: false, error: error.message }
    }
  }

  async getStoreHolidays(storeId) {
    try {
      if (!supabase) {
        // Mock data for development
        return { success: true, data: [] }
      }

      const { data, error } = await supabase
        .from('store_holidays')
        .select('*')
        .eq('store_id', storeId)
        .order('date')

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get store holidays:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async saveStoreHolidays(storeId, holidaysData) {
    try {
      if (!supabase) {
        console.log('Mock: Saving store holidays:', holidaysData)
        return { success: true }
      }

      // First, delete existing holidays for this store
      const { error: deleteError } = await supabase
        .from('store_holidays')
        .delete()
        .eq('store_id', storeId)

      if (deleteError) throw new Error(deleteError.message)

      // Then insert new holidays
      const { error: insertError } = await supabase
        .from('store_holidays')
        .insert(holidaysData)

      if (insertError) throw new Error(insertError.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to save store holidays:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== COMMISSION MANAGEMENT =====
  
  async getCommissionTiers(storeId) {
    try {
      if (!supabase) {
        // Mock data for development
        return { success: true, data: [] }
      }

      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('store_id', storeId)
        .order('sales_target')

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get commission tiers:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async saveCommissionTiers(storeId, tiersData) {
    try {
      if (!supabase) {
        console.log('Mock: Saving commission tiers:', tiersData)
        return { success: true }
      }

      console.log('saveCommissionTiers called with storeId:', storeId, 'tiersData:', tiersData)

      // First, delete existing tiers for this store
      const { error: deleteError } = await supabase
        .from('commission_tiers')
        .delete()
        .eq('store_id', storeId)

      if (deleteError) throw new Error(deleteError.message)

      // Prepare data for insertion - only include fields that exist in the database
      const insertData = tiersData
        .filter(tier => tier.sales_target > 0 && tier.bonus_amount > 0) // Only save valid entries
        .map(tier => {
          // Ensure tier_name is never empty
          const tierName = (tier.tier_name && tier.tier_name.trim()) || `Bonus for $${tier.sales_target.toLocaleString()}+ sales`
          
          return {
            store_id: tier.store_id,
            tier_name: tierName,
            sales_target: tier.sales_target,
            commission_rate: tier.commission_rate || 0,
            bonus_amount: tier.bonus_amount
            // Do NOT include id field - let database auto-generate
          }
        })

      console.log('Final insertData to send to database:', insertData)

      // Insert new tiers without specifying columns (let database handle ID generation)
      const { error: insertError } = await supabase
        .from('commission_tiers')
        .insert(insertData)

      if (insertError) throw new Error(insertError.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to save commission tiers:', error)
      return { success: false, error: error.message }
    }
  }

  async getStaffCommissionRates(storeId) {
    try {
      if (!supabase) {
        // Mock data for development
        return { success: true, data: [] }
      }

      const { data, error } = await supabase
        .from('staff_commission_rates')
        .select('*')
        .eq('store_id', storeId)

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get staff commission rates:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async saveStaffCommissionRates(storeId, ratesData) {
    try {
      if (!supabase) {
        console.log('Mock: Saving staff commission rates:', ratesData)
        return { success: true }
      }

      // First, delete existing rates for this store
      const { error: deleteError } = await supabase
        .from('staff_commission_rates')
        .delete()
        .eq('store_id', storeId)

      if (deleteError) throw new Error(deleteError.message)

      // Then insert new rates
      const { error: insertError } = await supabase
        .from('staff_commission_rates')
        .insert(ratesData)

      if (insertError) throw new Error(insertError.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to save staff commission rates:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== SCHEDULE MANAGEMENT =====
  
  async getScheduleSlots(storeId, startDate, endDate) {
    try {
      if (!supabase) {
        // Mock data for development
        return { success: true, data: [] }
      }

      const { data, error } = await supabase
        .from('schedule_slots')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date, start_time')

      if (error) throw new Error(error.message)

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get schedule slots:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async saveScheduleSlot(slotData) {
    try {
      if (!supabase) {
        console.log('Mock: Saving schedule slot:', slotData)
        return { success: true }
      }

      const { error } = await supabase
        .from('schedule_slots')
        .upsert(slotData, { onConflict: 'store_id,date,start_time' })

      if (error) throw new Error(error.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to save schedule slot:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteScheduleSlot(slotId) {
    try {
      if (!supabase) {
        console.log('Mock: Deleting schedule slot:', slotId)
        return { success: true }
      }

      const { error } = await supabase
        .from('schedule_slots')
        .delete()
        .eq('id', slotId)

      if (error) throw new Error(error.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to delete schedule slot:', error)
      return { success: false, error: error.message }
    }
  }

  async getScheduleAssignments(storeId, startDate, endDate) {
    try {
      if (!supabase) {
        // Mock data for development
        return { success: true, data: [] }
      }

      const { data, error } = await supabase
        .from('schedule_assignments')
        .select(`
          *,
          staff:staff_id(name, role)
        `)
        .eq('store_id', storeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date, start_time')

      if (error) throw new Error(error.message)

      // Transform snake_case to camelCase for frontend
      const transformedData = (data || []).map(item => ({
        id: item.id,
        storeId: item.store_id,
        staffId: item.staff_id,
        date: item.date,
        startTime: item.start_time,
        endTime: item.end_time,
        notes: item.notes,
        staff: item.staff
      }))

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('Failed to get schedule assignments:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  async saveScheduleAssignment(assignmentData) {
    try {
      if (!supabase) {
        console.log('Mock: Saving schedule assignment:', assignmentData)
        return { success: true, data: { ...assignmentData, id: Date.now() } }
      }

      // Transform camelCase to snake_case for database
      const dbData = {
        store_id: assignmentData.storeId,
        staff_id: assignmentData.staffId,
        date: assignmentData.date,
        start_time: assignmentData.startTime,
        end_time: assignmentData.endTime,
        notes: assignmentData.notes
      }

      const { data, error } = await supabase
        .from('schedule_assignments')
        .upsert(dbData, { onConflict: 'staff_id,date,start_time' })
        .select()

      if (error) throw new Error(error.message)

      // Transform back to camelCase for frontend
      const transformedData = data?.[0] ? {
        id: data[0].id,
        storeId: data[0].store_id,
        staffId: data[0].staff_id,
        date: data[0].date,
        startTime: data[0].start_time,
        endTime: data[0].end_time,
        notes: data[0].notes
      } : assignmentData

      return { success: true, data: transformedData }
    } catch (error) {
      console.error('Failed to save schedule assignment:', error)
      return { success: false, error: error.message }
    }
  }

  async createScheduleAssignment(assignmentData) {
    try {
      if (!supabase) {
        console.log('Mock: Creating schedule assignment:', assignmentData)
        const newAssignment = { ...assignmentData, id: Date.now() }
        return { success: true, data: newAssignment }
      }

      const { data, error } = await supabase
        .from('schedule_assignments')
        .insert(assignmentData)
        .select()

      if (error) throw new Error(error.message)

      return { success: true, data: data?.[0] || assignmentData }
    } catch (error) {
      console.error('Failed to create schedule assignment:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteScheduleAssignment(assignmentId) {
    try {
      if (!supabase) {
        console.log('Mock: Deleting schedule assignment:', assignmentId)
        return { success: true }
      }

      const { error } = await supabase
        .from('schedule_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw new Error(error.message)

      return { success: true }
    } catch (error) {
      console.error('Failed to delete schedule assignment:', error)
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

  // ===== SALES DATA INTEGRATION =====
  async getSalesForPeriod(storeId, startDate, endDate) {
    try {
      if (!supabase) {
        // Return mock sales data
        return { success: true, data: [
          { date: startDate, store: storeId, total_sales: 15000 },
          { date: endDate, store: storeId, total_sales: 18000 }
        ]}
      }

      // Query sales data from trailer_history and camper_history
      const { data: trailerSales, error: trailerError } = await supabase
        .from('trailer_history')
        .select('date, Store, gross_sales')
        .eq('Store', storeId)
        .gte('date', startDate)
        .lte('date', endDate)

      const { data: camperSales, error: camperError } = await supabase
        .from('camper_history')
        .select('date, Store, gross_sales')
        .eq('Store', storeId)
        .gte('date', startDate)
        .lte('date', endDate)

      if (trailerError) throw trailerError
      if (camperError) throw camperError

      // Combine and aggregate sales data
      const allSales = [...(trailerSales || []), ...(camperSales || [])]
      const aggregatedSales = allSales.reduce((acc, sale) => {
        const date = sale.date
        if (!acc[date]) {
          acc[date] = { date, store: storeId, total_sales: 0 }
        }
        acc[date].total_sales += parseFloat(sale.gross_sales || 0)
        return acc
      }, {})

      return { success: true, data: Object.values(aggregatedSales) }
    } catch (error) {
      console.error('Error fetching sales data:', error)
      return { success: false, error: error.message }
    }
  }

  async getSalesByStaff(staffId, startDate, endDate) {
    try {
      if (!supabase) {
        return { success: true, data: [] }
      }

      // This would query sales data associated with specific staff
      // For now, return mock data
      return { success: true, data: [
        { date: startDate, staff_id: staffId, sales_amount: 5000 },
        { date: endDate, staff_id: staffId, sales_amount: 6000 }
      ]}
    } catch (error) {
      console.error('Error fetching staff sales:', error)
      return { success: false, error: error.message }
    }
  }

  async getPayrollHistory(storeId, startDate, endDate) {
    try {
      if (!supabase) {
        return { success: true, data: [] }
      }

      const { data, error } = await supabase
        .from('payroll_history')
        .select('*')
        .eq('store_id', storeId)
        .gte('pay_period_start', startDate)
        .lte('pay_period_end', endDate)
        .order('pay_period_start', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching payroll history:', error)
      return { success: false, error: error.message }
    }
  }

  async savePayrollRecord(payrollData) {
    try {
      if (!supabase) {
        return { success: true, data: { id: Date.now() } }
      }

      const { data, error } = await supabase
        .from('payroll_history')
        .insert([payrollData])
        .select()

      if (error) throw error

      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Error saving payroll record:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== STORES MANAGEMENT =====
  async getStores() {
    try {
      if (!supabase) {
        // Return mock stores data when Supabase is not configured
        return { success: true, data: [
          { id: 1, name: 'Spartanburg', number: '1' },
          { id: 2, name: 'Greenville', number: '3' },
          { id: 3, name: 'Columbia', number: '4' },
          { id: 4, name: 'Trailer', number: '5' },
          { id: 5, name: 'Camper', number: '7' }
        ]}
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('number')

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching stores:', error)
      return { success: false, error: error.message }
    }
  }

  // Staff Bonus Tiers API functions
  async getStaffBonusTiers(staffId) {
    try {
      console.log('🔍 Getting staff bonus tiers for staffId:', staffId)
      
      const { data, error } = await supabase
        .from('staff_bonus_tiers')
        .select('*')
        .eq('staff_id', staffId)
        .order('sales_target', { ascending: true })

      if (error) {
        console.error('❌ Error fetching staff bonus tiers:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Staff bonus tiers fetched successfully:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Exception in getStaffBonusTiers:', error)
      return { success: false, error: error.message }
    }
  }

  async saveStaffBonusTiers(staffId, tiersData) {
    try {
      console.log('💾 Saving staff bonus tiers for staffId:', staffId, 'tiersData:', tiersData)
      
      // Check if supabase is available
      if (!supabase) {
        console.log('❌ Supabase not available, returning mock success')
        return { success: true, data: tiersData }
      }
      
      // First, delete existing tiers for this staff member
      console.log('🗑️ Deleting existing tiers for staff:', staffId)
      const { error: deleteError } = await supabase
        .from('staff_bonus_tiers')
        .delete()
        .eq('staff_id', staffId)

      if (deleteError) {
        console.error('❌ Error deleting existing staff bonus tiers:', deleteError)
        return { success: false, error: deleteError.message }
      }
      
      console.log('✅ Successfully deleted existing tiers')

      // If no new tiers to save, return success
      if (!tiersData || tiersData.length === 0) {
        console.log('✅ No tiers to save, deletion completed')
        return { success: true, data: [] }
      }

      // Insert new tiers
      console.log('📝 Inserting new tiers:', tiersData)
      const { data, error } = await supabase
        .from('staff_bonus_tiers')
        .insert(tiersData)
        .select()

      if (error) {
        console.error('❌ Error saving staff bonus tiers:', error)
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return { success: false, error: error.message }
      }

      console.log('✅ Staff bonus tiers saved successfully:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Exception in saveStaffBonusTiers:', error)
      return { success: false, error: error.message }
    }
  }

  async calculateStaffBonus(staffId, salesAmount) {
    try {
      console.log('🧮 Calculating staff bonus for staffId:', staffId, 'salesAmount:', salesAmount)
      
      const { data, error } = await supabase
        .from('staff_bonus_tiers')
        .select('*')
        .eq('staff_id', staffId)
        .eq('is_active', true)
        .order('sales_target', { ascending: false })

      if (error) {
        console.error('❌ Error calculating staff bonus:', error)
        return { success: false, error: error.message }
      }

      // Find the applicable bonus tier
      let applicableBonus = 0
      for (const tier of data || []) {
        if (salesAmount >= tier.sales_target) {
          applicableBonus = tier.bonus_amount
          break
        }
      }

      console.log('✅ Staff bonus calculated:', applicableBonus)
      return { success: true, data: applicableBonus }
    } catch (error) {
      console.error('❌ Exception in calculateStaffBonus:', error)
      return { success: false, error: error.message }
    }
  }

  // Pay Calculator API functions
  async getScheduleAssignmentsForDateRange(storeId, startDate, endDate) {
    try {
      console.log('📅 Getting schedule assignments for store:', storeId, 'date range:', startDate, 'to', endDate)
      
      const { data, error } = await supabase
        .from('schedule_assignments')
        .select(`
          *,
          slot:schedule_slots(*)
        `)
        .eq('slot.store_id', storeId)
        .gte('slot.slot_date', startDate)
        .lte('slot.slot_date', endDate)

      if (error) {
        console.error('❌ Error fetching schedule assignments:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Schedule assignments fetched:', data)
      return { success: true, data: data || [] }
    } catch (error) {
      console.error('❌ Exception in getScheduleAssignmentsForDateRange:', error)
      return { success: false, error: error.message }
    }
  }

  async getSalesForDateRange(storeName, startDate, endDate) {
    try {
      console.log('💰 Getting sales for store:', storeName, 'date range:', startDate, 'to', endDate)
      
      // First, let's see what dates are actually in the table
      const { data: allData, error: allError } = await supabase
        .from('trailer_history')
        .select('date, Store, gross_sales')
        .order('date', { ascending: false })
        .limit(5)

      if (allError) {
        console.error('❌ Error fetching sample data:', allError)
      } else {
        console.log('📅 Sample dates from trailer_history:', allData)
      }
      
      // All sales data is stored in trailer_history table
      const { data, error } = await supabase
        .from('trailer_history')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) {
        console.error('❌ Error fetching sales data:', error)
        return { success: false, error: error.message }
      }

      console.log('📊 Raw data for date range:', data?.length || 0, 'records')

      // Filter by store name
      const filteredSales = (data || []).filter(sale => {
        // Map store numbers to names for filtering
        const storeMap = {
          '1': 'Spartanburg',
          '3': 'Greenville', 
          '4': 'Columbia',
          '5': 'Trailer',
          '7': 'Camper'
        }
        const saleStoreName = storeMap[sale.Store] || sale.Store
        return saleStoreName === storeName
      })

      console.log('✅ Sales fetched for store:', storeName, filteredSales)
      return { success: true, data: filteredSales }
    } catch (error) {
      console.error('❌ Exception in getSalesForDateRange:', error)
      return { success: false, error: error.message }
    }
  }

  async savePayrollRecord(payrollData) {
    try {
      console.log('💾 Saving payroll record:', payrollData)
      
      const { data, error } = await supabase
        .from('payroll_records')
        .insert(payrollData)
        .select()

      if (error) {
        console.error('❌ Error saving payroll record:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Payroll record saved:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Exception in savePayrollRecord:', error)
      return { success: false, error: error.message }
    }
  }
}

// Create and export singleton instance
const supabaseAPI = new SupabaseAPI()
export default supabaseAPI 