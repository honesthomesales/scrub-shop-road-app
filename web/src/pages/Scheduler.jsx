import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Settings, MapPin, Zap, ArrowLeft, Plus, Trash2, Edit } from 'lucide-react'
import StoreHoursEditor from '../components/StoreHoursEditor'
import WeeklyCalendar from '../components/WeeklyCalendar'
import AutoScheduler from '../components/AutoScheduler'
import supabaseAPI from '../services/supabaseAPI'
import { useApp } from '../contexts/AppContext'

const Scheduler = () => {
  const { staffData } = useApp()
  const [activeView, setActiveView] = useState('main')
  const [selectedStore, setSelectedStore] = useState(null)
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredStore, setHoveredStore] = useState(null)

  // Fetch stores from database
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const result = await supabaseAPI.getStores()
        if (result.success) {
          console.log('📊 Loaded stores:', result.data)
          setStores(result.data)
        } else {
          console.error('Error fetching stores:', result.error)
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [])

  const handleStoreAction = (action, store) => {
    setSelectedStore(store)
    setActiveView(action)
  }

  const handleBackToMain = () => {
    setActiveView('main')
    setSelectedStore(null)
  }

  const handleSaveStoreHours = async (hoursData) => {
    try {
      const result = await supabaseAPI.saveStoreHours(selectedStore.id, hoursData)
      if (result.success) {
        alert('Store hours saved successfully!')
        handleBackToMain()
      } else {
        alert(`Error saving store hours: ${result.error}`)
      }
    } catch (error) {
      alert(`Error saving store hours: ${error.message}`)
    }
  }

  const handleSaveAutoSchedule = async (schedulesData) => {
    try {
      const savePromises = schedulesData.map(schedule => 
        supabaseAPI.saveScheduleAssignment(schedule)
      )
      
      const results = await Promise.all(savePromises)
      const failedSaves = results.filter(result => !result.success)
      
      if (failedSaves.length === 0) {
        alert('Auto-generated schedule saved successfully!')
        handleBackToMain()
      } else {
        alert(`Error saving some schedules: ${failedSaves.length} failed out of ${schedulesData.length}`)
      }
    } catch (error) {
      alert(`Error saving auto schedule: ${error.message}`)
    }
  }

  // Store Hours View
  if (activeView === 'store-hours' && selectedStore) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={handleBackToMain}
            className="text-primary-600 hover:text-primary-800 mb-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scheduler
          </button>
        </div>
        <StoreHoursEditor
          storeId={selectedStore.id}
          storeName={selectedStore.name}
          onSave={handleSaveStoreHours}
          onCancel={handleBackToMain}
        />
      </div>
    )
  }

  // Schedule View
  if (activeView === 'schedule' && selectedStore) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={handleBackToMain}
            className="text-primary-600 hover:text-primary-800 mb-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scheduler
          </button>
        </div>
        <WeeklyCalendar
          storeId={selectedStore.id}
          storeName={selectedStore.name}
          staffData={staffData}
        />
      </div>
    )
  }

  // Auto Scheduler View
  if (activeView === 'auto-scheduler' && selectedStore) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={handleBackToMain}
            className="text-primary-600 hover:text-primary-800 mb-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scheduler
          </button>
        </div>
        <AutoScheduler
          storeId={selectedStore.id}
          storeName={selectedStore.name}
          staffData={staffData}
          storeHours={[]}
          onSave={handleSaveAutoSchedule}
          onCancel={handleBackToMain}
        />
      </div>
    )
  }

  // Holiday Manager View
  if (activeView === 'holiday-manager') {
    return <HolidayManagerView onBack={handleBackToMain} />
  }

  // Main View (Store List with Hover Actions)
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scheduler</h1>
          <p className="mt-2 text-gray-600">Loading stores...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded mr-4"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scheduler</h1>
        <p className="mt-2 text-gray-600">
          Hover over a store to see available scheduling actions
        </p>
      </div>

      {/* Global Management Options */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-1 gap-6">
        <div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setActiveView('holiday-manager')}
        >
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Holiday Manager</h3>
              <p className="text-gray-600">Manage holidays for all stores</p>
              <p className="text-sm text-green-600 mt-1">Click to manage →</p>
            </div>
          </div>
        </div>
      </div>

      {/* Store List with Hover Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div 
            key={store.id} 
            className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
            onMouseEnter={() => setHoveredStore(store.id)}
            onMouseLeave={() => setHoveredStore(null)}
          >
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{store.name}</h3>
                <p className="text-gray-600">Store #{store.number}</p>
              </div>
            </div>
            
            {/* Hover Actions */}
            {hoveredStore === store.id && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-95 rounded-lg p-4 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleStoreAction('store-hours', store)}
                    className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Manage Hours
                  </button>
                  <button
                    onClick={() => handleStoreAction('schedule', store)}
                    className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Weekly Calendar
                  </button>
                  {store.name !== 'Camper' && store.name !== 'Trailer' && (
                    <button
                      onClick={() => handleStoreAction('auto-scheduler', store)}
                      className="flex items-center justify-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-gray-700 hover:text-blue-600 col-span-2"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Auto Schedule
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Holiday Manager Component
const HolidayManagerView = ({ onBack }) => {
  const [stores, setStores] = useState([])
  const [holidays, setHolidays] = useState({})
  const [loading, setLoading] = useState(true)
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '' })
  const [editingHoliday, setEditingHoliday] = useState(null)

  // Fetch stores and their holidays
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storesResult = await supabaseAPI.getStores()
        if (storesResult.success) {
          setStores(storesResult.data)
          
          // Fetch holidays for each store
          const holidaysData = {}
          for (const store of storesResult.data) {
            const holidaysResult = await supabaseAPI.getStoreHolidays(store.id)
            if (holidaysResult.success) {
              holidaysData[store.id] = holidaysResult.data || []
            }
          }
          setHolidays(holidaysData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddHoliday = async (storeId) => {
    if (!newHoliday.name.trim() || !newHoliday.date) {
      alert('Please fill in both holiday name and date')
      return
    }

    try {
      const holidayData = {
        store_id: storeId,
        holiday_name: newHoliday.name.trim(),
        holiday_date: newHoliday.date,
        is_closed: true
      }

      const result = await supabaseAPI.saveStoreHolidays(storeId, [holidayData])
      if (result.success) {
        // Reload holidays for this store
        const holidaysResult = await supabaseAPI.getStoreHolidays(storeId)
        if (holidaysResult.success) {
          setHolidays(prev => ({
            ...prev,
            [storeId]: holidaysResult.data || []
          }))
        }
        setNewHoliday({ name: '', date: '' })
        alert('Holiday added successfully!')
      } else {
        alert(`Error adding holiday: ${result.error}`)
      }
    } catch (error) {
      alert(`Error adding holiday: ${error.message}`)
    }
  }

  const handleDeleteHoliday = async (storeId, holidayId) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return
    }

    try {
      const result = await supabaseAPI.deleteStoreHoliday(storeId, holidayId)
      if (result.success) {
        // Reload holidays for this store
        const holidaysResult = await supabaseAPI.getStoreHolidays(storeId)
        if (holidaysResult.success) {
          setHolidays(prev => ({
            ...prev,
            [storeId]: holidaysResult.data || []
          }))
        }
        alert('Holiday deleted successfully!')
      } else {
        alert(`Error deleting holiday: ${result.error}`)
      }
    } catch (error) {
      alert(`Error deleting holiday: ${error.message}`)
    }
  }

  const handleEditHoliday = async (storeId, holidayId, updatedData) => {
    try {
      const result = await supabaseAPI.updateStoreHoliday(storeId, holidayId, updatedData)
      if (result.success) {
        // Reload holidays for this store
        const holidaysResult = await supabaseAPI.getStoreHolidays(storeId)
        if (holidaysResult.success) {
          setHolidays(prev => ({
            ...prev,
            [storeId]: holidaysResult.data || []
          }))
        }
        setEditingHoliday(null)
        alert('Holiday updated successfully!')
      } else {
        alert(`Error updating holiday: ${result.error}`)
      }
    } catch (error) {
      alert(`Error updating holiday: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Holiday Manager</h1>
          <p className="mt-2 text-gray-600">Loading stores and holidays...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-primary-600 hover:text-primary-800 mb-4 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Scheduler
        </button>
        <div className="flex items-center">
          <Calendar className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Holiday Manager</h1>
            <p className="mt-2 text-gray-600">Manage holidays for all stores</p>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {stores.map((store) => {
          const storeHolidays = holidays[store.id] || []
          
          return (
            <div key={store.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Store Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{store.name}</h3>
                      <p className="text-gray-600">Store #{store.number}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {storeHolidays.length} holidays
                  </div>
                </div>
              </div>

              {/* Holidays Section */}
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-green-600" />
                  Store Holidays
                </h4>
                
                {/* Add New Holiday */}
                <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">Add New Holiday</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Holiday Name
                      </label>
                      <input
                        type="text"
                        value={newHoliday.name}
                        onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Christmas Day"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newHoliday.date}
                        onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddHoliday(store.id)}
                    className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Holiday
                  </button>
                </div>

                {/* Holidays List */}
                <div className="space-y-3">
                  {storeHolidays.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No holidays set for this store</p>
                  ) : (
                    storeHolidays.map((holiday) => (
                      <div key={holiday.id} className="border border-gray-200 rounded-lg p-4">
                        {editingHoliday === holiday.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Holiday Name
                                </label>
                                <input
                                  type="text"
                                  defaultValue={holiday.holiday_name}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  id={`edit-name-${holiday.id}`}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  defaultValue={holiday.holiday_date}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  id={`edit-date-${holiday.id}`}
                                />
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  const name = document.getElementById(`edit-name-${holiday.id}`).value
                                  const date = document.getElementById(`edit-date-${holiday.id}`).value
                                  handleEditHoliday(store.id, holiday.id, { holiday_name: name, holiday_date: date })
                                }}
                                className="bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700 transition-colors text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingHoliday(null)}
                                className="bg-gray-600 text-white py-1 px-3 rounded-md hover:bg-gray-700 transition-colors text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{holiday.holiday_name}</h5>
                              <p className="text-sm text-gray-600">
                                {new Date(holiday.holiday_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingHoliday(holiday.id)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteHoliday(store.id, holiday.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Scheduler 