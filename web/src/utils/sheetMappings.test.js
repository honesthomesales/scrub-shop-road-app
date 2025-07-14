import { 
  transformSalesData, 
  transformVenueData, 
  getDefaultSalesEntry, 
  getDefaultVenueEntry,
  SALES_STATUS_OPTIONS 
} from './sheetMappings';

describe('sheetMappings', () => {
  describe('transformSalesData', () => {
    it('transforms sales data with proper field mapping', () => {
      const mockRowData = {
        'Date': '2025-07-01',
        'Status': 'Confirmed',
        'Sales Tax': '10.50',
        'Net Sales': '100.00',
        'Gross Sales': '110.50',
        'Venue ID': 'VENUE001'
      };

      const result = transformSalesData(mockRowData, 'TRAILER_HISTORY');

      expect(result).toEqual({
        id: null,
        date: '2025-07-01',
        status: 'Confirmed',
        salesTax: 10.50,
        netSales: 100.00,
        grossSales: 110.50,
        venueId: 'VENUE001',
        sheetType: 'TRAILER_HISTORY'
      });
    });

    it('handles missing data with defaults', () => {
      const mockRowData = {};

      const result = transformSalesData(mockRowData, 'CAMPER_HISTORY');

      expect(result).toEqual({
        id: null,
        date: '',
        status: '',
        salesTax: 0,
        netSales: 0,
        grossSales: 0,
        venueId: '',
        sheetType: 'CAMPER_HISTORY'
      });
    });

    it('handles different case variations in field names', () => {
      const mockRowData = {
        'date': '2025-07-01',
        'STATUS': 'Pending',
        'salesTax': '5.25',
        'NET_SALES': '50.00',
        'grossSales': '55.25',
        'Venue': 'VENUE002'
      };

      const result = transformSalesData(mockRowData, 'TRAILER_HISTORY');

      expect(result.date).toBe('2025-07-01');
      expect(result.status).toBe('Pending');
      expect(result.salesTax).toBe(5.25);
      expect(result.netSales).toBe(50.00);
      expect(result.grossSales).toBe(55.25);
      expect(result.venueId).toBe('VENUE002');
    });
  });

  describe('transformVenueData', () => {
    it('transforms venue data with proper field mapping', () => {
      const mockRowData = {
        'Promo': 'Summer Sale',
        'Promo to Send': 'Yes',
        'Address City': 'New York, NY',
        'Contact': 'John Doe',
        'Phone': '555-1234',
        'Email': 'john@example.com',
        'Times': '9AM-5PM',
        'Show Info': 'Outdoor event',
        'Forecast Will': 'High'
      };

      const result = transformVenueData(mockRowData);

      expect(result).toEqual({
        id: null,
        promo: 'Summer Sale',
        promoSend: 'Yes',
        addressCity: 'New York, NY',
        contact: 'John Doe',
        phone: '555-1234',
        email: 'john@example.com',
        times: '9AM-5PM',
        showInfo: 'Outdoor event',
        forecastWill: 'High'
      });
    });
  });

  describe('getDefaultSalesEntry', () => {
    it('returns default sales entry with current date', () => {
      const result = getDefaultSalesEntry('TRAILER_HISTORY');
      
      expect(result.status).toBe('Confirmed');
      expect(result.salesTax).toBe(0);
      expect(result.netSales).toBe(0);
      expect(result.grossSales).toBe(0);
      expect(result.venueId).toBe('');
      expect(result.sheetType).toBe('TRAILER_HISTORY');
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date format
    });
  });

  describe('getDefaultVenueEntry', () => {
    it('returns default venue entry with empty fields', () => {
      const result = getDefaultVenueEntry();
      
      expect(result.promo).toBe('');
      expect(result.promoSend).toBe('');
      expect(result.addressCity).toBe('');
      expect(result.contact).toBe('');
      expect(result.phone).toBe('');
      expect(result.email).toBe('');
      expect(result.times).toBe('');
      expect(result.showInfo).toBe('');
      expect(result.forecastWill).toBe('');
    });
  });

  describe('SALES_STATUS_OPTIONS', () => {
    it('contains expected status options', () => {
      expect(SALES_STATUS_OPTIONS).toContain('Confirmed');
      expect(SALES_STATUS_OPTIONS).toContain('Pending');
      expect(SALES_STATUS_OPTIONS).toContain('Closed');
      expect(SALES_STATUS_OPTIONS).toContain('Cancelled');
      expect(SALES_STATUS_OPTIONS).toContain('Rescheduled');
    });
  });
}); 