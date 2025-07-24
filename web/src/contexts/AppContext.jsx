import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import supabaseAPI from '../services/supabaseAPI'
import { transformSalesData, transformVenueData, transformStaffData, staffToDb } from '../utils/sheetMappings'

// Initial state
const initialState = {
  currentSheet: 'TRAILER_HISTORY', // Default to Trailer_History
  salesData: [],
  venuesData: [],
  staffData: [], // Real staff data from Google Sheets
  loading: false,
  error: null,
  currentMonth: new Date(),
  selectedVenue: null,
  isAuthenticated: false,
  // Team Communication & Task Management
  usersData: [],
  messagesData: [],
  messageGroups: [],
  tasksData: [],
  taskComments: [],
  currentUser: null,
  selectedGroup: null,
  selectedTask: null
}

// Action types
const ACTIONS = {
  SET_CURRENT_SHEET: 'SET_CURRENT_SHEET',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SALES_DATA: 'SET_SALES_DATA',
  SET_VENUES_DATA: 'SET_VENUES_DATA',
  SET_STAFF_DATA: 'SET_STAFF_DATA',
  ADD_SALES_ENTRY: 'ADD_SALES_ENTRY',
  UPDATE_SALES_ENTRY: 'UPDATE_SALES_ENTRY',
  DELETE_SALES_ENTRY: 'DELETE_SALES_ENTRY',
  ADD_VENUE_ENTRY: 'ADD_VENUE_ENTRY',
  UPDATE_VENUE_ENTRY: 'UPDATE_VENUE_ENTRY',
  DELETE_VENUE_ENTRY: 'DELETE_VENUE_ENTRY',
  ADD_STAFF_ENTRY: 'ADD_STAFF_ENTRY',
  UPDATE_STAFF_ENTRY: 'UPDATE_STAFF_ENTRY',
  DELETE_STAFF_ENTRY: 'DELETE_STAFF_ENTRY',
  SET_CURRENT_MONTH: 'SET_CURRENT_MONTH',
  SET_SELECTED_VENUE: 'SET_SELECTED_VENUE',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  // Team Communication & Task Management
  SET_USERS_DATA: 'SET_USERS_DATA',
  SET_MESSAGES_DATA: 'SET_MESSAGES_DATA',
  SET_MESSAGE_GROUPS: 'SET_MESSAGE_GROUPS',
  SET_TASKS_DATA: 'SET_TASKS_DATA',
  SET_TASK_COMMENTS: 'SET_TASK_COMMENTS',
  ADD_MESSAGE: 'ADD_MESSAGE',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ADD_TASK_COMMENT: 'ADD_TASK_COMMENT',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SET_SELECTED_GROUP: 'SET_SELECTED_GROUP',
  SET_SELECTED_TASK: 'SET_SELECTED_TASK'
}

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_SHEET:
      return {
        ...state,
        currentSheet: action.payload
      }
    
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    
    case ACTIONS.SET_SALES_DATA:
      return {
        ...state,
        salesData: action.payload,
        loading: false,
        error: null
      }
    
    case ACTIONS.SET_VENUES_DATA:
      return {
        ...state,
        venuesData: action.payload,
        loading: false,
        error: null
      }
    
    case ACTIONS.SET_STAFF_DATA:
      return {
        ...state,
        staffData: action.payload,
        loading: false,
        error: null
      }
    
    case ACTIONS.ADD_SALES_ENTRY:
      return {
        ...state,
        salesData: [...state.salesData, action.payload]
      }
    
    case ACTIONS.UPDATE_SALES_ENTRY:
      console.log('=== REDUCER UPDATE DEBUG ===')
      console.log('Updating entry with ID:', action.payload.id)
      console.log('New entry data:', action.payload)
      console.log('Current sales data length:', state.salesData.length)
      
      const updatedSalesData = state.salesData.map(entry => 
        entry.id === action.payload.id ? action.payload : entry
      )
      
      console.log('Updated sales data length:', updatedSalesData.length)
      console.log('Updated entry in array:', updatedSalesData.find(e => e.id === action.payload.id))
      
      return {
        ...state,
        salesData: updatedSalesData
      }
    
    case ACTIONS.DELETE_SALES_ENTRY:
      return {
        ...state,
        salesData: state.salesData.filter(entry => entry.id !== action.payload)
      }
    
    case ACTIONS.ADD_VENUE_ENTRY:
      return {
        ...state,
        venuesData: [...state.venuesData, action.payload]
      }
    
    case ACTIONS.UPDATE_VENUE_ENTRY:
      return {
        ...state,
        venuesData: state.venuesData.map(venue => 
          venue.id === action.payload.id ? action.payload : venue
        )
      }
    
    case ACTIONS.DELETE_VENUE_ENTRY:
      return {
        ...state,
        venuesData: state.venuesData.filter(venue => venue.id !== action.payload)
      }
    
    case ACTIONS.ADD_STAFF_ENTRY:
      return {
        ...state,
        staffData: [...state.staffData, action.payload]
      }
    
    case ACTIONS.UPDATE_STAFF_ENTRY:
      return {
        ...state,
        staffData: state.staffData.map(staff => 
          staff.id === action.payload.id ? action.payload : staff
        )
      }
    
    case ACTIONS.DELETE_STAFF_ENTRY:
      return {
        ...state,
        staffData: state.staffData.filter(staff => staff.id !== action.payload)
      }
    
    case ACTIONS.SET_CURRENT_MONTH:
      return {
        ...state,
        currentMonth: action.payload
      }
    
    case ACTIONS.SET_SELECTED_VENUE:
      return {
        ...state,
        selectedVenue: action.payload
      }
    
    case ACTIONS.SET_AUTHENTICATED:
      return {
        ...state,
        isAuthenticated: action.payload
      }
    
    // Team Communication & Task Management
    case ACTIONS.SET_USERS_DATA:
      return {
        ...state,
        usersData: action.payload
      }
    
    case ACTIONS.SET_MESSAGES_DATA:
      return {
        ...state,
        messagesData: action.payload
      }
    
    case ACTIONS.SET_MESSAGE_GROUPS:
      return {
        ...state,
        messageGroups: action.payload
      }
    
    case ACTIONS.SET_TASKS_DATA:
      return {
        ...state,
        tasksData: action.payload
      }
    
    case ACTIONS.SET_TASK_COMMENTS:
      return {
        ...state,
        taskComments: action.payload
      }
    
    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messagesData: [action.payload, ...state.messagesData]
      }
    
    case ACTIONS.ADD_TASK:
      return {
        ...state,
        tasksData: [action.payload, ...state.tasksData]
      }
    
    case ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasksData: state.tasksData.map(task => 
          task.id === action.payload.id ? action.payload : task
        )
      }
    
    case ACTIONS.DELETE_TASK:
      return {
        ...state,
        tasksData: state.tasksData.filter(task => task.id !== action.payload)
      }
    
    case ACTIONS.ADD_TASK_COMMENT:
      return {
        ...state,
        taskComments: [...state.taskComments, action.payload]
      }
    
    case ACTIONS.SET_CURRENT_USER:
      return {
        ...state,
        currentUser: action.payload
      }
    
    case ACTIONS.SET_SELECTED_GROUP:
      return {
        ...state,
        selectedGroup: action.payload
      }
    
    case ACTIONS.SET_SELECTED_TASK:
      return {
        ...state,
        selectedTask: action.payload
      }
    
    default:
      return state
  }
}

// Create context
const AppContext = createContext()

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Simplified data loading functions
  const loadSalesData = useCallback(async () => {
    try {
      const tableName = state.currentSheet === 'TRAILER_HISTORY' ? 'trailer_history' : 'camper_history'
      const result = await supabaseAPI.readTable(tableName)
      if (result.success) {
        const transformedData = result.data.map(row => 
          transformSalesData(row, state.currentSheet)
        )
        dispatch({ type: ACTIONS.SET_SALES_DATA, payload: transformedData })
      } else {
        console.error('Failed to load sales data:', result.error)
        dispatch({ type: ACTIONS.SET_ERROR, payload: result.error })
      }
    } catch (error) {
      console.error('Error loading sales data:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }, [state.currentSheet])

  const loadVenuesData = useCallback(async () => {
    try {
      const result = await supabaseAPI.readTable('venues')
      if (result.success) {
        const transformedData = result.data.map(row => transformVenueData(row))
        dispatch({ type: ACTIONS.SET_VENUES_DATA, payload: transformedData })
      } else {
        console.error('Failed to load venues data:', result.error)
        dispatch({ type: ACTIONS.SET_ERROR, payload: result.error })
      }
    } catch (error) {
      console.error('Error loading venues data:', error)
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }, [])

  const loadStaffData = useCallback(async () => {
    try {
      const result = await supabaseAPI.readTable('staff')
      if (result.success) {
        const transformedData = result.data.map(row => transformStaffData(row))
        dispatch({ type: ACTIONS.SET_STAFF_DATA, payload: transformedData })
      } else {
        // Use default staff data if table doesn't exist
        const defaultStaff = [
          { id: 1, name: 'John Smith', email: 'john@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' },
          { id: 2, name: 'Jane Doe', email: 'jane@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' },
          { id: 3, name: 'Mike Johnson', email: 'mike@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' }
        ]
        dispatch({ type: ACTIONS.SET_STAFF_DATA, payload: defaultStaff })
      }
    } catch (error) {
      console.error('Error loading staff data:', error)
      const defaultStaff = [
        { id: 1, name: 'John Smith', email: 'john@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' },
        { id: 2, name: 'Jane Doe', email: 'jane@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' },
        { id: 3, name: 'Mike Johnson', email: 'mike@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' }
      ]
      dispatch({ type: ACTIONS.SET_STAFF_DATA, payload: defaultStaff })
    }
  }, [])

  const loadTeamData = useCallback(async () => {
    try {
      const [usersResult, groupsResult] = await Promise.all([
        supabaseAPI.getUsers(),
        supabaseAPI.getMessageGroups()
      ])

      if (usersResult.success) {
        dispatch({ type: ACTIONS.SET_USERS_DATA, payload: usersResult.data })
      }

      if (groupsResult.success) {
        dispatch({ type: ACTIONS.SET_MESSAGE_GROUPS, payload: groupsResult.data })
      }
    } catch (error) {
      console.error('Failed to load team data:', error)
      // Don't set error for team data - it's non-critical
    }
  }, [])

  const loadMessages = useCallback(async (groupId) => {
    try {
      const result = await supabaseAPI.getMessages(groupId)
      if (result.success) {
        dispatch({ type: ACTIONS.SET_MESSAGES_DATA, payload: result.data })
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    const initializeApp = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })
      
      try {
        const isInitialized = await supabaseAPI.init()
        dispatch({ type: ACTIONS.SET_AUTHENTICATED, payload: isInitialized })
        
        if (isInitialized) {
          // Load critical data first
          await Promise.all([
            loadSalesData(),
            loadVenuesData(),
            loadStaffData()
          ])
          
          // Load team data separately (non-critical)
          loadTeamData().catch(error => {
            console.warn('Team data loading failed:', error)
          })
        }
      } catch (error) {
        console.error('Failed to initialize app:', error)
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false })
      }
    }

    initializeApp()
  }, []) // Empty dependency array - only run once

  // Load data when sheet changes
  useEffect(() => {
    if (state.isAuthenticated) {
      loadSalesData()
    }
  }, [state.currentSheet, loadSalesData])

  const setCurrentSheet = (sheet) => {
    dispatch({ type: ACTIONS.SET_CURRENT_SHEET, payload: sheet })
  }

  const addSalesEntry = async (entryData) => {
    try {
      const tableName = state.currentSheet === 'TRAILER_HISTORY' ? 'trailer_history' : 'camper_history'
      
      // Transform the entry data to match database schema
      const dbData = {
        date: entryData.date,
        status: entryData.status,
        sales_tax: entryData.sales_tax,
        net_sales: entryData.net_sales,
        gross_sales: entryData.gross_sales,
        common_venue_name: entryData.venue_id // Map venue_id to common_venue_name
      }
      
      const result = await supabaseAPI.addRow(tableName, dbData)
      
      if (result.success) {
        const newEntry = transformSalesData(result.data, state.currentSheet)
        dispatch({ type: ACTIONS.ADD_SALES_ENTRY, payload: newEntry })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateSalesEntry = async (entryId, entryData) => {
    try {
      console.log('=== UPDATE SALES ENTRY DEBUG ===')
      console.log('Entry ID:', entryId)
      console.log('Entry Data:', entryData)
      
      const tableName = state.currentSheet === 'TRAILER_HISTORY' ? 'trailer_history' : 'camper_history'
      
      // Transform the entry data to match database schema
      const dbData = {
        date: entryData.date,
        status: entryData.status,
        sales_tax: entryData.sales_tax,
        net_sales: entryData.net_sales,
        gross_sales: entryData.gross_sales,
        common_venue_name: entryData.venue_id // Map venue_id to common_venue_name
      }
      
      console.log('DB Data being sent:', dbData)
      
      const result = await supabaseAPI.updateRow(tableName, entryId, dbData)
      console.log('Update result:', result)
      
      if (result.success) {
        // Use the returned data from the database to ensure consistency
        const updatedEntry = transformSalesData(result.data, state.currentSheet)
        console.log('Transformed updated entry:', updatedEntry)
        dispatch({ type: ACTIONS.UPDATE_SALES_ENTRY, payload: updatedEntry })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Update sales entry error:', error)
      return { success: false, error: error.message }
    }
  }

  const deleteSalesEntry = async (entryId) => {
    try {
      const tableName = state.currentSheet === 'TRAILER_HISTORY' ? 'trailer_history' : 'camper_history'
      const result = await supabaseAPI.deleteRow(tableName, entryId)
      
      if (result.success) {
        dispatch({ type: ACTIONS.DELETE_SALES_ENTRY, payload: entryId })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const addVenueEntry = async (venueData) => {
    try {
      // Transform venue data to the correct format for Google Sheets
      const sheetData = transformVenueData(venueData)
      const result = await supabaseAPI.addRow('venues', sheetData)
      
      if (result.success) {
        const newVenue = transformVenueData(result.data)
        dispatch({ type: ACTIONS.ADD_VENUE_ENTRY, payload: newVenue })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateVenueEntry = async (venueId, venueData) => {
    try {
      // Transform venue data to the correct format for Google Sheets
      const sheetData = transformVenueData(venueData)
      const result = await supabaseAPI.updateRow('venues', venueId, sheetData)
      
      if (result.success) {
        const updatedVenue = { ...venueData, id: venueId }
        dispatch({ type: ACTIONS.UPDATE_VENUE_ENTRY, payload: updatedVenue })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const deleteVenueEntry = async (venueId) => {
    try {
      const result = await supabaseAPI.deleteRow('venues', venueId)
      
      if (result.success) {
        dispatch({ type: ACTIONS.DELETE_VENUE_ENTRY, payload: venueId })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const addStaffEntry = async (staffData) => {
    try {
      // Map staff data to DB format, include id for add
      const sheetData = staffToDb(staffData, true)
      const result = await supabaseAPI.addRow('staff', sheetData)
      if (result.success) {
        const newStaff = transformStaffData(result.data)
        dispatch({ type: ACTIONS.ADD_STAFF_ENTRY, payload: newStaff })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateStaffEntry = async (staffId, staffData) => {
    try {
      // Map staff data to DB format, do not include id for update
      const sheetData = staffToDb(staffData, false)
      const result = await supabaseAPI.updateRow('staff', staffId, sheetData)
      if (result.success) {
        const updatedStaff = { ...staffData, id: staffId }
        dispatch({ type: ACTIONS.UPDATE_STAFF_ENTRY, payload: updatedStaff })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const deleteStaffEntry = async (staffId) => {
    try {
      const result = await supabaseAPI.deleteRow('staff', staffId)
      
      if (result.success) {
        dispatch({ type: ACTIONS.DELETE_STAFF_ENTRY, payload: staffId })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const setCurrentMonth = (month) => {
    dispatch({ type: ACTIONS.SET_CURRENT_MONTH, payload: month })
  }

  const setSelectedVenue = (venue) => {
    dispatch({ type: ACTIONS.SET_SELECTED_VENUE, payload: venue })
  }

  const clearError = () => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null })
  }

  const setIsAuthenticated = (authenticated) => {
    dispatch({ type: ACTIONS.SET_AUTHENTICATED, payload: authenticated })
  }

  const toggleSupabaseConnection = async (connect) => {
    if (connect) {
      // Connect to Supabase
      try {
        const isInitialized = await supabaseAPI.init()
        if (isInitialized) {
          dispatch({ type: ACTIONS.SET_AUTHENTICATED, payload: true })
          // Load data after successful connection
          await Promise.all([
            loadSalesData(),
            loadVenuesData(),
            loadStaffData()
          ])
        } else {
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to connect to Supabase' })
        }
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      }
    } else {
      // Disconnect from Supabase
      dispatch({ type: ACTIONS.SET_AUTHENTICATED, payload: false })
      // Clear data when disconnected
      dispatch({ type: ACTIONS.SET_SALES_DATA, payload: [] })
      dispatch({ type: ACTIONS.SET_VENUES_DATA, payload: [] })
      dispatch({ type: ACTIONS.SET_STAFF_DATA, payload: [] })
    }
  }

  // Get active workers for calendar (filter by status)
  const getActiveWorkers = () => {
    return state.staffData.filter(staff => staff.status === 'Active')
  }

  // ===== TEAM COMMUNICATION & TASK MANAGEMENT FUNCTIONS =====



  // Send a message
  const sendMessage = async (messageData) => {
    try {
      const result = await supabaseAPI.sendMessage(messageData)
      if (result.success) {
        dispatch({ type: ACTIONS.ADD_MESSAGE, payload: result.data })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Load tasks
  const loadTasks = async (assignedTo = null, status = null) => {
    try {
      const result = await supabaseAPI.getTasks(assignedTo, status)
      if (result.success) {
        dispatch({ type: ACTIONS.SET_TASKS_DATA, payload: result.data })
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  // Create a task
  const createTask = async (taskData) => {
    try {
      const result = await supabaseAPI.createTask(taskData)
      if (result.success) {
        dispatch({ type: ACTIONS.ADD_TASK, payload: result.data })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Update a task
  const updateTask = async (taskId, taskData) => {
    try {
      const result = await supabaseAPI.updateTask(taskId, taskData)
      if (result.success) {
        dispatch({ type: ACTIONS.UPDATE_TASK, payload: result.data })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      const result = await supabaseAPI.deleteTask(taskId)
      if (result.success) {
        dispatch({ type: ACTIONS.DELETE_TASK, payload: taskId })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Load task comments
  const loadTaskComments = async (taskId) => {
    try {
      const result = await supabaseAPI.getTaskComments(taskId)
      if (result.success) {
        dispatch({ type: ACTIONS.SET_TASK_COMMENTS, payload: result.data })
      }
    } catch (error) {
      console.error('Failed to load task comments:', error)
    }
  }

  // Add task comment
  const addTaskComment = async (commentData) => {
    try {
      const result = await supabaseAPI.addTaskComment(commentData)
      if (result.success) {
        dispatch({ type: ACTIONS.ADD_TASK_COMMENT, payload: result.data })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Set current user
  const setCurrentUser = useCallback((user) => {
    dispatch({ type: ACTIONS.SET_CURRENT_USER, payload: user })
  }, [])

  // Set selected group
  const setSelectedGroup = useCallback((group) => {
    dispatch({ type: ACTIONS.SET_SELECTED_GROUP, payload: group })
  }, [])

  // Set selected task
  const setSelectedTask = useCallback((task) => {
    dispatch({ type: ACTIONS.SET_SELECTED_TASK, payload: task })
  }, [])

  const value = {
    ...state,
    workers: getActiveWorkers(), // Use real staff data instead of hardcoded workers
    supabaseAPI,
    setCurrentSheet,
    addSalesEntry,
    updateSalesEntry,
    deleteSalesEntry,
    addVenueEntry,
    updateVenueEntry,
    deleteVenueEntry,
    addStaffEntry,
    updateStaffEntry,
    deleteStaffEntry,
    setCurrentMonth,
    setSelectedVenue,
    clearError,
    loadSalesData,
    loadVenuesData,
    loadStaffData,
    setIsAuthenticated,
    toggleSupabaseConnection,
    // Team Communication & Task Management
    loadTeamData,
    loadMessages,
    sendMessage,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    loadTaskComments,
    addTaskComment,
    setCurrentUser,
    setSelectedGroup,
    setSelectedTask
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
} 