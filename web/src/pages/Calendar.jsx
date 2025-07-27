import React from 'react'
import { useApp } from '../contexts/AppContext'
import CalendarView from '../components/CalendarView'

const Calendar = () => {
  const { currentSheet, loading } = useApp()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 print-calendar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 print-header">
          <h1 className="text-3xl font-bold text-secondary-900">
            Calendar
          </h1>
          <p className="mt-2 text-secondary-600">
            Schedule and manage events, venues, and worker assignments for Trailer and Camper operations
          </p>
        </div>

        {/* Calendar View */}
        <CalendarView />
      </div>
    </div>
  )
}

export default Calendar 