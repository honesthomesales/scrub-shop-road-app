// Mock Google Sheets API for testing
class MockGoogleSheetsAPI {
  constructor() {
    this.isAuthenticated = true;
    this.accessToken = 'mock-token';
  }

  async init() {
    return true;
  }

  async authenticate() {
    return true;
  }

  async readSheet(sheetName) {
    // Return mock data
    const mockData = {
      TRAILER_HISTORY: [
        {
          'Date': '2025-07-01',
          'Status': 'Confirmed',
          'Sales Tax': '10.50',
          'Net Sales': '100.00',
          'Gross Sales': '110.50',
          'Venue ID': 'VENUE001'
        }
      ],
      CAMPER_HISTORY: [
        {
          'Date': '2025-07-02',
          'Status': 'Pending',
          'Sales Tax': '5.25',
          'Net Sales': '50.00',
          'Gross Sales': '55.25',
          'Venue ID': 'VENUE002'
        }
      ],
      VENUES: [
        {
          'Promo': 'Summer Sale',
          'Promo to Send': 'Yes',
          'Address City': 'New York, NY',
          'Contact': 'John Doe',
          'Phone': '555-1234',
          'Email': 'john@example.com',
          'Times': '9AM-5PM',
          'Show Info': 'Outdoor event',
          'Forecast Will': 'High'
        }
      ]
    };
    
    return {
      success: true,
      data: mockData[sheetName] || []
    };
  }

  async writeSheet() {
    return { success: true };
  }

  async addRow() {
    return { success: true };
  }

  async updateRow() {
    return { success: true };
  }

  async deleteRow() {
    return { success: true };
  }
}

export default new MockGoogleSheetsAPI(); 