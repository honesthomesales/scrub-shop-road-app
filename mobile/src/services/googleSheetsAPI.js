// Google Sheets API Service
// Note: This is a mock implementation. In production, you'll need to:
// 1. Set up Google Cloud Console project
// 2. Enable Google Sheets API
// 3. Create OAuth 2.0 credentials
// 4. Implement proper authentication flow

// Mock data for development
const MOCK_DATA = {
  CAMPER_HISTORY: [
    {
      rowId: 1,
      A: '2024-01-15',
      B: 'Confirmed',
      C: 45.00,
      D: 855.00,
      E: 900.00,
      F: 'Venue 1'
    },
    {
      rowId: 2,
      A: '2024-01-20',
      B: 'Closed',
      C: 52.50,
      D: 997.50,
      E: 1050.00,
      F: 'Venue 2'
    }
  ],
  TRAILER_HISTORY: [
    {
      rowId: 1,
      A: '2024-01-10',
      B: 'Confirmed',
      C: 38.00,
      D: 722.00,
      E: 760.00,
      F: 'Venue 3'
    },
    {
      rowId: 2,
      A: '2024-01-25',
      B: 'Pending',
      C: 60.00,
      D: 1140.00,
      E: 1200.00,
      F: 'Venue 1'
    }
  ],
  VENUES: [
    {
      rowId: 1,
      A: 'Summer Festival',
      B: 'Yes',
      C: '123 Main St, City A',
      D: 'John Smith',
      E: '555-123-4567',
      F: 'john@venue.com',
      G: '9 AM - 5 PM',
      H: 'Outdoor event',
      I: 'High'
    },
    {
      rowId: 2,
      A: 'Winter Market',
      B: 'No',
      C: '456 Oak Ave, City B',
      D: 'Jane Doe',
      E: '555-987-6543',
      F: 'jane@venue.com',
      G: '10 AM - 6 PM',
      H: 'Indoor market',
      I: 'Medium'
    }
  ]
}

class GoogleSheetsAPI {
  constructor() {
    this.isAuthenticated = false
    this.accessToken = null
  }

  // Initialize the API
  async init() {
    try {
      // In production, implement OAuth 2.0 flow here
      console.log('Google Sheets API initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize Google Sheets API:', error)
      return false
    }
  }

  // Authenticate user
  async authenticate() {
    try {
      // Mock authentication for development
      this.isAuthenticated = true
      this.accessToken = 'mock-token'
      return true
    } catch (error) {
      console.error('Authentication failed:', error)
      return false
    }
  }

  // Read data from a specific sheet
  async readSheet(sheetName, range = 'A:Z') {
    try {
      if (!this.isAuthenticated) {
        await this.authenticate()
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockData = MOCK_DATA[sheetName] || []
      return {
        success: true,
        data: mockData,
        range: range
      }
    } catch (error) {
      console.error(`Failed to read sheet ${sheetName}:`, error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }

  // Write data to a specific sheet
  async writeSheet(sheetName, data, range = 'A:Z') {
    try {
      if (!this.isAuthenticated) {
        await this.authenticate()
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // In production, this would make a real API call
      console.log(`Writing to ${sheetName}:`, data)
      
      return {
        success: true,
        message: 'Data written successfully'
      }
    } catch (error) {
      console.error(`Failed to write to sheet ${sheetName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Add a new row to a sheet
  async addRow(sheetName, rowData) {
    try {
      if (!this.isAuthenticated) {
        await this.authenticate()
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 400))
      
      const newRow = {
        rowId: Date.now(),
        ...rowData
      }
      
      // Add to mock data
      if (MOCK_DATA[sheetName]) {
        MOCK_DATA[sheetName].push(newRow)
      }
      
      return {
        success: true,
        data: newRow,
        message: 'Row added successfully'
      }
    } catch (error) {
      console.error(`Failed to add row to ${sheetName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Update a specific row
  async updateRow(sheetName, rowId, rowData) {
    try {
      if (!this.isAuthenticated) {
        await this.authenticate()
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Update mock data
      if (MOCK_DATA[sheetName]) {
        const rowIndex = MOCK_DATA[sheetName].findIndex(row => row.rowId === rowId)
        if (rowIndex !== -1) {
          MOCK_DATA[sheetName][rowIndex] = { ...MOCK_DATA[sheetName][rowIndex], ...rowData }
        }
      }
      
      return {
        success: true,
        message: 'Row updated successfully'
      }
    } catch (error) {
      console.error(`Failed to update row in ${sheetName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Delete a specific row
  async deleteRow(sheetName, rowId) {
    try {
      if (!this.isAuthenticated) {
        await this.authenticate()
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Remove from mock data
      if (MOCK_DATA[sheetName]) {
        MOCK_DATA[sheetName] = MOCK_DATA[sheetName].filter(row => row.rowId !== rowId)
      }
      
      return {
        success: true,
        message: 'Row deleted successfully'
      }
    } catch (error) {
      console.error(`Failed to delete row from ${sheetName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get sheet metadata
  async getSheetInfo(sheetName) {
    try {
      if (!this.isAuthenticated) {
        await this.authenticate()
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 200))
      
      return {
        success: true,
        data: {
          title: sheetName,
          rowCount: MOCK_DATA[sheetName]?.length || 0,
          columnCount: 26
        }
      }
    } catch (error) {
      console.error(`Failed to get sheet info for ${sheetName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Search/filter data
  async searchData(sheetName, query, column = null) {
    try {
      if (!this.isAuthenticated) {
        await this.authenticate()
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      let filteredData = MOCK_DATA[sheetName] || []
      
      if (query) {
        filteredData = filteredData.filter(row => {
          if (column) {
            return row[column]?.toString().toLowerCase().includes(query.toLowerCase())
          }
          return Object.values(row).some(value => 
            value?.toString().toLowerCase().includes(query.toLowerCase())
          )
        })
      }
      
      return {
        success: true,
        data: filteredData
      }
    } catch (error) {
      console.error(`Failed to search data in ${sheetName}:`, error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  }
}

// Create and export a singleton instance
const googleSheetsAPI = new GoogleSheetsAPI()
export default googleSheetsAPI 