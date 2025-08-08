import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, Plus, Trash2, Save, X } from 'lucide-react'
import supabaseAPI from '../services/supabaseAPI'

const HolidayManager = ({ storeId, storeName, onSave, onCancel }) => {
  const [holidays, setHolidays] = useState([])
  const [newHoliday, setNewHoliday] = useState({
    date: '',
    name: '',
    isClosed: true
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Auto-save function
  const autoSave = useCallback(async (holidaysData) => {
    if (!holidaysData || holidaysData.length === 0) return
    
    try {
      // Filter out temporary entries (negative IDs) and only save valid entries
      const validHolidays = holidaysData
        .filter(holiday => holiday.date && holiday.name && holiday.id !== undefined)
        .map(holiday => ({
          id: holiday.id > 0 ? holiday.id : null, // Use null for new entries (negative IDs)
          store_id: holiday.store_id,
          holiday_date: holiday.date, // Map date to holiday_date for database
          holiday_name: holiday.name, // Map name to holiday_name for database
          is_closed: holiday.is_closed
        }))
      
      const result = await supabaseAPI.saveStoreHolidays(storeId, validHolidays)
      if (result.success) {
        // Reload data from database to get the real IDs
        const reloadResult = await supabaseAPI.getStoreHolidays(storeId)
        if (reloadResult.success) {
          // Map database field names to UI field names
          const mappedHolidays = (reloadResult.data || []).map(holiday => ({
            id: holiday.id,
            store_id: holiday.store_id,
            date: holiday.holiday_date, // Map holiday_date to date for UI
            name: holiday.holiday_name, // Map holiday_name to name for UI
            is_closed: holiday.is_closed
          }))
          setHolidays(mappedHolidays)
        }
        
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        console.log('Auto-saved holidays successfully')
      } else {
        console.error('Auto-save failed:', result.error)
      }
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }, [storeId])

  // Load holidays from database
  useEffect(() => {
    const loadHolidays = async () => {
      setLoadingData(true)
      try {
        const result = await supabaseAPI.getStoreHolidays(storeId)
        if (result.success) {
          // Map database field names to UI field names
          const mappedHolidays = (result.data || []).map(holiday => ({
            id: holiday.id,
            store_id: holiday.store_id,
            date: holiday.holiday_date, // Map holiday_date to date for UI
            name: holiday.holiday_name, // Map holiday_name to name for UI
            is_closed: holiday.is_closed
          }))
          setHolidays(mappedHolidays)
          setLastSaved(new Date())
          setHasUnsavedChanges(false)
        } else {
          console.error('Error loading holidays:', result.error)
        }
      } catch (error) {
        console.error('Error loading holidays:', error)
      } finally {
        setLoadingData(false)
      }
    }

    if (storeId) {
      loadHolidays()
    }
  }, [storeId])

  // Auto-save when holidays changes (with debounce)
  useEffect(() => {
    if (holidays.length > 0 && hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        autoSave(holidays)
      }, 2000) // Auto-save after 2 seconds of no changes

      return () => clearTimeout(timeoutId)
    }
  }, [holidays, hasUnsavedChanges, autoSave])

  // Common holidays for quick add
  const commonHolidays = [
    { name: 'New Year\'s Day', date: '01-01' },
    { name: 'Memorial Day', date: '05-30' },
    { name: 'Independence Day', date: '07-04' },
    { name: 'Labor Day', date: '09-05' },
    { name: 'Thanksgiving', date: '11-24' },
    { name: 'Christmas Day', date: '12-25' }
  ]

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert('Please enter both date and holiday name')
      return
    }

    const holiday = {
      id: -Date.now(), // Use negative ID for temporary entries (not saved to DB yet)
      store_id: storeId,
      holiday_date: newHoliday.date, // Use correct database column name
      holiday_name: newHoliday.name, // Use correct database column name
      is_closed: newHoliday.isClosed
    }

    setHolidays(prev => [...prev, holiday])
    setNewHoliday({ date: '', name: '', isClosed: true })
    setHasUnsavedChanges(true)
  }

  const removeHoliday = (holidayId) => {
    setHolidays(prev => prev.filter(h => h.id !== holidayId))
    setHasUnsavedChanges(true)
  }

  const addCommonHoliday = (holiday) => {
    const currentYear = new Date().getFullYear()
    const date = `${currentYear}-${holiday.date}`
    
    const newHoliday = {
      id: -Date.now(), // Use negative ID for temporary entries (not saved to DB yet)
      store_id: storeId,
      holiday_date: date, // Use correct database column name
      holiday_name: holiday.name, // Use correct database column name
      is_closed: true
    }

    setHolidays(prev => [...prev, newHoliday])
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await autoSave(holidays)
      if (onSave) {
        await onSave(holidays)
      }
    } catch (error) {
      console.error('Error saving holidays:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Store Holidays - {storeName}
          </h3>
          <p className="text-sm text-gray-600">
            Manage holidays and special closing dates
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

      {/* Add New Holiday */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Holiday</h4>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <input
            type="text"
            placeholder="Holiday name"
            value={newHoliday.name}
            onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is-closed"
              checked={newHoliday.isClosed}
              onChange={(e) => setNewHoliday(prev => ({ ...prev, isClosed: e.target.checked }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is-closed" className="text-sm text-gray-700">
              Store Closed
            </label>
          </div>
          <button
            onClick={addHoliday}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>
      </div>

      {/* Common Holidays */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Add Common Holidays</h4>
        <div className="flex flex-wrap gap-2">
          {commonHolidays.map((holiday, index) => (
            <button
              key={index}
              onClick={() => addCommonHoliday(holiday)}
              className="btn-outline btn-sm"
            >
              {holiday.name}
            </button>
          ))}
        </div>
      </div>

      {/* Holidays List */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Current Holidays ({holidays.length})
        </h4>
        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading holidays...</p>
          </div>
        ) : holidays.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No holidays set</p>
        ) : (
          <div className="space-y-2">
            {holidays
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {formatDate(holiday.date)}
                      </span>
                    </div>
                    <span className="text-gray-700">{holiday.name}</span>
                    <span className={holiday.is_closed ? 
                      'text-red-600 bg-red-100 px-2 py-1 rounded text-xs' : 
                      'text-green-600 bg-green-100 px-2 py-1 rounded text-xs'
                    }>
                      {holiday.is_closed ? 'Closed' : 'Open'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeHoliday(holiday.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HolidayManager 