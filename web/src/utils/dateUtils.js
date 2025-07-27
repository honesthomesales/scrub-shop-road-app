import { format, parseISO, addMonths, subMonths } from 'date-fns'

export const formatDate = (date, formatString = 'MM/dd/yy') => {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? parseDateString(date) : date
    
    // Check if the date is valid
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    return format(dateObj, formatString)
  } catch (error) {
    console.warn('Error formatting date:', date, error)
    return 'Invalid Date'
  }
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0)
}



export const getNextMonth = (date) => {
  return addMonths(date, 1)
}

export const getPreviousMonth = (date) => {
  return subMonths(date, 1)
}

export const getMonthName = (date) => {
  return format(date, 'MMMM yyyy')
}

export const getShortMonthName = (date) => {
  return format(date, 'MMM')
}



export const parseDateString = (dateString) => {
  if (!dateString) return null
  
  try {
    // Handle Google Sheets date format "YYYY-MM-DD 0:00:00"
    if (typeof dateString === 'string' && dateString.includes(' 0:00:00')) {
      const datePart = dateString.split(' 0:00:00')[0]
      const date = new Date(datePart + 'T00:00:00')
      if (!isNaN(date.getTime())) {
        return date
      }
    }
    
    // Handle regular ISO format
    const parsed = parseISO(dateString)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
    
    // Handle simple date format "YYYY-MM-DD"
    const simpleDate = new Date(dateString)
    if (!isNaN(simpleDate.getTime())) {
      return simpleDate
    }
    
    return null
  } catch {
    return null
  }
}

export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date)
} 

// Format a JS Date object as yyyy-MM-dd in local time (for input type="date")
export const formatDateInput = (date) => {
  if (!date) return '';
  // If date is a string in ISO format, use the first 10 chars
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD, use as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // If ISO string, use first 10 chars
    if (/^\d{4}-\d{2}-\d{2}T/.test(date)) return date.slice(0, 10);
  }
  const d = typeof date === 'string' ? parseDateString(date) : date;
  if (!d || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
} 

/**
 * Calculate the average of the last 5 gross sales by venue, rounded to the nearest hundred
 * @param {Array} salesData - Array of sales entries
 * @param {Array} venuesData - Array of venue entries
 * @returns {Array} Array of venues with average sales data
 */
export const calculateVenueAverageSales = (salesData, venuesData) => {
  // Calculate average for each venue
  const venueAverages = venuesData.map(venue => {
    // Find sales for this venue by matching venue.promo with sale.venue
    const venueSales = salesData
      .filter(sale => {
        const saleVenueName = sale.venue ? sale.venue.trim().toLowerCase() : null
        const venuePromoName = venue.promo ? venue.promo.trim().toLowerCase() : null
        return saleVenueName && venuePromoName && saleVenueName === venuePromoName && sale.grossSales > 0
      })
      .map(sale => ({
        ...sale,
        date: new Date(sale.date)
      }))
    
    // Sort by date (most recent first) and take last 5
    const recentSales = venueSales
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map(sale => sale.grossSales)
    
    let averageSales = 0
    if (recentSales.length > 0) {
      const sum = recentSales.reduce((acc, sale) => acc + sale, 0)
      averageSales = sum / recentSales.length
      // Round to nearest hundred
      averageSales = Math.round(averageSales / 100) * 100
    }
    
    return {
      ...venue,
      averageSales,
      salesCount: recentSales.length
    }
  })
  
  // Sort by average sales (highest to lowest)
  return venueAverages.sort((a, b) => b.averageSales - a.averageSales)
} 

/**
 * Get the last 5 sales with dates and amounts for a specific venue
 * @param {Array} salesData - Array of sales entries
 * @param {string} venueName - Name of the venue
 * @returns {Array} Array of sales with date and amount
 */
export const getLastFiveSalesForVenue = (salesData, venueName) => {
  const venueSales = salesData
    .filter(sale => {
      // Match venue.promo with sale.venue (which comes from common_venue_name)
      const saleVenueName = sale.venue ? sale.venue.trim().toLowerCase() : null
      const venuePromoName = venueName ? venueName.trim().toLowerCase() : null
      return saleVenueName && venuePromoName && saleVenueName === venuePromoName && sale.grossSales > 0
    })
    .map(sale => ({
      ...sale,
      date: new Date(sale.date)
    }))
    .sort((a, b) => b.date - a.date)
    .slice(0, 5)
    .map(sale => ({
      date: sale.date.toLocaleDateString(),
      amount: sale.grossSales
    }))
  
  return venueSales
} 