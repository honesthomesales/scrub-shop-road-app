import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

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

export const getMonthRange = (date) => {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return { start, end }
}

export const getDaysInMonth = (date) => {
  const { start, end } = getMonthRange(date)
  return eachDayOfInterval({ start, end })
}

export const isCurrentMonth = (date) => {
  return isSameMonth(date, new Date())
}

export const isToday = (date) => {
  return isSameDay(date, new Date())
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

export const getDayName = (date) => {
  return format(date, 'EEE')
}

export const getDayNumber = (date) => {
  return format(date, 'd')
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