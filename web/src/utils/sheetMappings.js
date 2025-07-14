// Data transformation functions for Supabase
export const transformSalesData = (rowData, sheetType) => {
  return {
    id: rowData.id || null,
    date: rowData.date || '',
    status: rowData.status || '',
    salesTax: parseFloat(rowData.sales_tax || 0) || 0,
    netSales: parseFloat(rowData.net_sales || 0) || 0,
    grossSales: parseFloat(rowData.gross_sales || 0) || 0,
    venueId: rowData.common_venue_name || rowData.venue_id || '',
    sheetType
  }
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
    notes: rowData.notes || ''
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
    notes: staff.notes || ''
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
  notes: ''
}) 