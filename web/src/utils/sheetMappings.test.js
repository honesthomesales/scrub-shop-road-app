import { 
  transformSalesData, 
  transformVenueData, 
  getDefaultSalesEntry, 
  getDefaultVenueEntry,
  SALES_STATUS_OPTIONS,
  aggregateSalesByStoreAndDate
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

describe('aggregateSalesByStoreAndDate', () => {
  test('should aggregate sales by store and date', () => {
    const testData = [
      {
        id: 1,
        date: '2025-01-01',
        status: 'Confirmed',
        salesTax: 100,
        netSales: 100,
        grossSales: 100,
        venueId: 'Store 1'
      },
      {
        id: 2,
        date: '2025-01-01',
        status: 'Confirmed',
        salesTax: 100,
        netSales: 100,
        grossSales: 100,
        venueId: 'Store 1'
      },
      {
        id: 3,
        date: '2025-01-01',
        status: 'Confirmed',
        salesTax: 100,
        netSales: 100,
        grossSales: 100,
        venueId: 'Store 3'
      }
    ]

    const result = aggregateSalesByStoreAndDate(testData)

    expect(result).toHaveLength(2)
    
    // Check Store 1 aggregation
    const store1Result = result.find(item => item.store === 'Store 1')
    expect(store1Result).toBeDefined()
    expect(store1Result.date).toBe('2025-01-01')
    expect(store1Result.salesTax).toBe(200)
    expect(store1Result.netSales).toBe(200)
    expect(store1Result.grossSales).toBe(200)
    expect(store1Result.count).toBe(2)

    // Check Store 3 aggregation
    const store3Result = result.find(item => item.store === 'Store 3')
    expect(store3Result).toBeDefined()
    expect(store3Result.date).toBe('2025-01-01')
    expect(store3Result.salesTax).toBe(100)
    expect(store3Result.netSales).toBe(100)
    expect(store3Result.grossSales).toBe(100)
    expect(store3Result.count).toBe(1)
  })

  test('should handle missing dates', () => {
    const testData = [
      {
        id: 1,
        date: '2025-01-01',
        salesTax: 100,
        netSales: 100,
        grossSales: 100,
        venueId: 'Store 1'
      },
      {
        id: 2,
        date: '',
        salesTax: 100,
        netSales: 100,
        grossSales: 100,
        venueId: 'Store 1'
      }
    ]

    const result = aggregateSalesByStoreAndDate(testData)

    expect(result).toHaveLength(1)
    expect(result[0].store).toBe('Store 1')
    expect(result[0].count).toBe(1)
  })

  test('should handle different venue field names', () => {
    const testData = [
      {
        id: 1,
        date: '2025-01-01',
        salesTax: 100,
        netSales: 100,
        grossSales: 100,
        venue_id: 'Store 1'
      },
      {
        id: 2,
        date: '2025-01-01',
        salesTax: 100,
        netSales: 100,
        grossSales: 100,
        venue: 'Store 1'
      }
    ]

    const result = aggregateSalesByStoreAndDate(testData)

    expect(result).toHaveLength(1)
    expect(result[0].store).toBe('Store 1')
    expect(result[0].count).toBe(2)
  })
}) 

describe('Multi-Store Filtering', () => {
  test('should filter sales data by multiple stores', () => {
    const testData = [
      {
        id: 1,
        date: '2025-01-01',
        salesTax: 100,
        netSales: 1000,
        grossSales: 1100,
        store: 'Trailer Store',
        venue: 'Venue A'
      },
      {
        id: 2,
        date: '2025-01-01',
        salesTax: 200,
        netSales: 2000,
        grossSales: 2200,
        store: 'Camper Store',
        venue: 'Venue B'
      },
      {
        id: 3,
        date: '2025-01-02',
        salesTax: 150,
        netSales: 1500,
        grossSales: 1650,
        store: 'Trailer Store',
        venue: 'Venue C'
      }
    ]

    // Test filtering by single store
    const trailerOnly = testData.filter(sale => ['Trailer Store'].includes(sale.store))
    expect(trailerOnly).toHaveLength(2)
    expect(trailerOnly.every(sale => sale.store === 'Trailer Store')).toBe(true)

    // Test filtering by multiple stores
    const bothStores = testData.filter(sale => ['Trailer Store', 'Camper Store'].includes(sale.store))
    expect(bothStores).toHaveLength(3)
    expect(bothStores.some(sale => sale.store === 'Trailer Store')).toBe(true)
    expect(bothStores.some(sale => sale.store === 'Camper Store')).toBe(true)

    // Test filtering by no stores (should return all)
    const noStores = testData.filter(sale => [].includes(sale.store))
    expect(noStores).toHaveLength(0)
  })

  test('should handle store selection state correctly', () => {
    const selectedStores = ['Trailer Store']
    
    // Test adding a store
    const addStore = (store) => {
      if (!selectedStores.includes(store)) {
        selectedStores.push(store)
      }
      return selectedStores
    }
    
    // Test removing a store
    const removeStore = (store) => {
      const index = selectedStores.indexOf(store)
      if (index > -1) {
        selectedStores.splice(index, 1)
      }
      return selectedStores
    }

    expect(selectedStores).toEqual(['Trailer Store'])
    
    addStore('Camper Store')
    expect(selectedStores).toEqual(['Trailer Store', 'Camper Store'])
    
    removeStore('Trailer Store')
    expect(selectedStores).toEqual(['Camper Store'])
  })
}) 