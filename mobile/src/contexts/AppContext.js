import React, { createContext, useContext, useReducer, useEffect } from 'react'

// Initial state
const initialState = {
  currentSheet: 'TRAILER_HISTORY',
  salesData: [],
  venuesData: [],
  loading: false,
  error: null,
  currentMonth: new Date(),
  selectedVenue: null,
  workers: []
}

// Action types
const ACTIONS = {
  SET_CURRENT_SHEET: 'SET_CURRENT_SHEET',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SALES_DATA: 'SET_SALES_DATA',
  SET_VENUES_DATA: 'SET_VENUES_DATA',
  ADD_SALES_ENTRY: 'ADD_SALES_ENTRY',
  UPDATE_SALES_ENTRY: 'UPDATE_SALES_ENTRY',
  DELETE_SALES_ENTRY: 'DELETE_SALES_ENTRY',
  ADD_VENUE_ENTRY: 'ADD_VENUE_ENTRY',
  UPDATE_VENUE_ENTRY: 'UPDATE_VENUE_ENTRY',
  DELETE_VENUE_ENTRY: 'DELETE_VENUE_ENTRY',
  SET_CURRENT_MONTH: 'SET_CURRENT_MONTH',
  SET_SELECTED_VENUE: 'SET_SELECTED_VENUE'
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
    
    default:
      return state
  }
}

// Create context
const AppContext = createContext()

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load initial data - simplified to prevent loading issues
  useEffect(() => {
    // Set loading to false immediately to prevent infinite loading
    dispatch({ type: ACTIONS.SET_LOADING, payload: false })
    
    // Add some mock data for testing
    const mockSalesData = [
      {
        id: '1',
        date: '2024-01-15',
        status: 'Completed',
        grossSales: '1250.00',
        venue: 'Test Venue 1'
      },
      {
        id: '2',
        date: '2024-01-16',
        status: 'Pending',
        grossSales: '980.00',
        venue: 'Test Venue 2'
      }
    ]
    
    const mockVenuesData = [
      {
        id: '1',
        name: 'Test Venue 1',
        location: 'Test Location 1',
        status: 'Active'
      },
      {
        id: '2',
        name: 'Test Venue 2',
        location: 'Test Location 2',
        status: 'Active'
      }
    ]
    
    dispatch({ type: ACTIONS.SET_SALES_DATA, payload: mockSalesData })
    dispatch({ type: ACTIONS.SET_VENUES_DATA, payload: mockVenuesData })
  }, [])

  const setCurrentSheet = (sheetType) => {
    dispatch({ type: ACTIONS.SET_CURRENT_SHEET, payload: sheetType })
  }

  const addSalesEntry = async (entryData) => {
    const newEntry = {
      id: Date.now().toString(),
      ...entryData
    }
    dispatch({ type: ACTIONS.ADD_SALES_ENTRY, payload: newEntry })
    return { success: true }
  }

  const updateSalesEntry = async (entryId, entryData) => {
    const updatedEntry = { ...entryData, id: entryId }
    dispatch({ type: ACTIONS.UPDATE_SALES_ENTRY, payload: updatedEntry })
    return { success: true }
  }

  const deleteSalesEntry = async (entryId) => {
    dispatch({ type: ACTIONS.DELETE_SALES_ENTRY, payload: entryId })
    return { success: true }
  }

  const addVenueEntry = async (venueData) => {
    const newVenue = {
      id: Date.now().toString(),
      ...venueData
    }
    dispatch({ type: ACTIONS.ADD_VENUE_ENTRY, payload: newVenue })
    return { success: true }
  }

  const updateVenueEntry = async (venueId, venueData) => {
    const updatedVenue = { ...venueData, id: venueId }
    dispatch({ type: ACTIONS.UPDATE_VENUE_ENTRY, payload: updatedVenue })
    return { success: true }
  }

  const deleteVenueEntry = async (venueId) => {
    dispatch({ type: ACTIONS.DELETE_VENUE_ENTRY, payload: venueId })
    return { success: true }
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

  const loadSalesData = async () => {
    // Mock implementation
    return { success: true }
  }

  const loadVenuesData = async () => {
    // Mock implementation
    return { success: true }
  }

  const value = {
    ...state,
    setCurrentSheet,
    addSalesEntry,
    updateSalesEntry,
    deleteSalesEntry,
    addVenueEntry,
    updateVenueEntry,
    deleteVenueEntry,
    setCurrentMonth,
    setSelectedVenue,
    clearError,
    loadSalesData,
    loadVenuesData
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