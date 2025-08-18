// Data transformation functions for Supabase
export const transformSalesData = (rowData, sheetType) => {
  // Map store numbers to store names
  const getStoreName = (storeNumber) => {
    const storeMap = {
      '1': 'Spartanburg',
      '3': 'Greenville', 
      '4': 'Columbia',
      '5': 'Trailer',
      '7': 'Camper'
    }
    return storeMap[storeNumber] || `Store ${storeNumber}`
  }

  // Get the store value from the database and map it to a name
  const rawStore = rowData.Store || rowData.store || null
  const storeName = rawStore ? getStoreName(String(rawStore)) : (sheetType === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper')

  const transformed = {
    id: rowData.id || null,
    date: rowData.date || '',
    status: rowData.status || '',
    salesTax: parseFloat(rowData.sales_tax || 0) || 0,
    netSales: parseFloat(rowData.net_sales || 0) || 0,
    grossSales: parseFloat(rowData.gross_sales || 0) || 0,
    // Store is where we're selling FROM - use the mapped store name
    store: storeName,
    // Venue is where we're selling AT (the place name)
    venue: rowData.common_venue_name || rowData.venue_name || '',
    sheetType
  }

  return transformed
}

// Aggregate sales data by store and date (store = where we're selling FROM)
export const aggregateSalesByStoreAndDate = (salesData) => {
  const aggregated = {}
  
  salesData.forEach((sale, index) => {
    // Use store (where we're selling FROM) for aggregation
    const store = String(sale.store || 'Unknown Store')
    const date = sale.date || ''
    
    if (!date) {
      return // Skip entries without dates
    }
    
    // Skip entries with $0 or negative sales
    const salesTax = parseFloat(sale.salesTax || 0) || 0
    const netSales = parseFloat(sale.netSales || 0) || 0
    const grossSales = parseFloat(sale.grossSales || 0) || 0
    
    if (netSales <= 0 || grossSales <= 0) {
      return // Skip entries with invalid sales amounts
    }
    
    // Normalize date to YYYY-MM-DD format for proper aggregation
    let normalizedDate = date
    if (date.includes(' ')) {
      // Handle datetime format like "2022-01-28 05:00:00+00"
      normalizedDate = date.split(' ')[0]
    }
    
    const key = `${store}_${normalizedDate}`
    
    if (!aggregated[key]) {
      aggregated[key] = {
        store: store,
        venue: sale.venue || '', // Keep venue field for reference
        date: normalizedDate,
        salesTax: 0,
        netSales: 0,
        grossSales: 0,
        count: 0
      }
    }
    
    // Sum the numeric fields (we already validated they're > 0)
    aggregated[key].salesTax += salesTax
    aggregated[key].netSales += netSales
    aggregated[key].grossSales += grossSales
    aggregated[key].count += 1
  })
  
  // Convert back to array and sort by date, then store
  const result = Object.values(aggregated).sort((a, b) => {
    // First sort by date
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB
    }
    // Then sort by store name
    return String(a.store).localeCompare(String(b.store))
  })
  
  return result
}

export const transformVenueData = (rowData) => {
  return {
    id: rowData.id || null,
    promo: rowData.promo || '',
    promoSend: rowData.promo_to_send || '',
    addressCity: rowData.address_city || '',
    contact: rowData.contact || '',
    phone: rowData.phone || '',
    email: rowData.email || '',
    times: rowData.times || '',
    showInfo: rowData.show_info || '',
    forecastWill: rowData.forecast || ''
  }
}

export const transformStaffData = (rowData) => {
  return {
    id: rowData.id || null,
    name: rowData.name || '',
    email: rowData.email || '',
    phone: rowData.phone || '',
    role: rowData.role || 'Worker',
    status: rowData.status || 'Active',
    hireDate: rowData.hire_date || '',
    notes: rowData.notes || '',
    store_id: rowData.store_id || null,
    // Pay structure fields
    payType: rowData.pay_type || 'hourly',
    hourlyRate: parseFloat(rowData.hourly_rate || 0) || 0,
    salaryAmount: parseFloat(rowData.salary_amount || 0) || 0,
    preferredHoursPerWeek: parseFloat(rowData.preferred_hours_per_week || 0) || 0,
    maxHoursPerWeek: parseFloat(rowData.max_hours_per_week || 0) || 0
  }
}

// Add this function for DB writes
export const staffToDb = (staff, includeId = false) => {
  const obj = {
    name: staff.name || '',
    email: staff.email || '',
    phone: staff.phone || '',
    role: staff.role || 'Worker',
    status: staff.status || 'Active',
    hire_date: staff.hireDate || '',
    notes: staff.notes || '',
    store_id: staff.store_id || null,
    // Pay structure fields
    pay_type: staff.payType || 'hourly',
    hourly_rate: parseFloat(staff.hourlyRate || 0) || 0,
    salary_amount: parseFloat(staff.salaryAmount || 0) || 0,
    preferred_hours_per_week: parseFloat(staff.preferredHoursPerWeek || 0) || 0,
    max_hours_per_week: parseFloat(staff.maxHoursPerWeek || 0) || 0
  };
  if (includeId && staff.id) obj.id = staff.id;
  return obj;
};

// Status options for sales entries
export const SALES_STATUS_OPTIONS = [
  'Confirmed',
  'Pending',
  'Closed',
  'Cancelled',
  'Rescheduled'
]

// Role options for staff
export const STAFF_ROLE_OPTIONS = [
  'Manager',
  'Worker',
  'Driver',
  'Sales',
  'Support'
]

// Status options for staff
export const STAFF_STATUS_OPTIONS = [
  'Active',
  'Inactive',
  'On Leave',
  'Terminated'
]

// Pay type options for staff
export const STAFF_PAY_TYPE_OPTIONS = [
  'hourly',
  'salary',
  'salary+bonus'
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

export const getDefaultStaffEntry = () => ({
  name: '',
  email: '',
  phone: '',
  role: 'Worker',
  status: 'Active',
  hireDate: new Date().toISOString().split('T')[0],
  notes: '',
  store_id: null,
  // Pay structure defaults
  payType: 'hourly',
  hourlyRate: 0,
  salaryAmount: 0,
  preferredHoursPerWeek: 0,
  maxHoursPerWeek: 0
}) 