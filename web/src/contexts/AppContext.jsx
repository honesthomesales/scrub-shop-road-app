import React, { createContext, useContext, useReducer, useEffect } from 'react'
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
  // Messages functionality
  usersData: [],
  messagesData: [],
  messageGroups: [],
  currentUser: null,
  selectedGroup: null
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
  // Messages functionality
  SET_USERS_DATA: 'SET_USERS_DATA',
  SET_MESSAGES_DATA: 'SET_MESSAGES_DATA',
  SET_MESSAGE_GROUPS: 'SET_MESSAGE_GROUPS',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SET_SELECTED_GROUP: 'SET_SELECTED_GROUP'
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
      return {
        ...state,
        salesData: state.salesData.map(entry => 
          entry.id === action.payload.id ? action.payload : entry
        )
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
    
    // Messages functionality
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
    
    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messagesData: [action.payload, ...state.messagesData]
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
    
    default:
      return state
  }
}

// Create context
const AppContext = createContext()

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // ===== MESSAGES FUNCTIONALITY =====

  // Load team data (users and groups)
  const loadTeamData = async () => {
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
  }

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load data when sheet changes
  useEffect(() => {
    loadSalesData()
  }, [state.currentSheet])

  const loadInitialData = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true })
    
    try {
      const isInitialized = await supabaseAPI.init()
      dispatch({ type: ACTIONS.SET_AUTHENTICATED, payload: isInitialized })
      
      if (isInitialized) {
        await Promise.all([
          loadSalesData(),
          loadVenuesData(),
          loadStaffData()
        ])
        
        // Load team data separately (non-critical)
        loadTeamData()
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const loadSalesData = async () => {
    try {
      const tableName = state.currentSheet === 'TRAILER_HISTORY' ? 'trailer_history' : 'camper_history'
      const result = await supabaseAPI.readTable(tableName)
      if (result.success) {
        const transformedData = result.data.map(row => 
          transformSalesData(row, state.currentSheet)
        )
        dispatch({ type: ACTIONS.SET_SALES_DATA, payload: transformedData })
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: result.error })
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const loadVenuesData = async () => {
    try {
      console.log('[loadVenuesData] Fetching venues from backend...');
      const result = await supabaseAPI.readTable('venues')
      console.log('[loadVenuesData] Raw API result:', result);
      if (result.success) {
        console.log('[loadVenuesData] Venue rows from API:', result.data);
        const transformedData = result.data.map(row => {
          const transformed = transformVenueData(row);
          console.log('[loadVenuesData] Transforming row:', row, '=>', transformed);
          return transformed;
        });
        console.log('[loadVenuesData] Transformed venuesData:', transformedData);
        dispatch({ type: ACTIONS.SET_VENUES_DATA, payload: transformedData })
      } else {
        console.error('[loadVenuesData] API error:', result.error);
        dispatch({ type: ACTIONS.SET_ERROR, payload: result.error })
      }
    } catch (error) {
      console.error('[loadVenuesData] Exception:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const loadStaffData = async () => {
    try {
      const result = await supabaseAPI.readTable('staff')
      if (result.success) {
        const transformedData = result.data.map(row => transformStaffData(row))
        dispatch({ type: ACTIONS.SET_STAFF_DATA, payload: transformedData })
      } else {
        // If staff table doesn't exist, create default staff data
        const defaultStaff = [
          { id: 1, name: 'John Smith', email: 'john@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' },
          { id: 2, name: 'Jane Doe', email: 'jane@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' },
          { id: 3, name: 'Mike Johnson', email: 'mike@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' }
        ]
        dispatch({ type: ACTIONS.SET_STAFF_DATA, payload: defaultStaff })
      }
    } catch (error) {
      const defaultStaff = [
        { id: 1, name: 'John Smith', email: 'john@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' },
        { id: 2, name: 'Jane Doe', email: 'jane@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' },
        { id: 3, name: 'Mike Johnson', email: 'mike@scrubshop.com', phone: '', role: 'Worker', status: 'Active', hireDate: '', notes: '' }
      ]
      dispatch({ type: ACTIONS.SET_STAFF_DATA, payload: defaultStaff })
    }
  }

  const setCurrentSheet = (sheet) => {
    dispatch({ type: ACTIONS.SET_CURRENT_SHEET, payload: sheet })
  }

  const addSalesEntry = async (entryData) => {
    try {
      const tableName = state.currentSheet === 'TRAILER_HISTORY' ? 'trailer_history' : 'camper_history'
      // Transform sales data to the correct format for Google Sheets
      const sheetData = transformSalesData(entryData, state.currentSheet)
      const result = await supabaseAPI.addRow(tableName, sheetData)
      
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
      const tableName = state.currentSheet === 'TRAILER_HISTORY' ? 'trailer_history' : 'camper_history'
      const result = await supabaseAPI.updateRow(tableName, entryId, entryData)
      if (result.success) {
        const updatedEntry = { ...entryData, id: entryId }
        dispatch({ type: ACTIONS.UPDATE_SALES_ENTRY, payload: updatedEntry })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
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

  // Get active workers for calendar (filter by status)
  const getActiveWorkers = () => {
    return state.staffData.filter(staff => staff.status === 'Active')
  }

  // ===== MESSAGES FUNCTIONALITY =====

  // Load messages for a group
  const loadMessages = async (groupId) => {
    try {
      const result = await supabaseAPI.getMessages(groupId)
      if (result.success) {
        dispatch({ type: ACTIONS.SET_MESSAGES_DATA, payload: result.data })
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

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

  // Set current user
  const setCurrentUser = (user) => {
    dispatch({ type: ACTIONS.SET_CURRENT_USER, payload: user })
  }

  // Set selected group
  const setSelectedGroup = (group) => {
    dispatch({ type: ACTIONS.SET_SELECTED_GROUP, payload: group })
  }

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
    loadTeamData, // Add new functions to context value
    loadMessages,
    sendMessage,
    setCurrentUser,
    setSelectedGroup
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