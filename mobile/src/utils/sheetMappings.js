// Google Sheets column mappings
export const SHEET_COLUMNS = {
  CAMPER_HISTORY: {
    DATE: 'A',
    STATUS: 'B',
    SALES_TAX: 'C',
    NET_SALES: 'D',
    GROSS_SALES: 'E',
    VENUE_ID: 'F'
  },
  TRAILER_HISTORY: {
    DATE: 'A',
    STATUS: 'B',
    SALES_TAX: 'C',
    NET_SALES: 'D',
    GROSS_SALES: 'E',
    VENUE_ID: 'F'
  },
  VENUES: {
    PROMO: 'A',
    PROMO_TO_SEND: 'B',
    ADDRESS_CITY: 'C',
    CONTACT: 'D',
    PHONE: 'E',
    EMAIL: 'F',
    TIMES: 'G',
    SHOW_INFO: 'H',
    FORECAST_WILL: 'I'
  }
}

// Sheet names
export const SHEET_NAMES = {
  CAMPER_HISTORY: 'Camper_History',
  TRAILER_HISTORY: 'Trailer_History',
  VENUES: 'Venues'
}

// Data transformation functions
export const transformSalesData = (rowData, sheetType) => {
  const columns = SHEET_COLUMNS[sheetType]
  
  return {
    id: rowData.rowId || null,
    date: rowData[columns.DATE] || '',
    status: rowData[columns.STATUS] || '',
    salesTax: parseFloat(rowData[columns.SALES_TAX]) || 0,
    netSales: parseFloat(rowData[columns.NET_SALES]) || 0,
    grossSales: parseFloat(rowData[columns.GROSS_SALES]) || 0,
    venueId: rowData[columns.VENUE_ID] || '',
    sheetType
  }
}

export const transformVenueData = (rowData) => {
  const columns = SHEET_COLUMNS.VENUES
  
  return {
    id: rowData.rowId || null,
    promo: rowData[columns.PROMO] || '',
    promoSend: rowData[columns.PROMO_TO_SEND] || '',
    addressCity: rowData[columns.ADDRESS_CITY] || '',
    contact: rowData[columns.CONTACT] || '',
    phone: rowData[columns.PHONE] || '',
    email: rowData[columns.EMAIL] || '',
    times: rowData[columns.TIMES] || '',
    showInfo: rowData[columns.SHOW_INFO] || '',
    forecastWill: rowData[columns.FORECAST_WILL] || ''
  }
}

export const transformToSheetData = (data, sheetType) => {
  if (sheetType === 'VENUES') {
    const columns = SHEET_COLUMNS.VENUES
    return {
      [columns.PROMO]: data.promo || '',
      [columns.PROMO_TO_SEND]: data.promoSend || '',
      [columns.ADDRESS_CITY]: data.addressCity || '',
      [columns.CONTACT]: data.contact || '',
      [columns.PHONE]: data.phone || '',
      [columns.EMAIL]: data.email || '',
      [columns.TIMES]: data.times || '',
      [columns.SHOW_INFO]: data.showInfo || '',
      [columns.FORECAST_WILL]: data.forecastWill || ''
    }
  } else {
    const columns = SHEET_COLUMNS[sheetType]
    return {
      [columns.DATE]: data.date || '',
      [columns.STATUS]: data.status || '',
      [columns.SALES_TAX]: data.salesTax || 0,
      [columns.NET_SALES]: data.netSales || 0,
      [columns.GROSS_SALES]: data.grossSales || 0,
      [columns.VENUE_ID]: data.venueId || ''
    }
  }
}

// Status options for sales entries
export const SALES_STATUS_OPTIONS = [
  'Confirmed',
  'Pending',
  'Closed',
  'Cancelled',
  'Rescheduled'
]

// Default values for new entries
export const getDefaultSalesEntry = (sheetType) => ({
  date: new Date().toISOString().split('T')[0],
  status: 'Confirmed',
  salesTax: 0,
  netSales: 0,
  grossSales: 0,
  venueId: '',
  sheetType
})

export const getDefaultVenueEntry = () => ({
  promo: '',
  promoSend: '',
  addressCity: '',
  contact: '',
  phone: '',
  email: '',
  times: '',
  showInfo: '',
  forecastWill: ''
}) 