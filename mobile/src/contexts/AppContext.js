import React, { createContext, useContext, useReducer, useEffect } from 'react'
import googleSheetsAPI from '../services/googleSheetsAPI'
import { transformSalesData, transformVenueData, SHEET_NAMES } from '../utils/sheetMappings'

// Initial state
const initialState = {
  currentSheet: 'TRAILER_HISTORY', // Default to Trailer_History
  salesData: [],
  venuesData: [],
  loading: false,
  error: null,
  currentMonth: new Date(),
  selectedVenue: null,
  workers: [
    { id: 1, name: 'John Smith', email: 'john@scrubshop.com' },
    { id: 2, name: 'Jane Doe', email: 'jane@scrubshop.com' },
    { id: 3, name: 'Mike Johnson', email: 'mike@scrubshop.com' }
  ]
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
      await googleSheetsAPI.init()
      await Promise.all([
        loadSalesData(),
        loadVenuesData()
      ])
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const loadSalesData = async () => {
    try {
      const sheetName = SHEET_NAMES[state.currentSheet]
      const result = await googleSheetsAPI.readSheet(sheetName)
      
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
      const result = await googleSheetsAPI.readSheet(SHEET_NAMES.VENUES)
      
      if (result.success) {
        const transformedData = result.data.map(row => transformVenueData(row))
        dispatch({ type: ACTIONS.SET_VENUES_DATA, payload: transformedData })
      } else {
        dispatch({ type: ACTIONS.SET_ERROR, payload: result.error })
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const setCurrentSheet = (sheetType) => {
    dispatch({ type: ACTIONS.SET_CURRENT_SHEET, payload: sheetType })
  }

  const addSalesEntry = async (entryData) => {
    try {
      const sheetName = SHEET_NAMES[state.currentSheet]
      const result = await googleSheetsAPI.addRow(sheetName, entryData)
      
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
      const sheetName = SHEET_NAMES[state.currentSheet]
      const result = await googleSheetsAPI.updateRow(sheetName, entryId, entryData)
      
      if (result.success) {
        const updatedEntry = { ...entryData, id: entryId, sheetType: state.currentSheet }
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
      const sheetName = SHEET_NAMES[state.currentSheet]
      const result = await googleSheetsAPI.deleteRow(sheetName, entryId)
      
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
      const result = await googleSheetsAPI.addRow(SHEET_NAMES.VENUES, venueData)
      
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
      const result = await googleSheetsAPI.updateRow(SHEET_NAMES.VENUES, venueId, venueData)
      
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
      const result = await googleSheetsAPI.deleteRow(SHEET_NAMES.VENUES, venueId)
      
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

  const setCurrentMonth = (month) => {
    dispatch({ type: ACTIONS.SET_CURRENT_MONTH, payload: month })
  }

  const setSelectedVenue = (venue) => {
    dispatch({ type: ACTIONS.SET_SELECTED_VENUE, payload: venue })
  }

  const clearError = () => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null })
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