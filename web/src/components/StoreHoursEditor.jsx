import React, { useState, useEffect, useCallback } from 'react'
import { Clock, Calendar, Save, X } from 'lucide-react'
import supabaseAPI from '../services/supabaseAPI'

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' }
]

const StoreHoursEditor = ({ storeId, storeName, onSave, onCancel }) => {
  const [hours, setHours] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Auto-save function
  const autoSave = useCallback(async (hoursData) => {
    if (!hoursData || Object.keys(hoursData).length === 0) return
    
    try {
      // Transform hours data for database
      const hoursForDB = DAYS_OF_WEEK.map((day, index) => ({
        store_id: parseInt(storeId), // Ensure store_id is integer
        day_of_week: parseInt(index), // Ensure day_of_week is integer (0=Monday, 1=Tuesday, etc.)
        open_time: hoursData[day.key]?.openTime || '09:00',
        close_time: hoursData[day.key]?.closeTime || '17:00',
        is_open: Boolean(hoursData[day.key]?.isOpen || false)
      }))

      const result = await supabaseAPI.saveStoreHours(storeId, hoursForDB)
      if (result.success) {
        // Reload data from database to ensure consistency
        const reloadResult = await supabaseAPI.getStoreHours(storeId)
        if (reloadResult.success) {
          const hoursData = {}
          DAYS_OF_WEEK.forEach((day, index) => {
            const dayData = reloadResult.data.find(h => parseInt(h.day_of_week) === index)
            hoursData[day.key] = {
              isOpen: dayData?.is_open ?? true,
              openTime: dayData?.open_time || '09:00',
              closeTime: dayData?.close_time || '17:00'
            }
          })
          setHours(hoursData)
        }
        
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        console.log('Auto-saved store hours successfully')
      } else {
        console.error('Auto-save failed:', result.error)
      }
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }, [storeId])

  // Load store hours from database
  useEffect(() => {
    const loadStoreHours = async () => {
      setLoadingData(true)
      try {
        const result = await supabaseAPI.getStoreHours(storeId)
        if (result.success) {
          const hoursData = {}
          DAYS_OF_WEEK.forEach((day, index) => {
            const dayData = result.data.find(h => h.day_of_week === index)
            hoursData[day.key] = {
              isOpen: dayData?.is_open ?? true,
              openTime: dayData?.open_time || '09:00',
              closeTime: dayData?.close_time || '17:00'
            }
          })
          setHours(hoursData)
          setLastSaved(new Date())
          setHasUnsavedChanges(false)
        } else {
          console.error('Error loading store hours:', result.error)
          // Set default hours if loading fails
          const defaultHours = {}
          DAYS_OF_WEEK.forEach(day => {
            defaultHours[day.key] = {
              isOpen: true,
              openTime: '09:00',
              closeTime: '17:00'
            }
          })
          setHours(defaultHours)
        }
      } catch (error) {
        console.error('Error loading store hours:', error)
        // Set default hours if loading fails
        const defaultHours = {}
        DAYS_OF_WEEK.forEach(day => {
          defaultHours[day.key] = {
            isOpen: true,
            openTime: '09:00',
            closeTime: '17:00'
          }
        })
        setHours(defaultHours)
      } finally {
        setLoadingData(false)
      }
    }

    if (storeId) {
      loadStoreHours()
    }
  }, [storeId])

  // Auto-save when hours changes (with debounce)
  useEffect(() => {
    if (Object.keys(hours).length > 0 && hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        autoSave(hours)
      }, 2000) // Auto-save after 2 seconds of no changes

      return () => clearTimeout(timeoutId)
    }
  }, [hours, hasUnsavedChanges, autoSave])

  const handleDayChange = (dayKey, field, value) => {
    setHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await autoSave(hours)
      if (onSave) {
        // Transform hours data for database
        const hoursData = DAYS_OF_WEEK.map((day, index) => ({
          store_id: parseInt(storeId), // Ensure store_id is integer
          day_of_week: parseInt(index), // 0=Monday, 1=Tuesday, etc. (matches database schema)
          open_time: hours[day.key]?.openTime || '09:00',
          close_time: hours[day.key]?.closeTime || '17:00',
          is_open: Boolean(hours[day.key]?.isOpen || false)
        }))
        await onSave(hoursData)
      }
    } catch (error) {
      console.error('Error saving store hours:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToAllDays = (sourceDay) => {
    const sourceHours = hours[sourceDay]
    const newHours = {}
    
    DAYS_OF_WEEK.forEach(day => {
      newHours[day.key] = { ...sourceHours }
    })
    
    setHours(newHours)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Store Hours - {storeName}
          </h3>
          <p className="text-sm text-gray-600">
            Set operating hours for each day of the week
          </p>
          {lastSaved && (
            <p className="text-xs text-gray-500 mt-1">
              Last saved: {lastSaved.toLocaleTimeString()}
              {hasUnsavedChanges && <span className="text-orange-600 ml-2">• Unsaved changes</span>}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="btn-outline btn-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary btn-sm"
          >
            <Save className="w-4 h-4 mr-1" />
            {loading ? 'Saving...' : 'Save Now'}
          </button>
        </div>
      </div>

      {loadingData ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading store hours...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => (
          <div key={day.key} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            {/* Day Label */}
            <div className="w-24 flex-shrink-0">
              <span className="font-medium text-gray-900">{day.label}</span>
            </div>

            {/* Open/Closed Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`${day.key}-open`}
                checked={hours[day.key]?.isOpen || false}
                onChange={(e) => handleDayChange(day.key, 'isOpen', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor={`${day.key}-open`} className="text-sm text-gray-700">
                Open
              </label>
            </div>

            {/* Time Inputs */}
            {hours[day.key]?.isOpen && (
              <>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    value={hours[day.key]?.openTime || '09:00'}
                    onChange={(e) => handleDayChange(day.key, 'openTime', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours[day.key]?.closeTime || '17:00'}
                    onChange={(e) => handleDayChange(day.key, 'closeTime', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Copy to All Days Button */}
                <button
                  onClick={() => copyToAllDays(day.key)}
                  className="text-xs text-primary-600 hover:text-primary-800 underline"
                >
                  Copy to all days
                </button>
              </>
            )}

            {/* Closed Label */}
            {!hours[day.key]?.isOpen && (
              <span className="text-gray-500 text-sm">Closed</span>
            )}
          </div>
        ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
              const newHours = { ...hours }
              weekdays.forEach(day => {
                newHours[day] = { isOpen: true, openTime: '10:00', closeTime: '19:00' }
              })
              setHours(newHours)
            }}
            className="btn-outline btn-sm"
          >
            Set Weekdays 10-7
          </button>
          <button
            onClick={() => {
              const weekend = ['saturday', 'sunday']
              const newHours = { ...hours }
              weekend.forEach(day => {
                newHours[day] = { isOpen: true, openTime: '10:00', closeTime: '18:00' }
              })
              setHours(newHours)
            }}
            className="btn-outline btn-sm"
          >
            Set Weekend 10-6
          </button>
          <button
            onClick={() => {
              const newHours = {}
              DAYS_OF_WEEK.forEach(day => {
                newHours[day.key] = { isOpen: false, openTime: '09:00', closeTime: '17:00' }
              })
              setHours(newHours)
            }}
            className="btn-outline btn-sm"
          >
            Set All Closed
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreHoursEditor 