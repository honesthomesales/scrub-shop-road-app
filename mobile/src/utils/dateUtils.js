import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

export const formatDate = (date, formatString = 'MM/dd/yy') => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
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
    return parseISO(dateString)
  } catch {
    return null
  }
}

export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date)
} 