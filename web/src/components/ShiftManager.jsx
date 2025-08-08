import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, Plus, Trash2, Save, X } from 'lucide-react'

const ShiftManager = ({ storeId, storeName, staffData, onSave, onCancel }) => {
  const [shifts, setShifts] = useState([])
  const [newShift, setNewShift] = useState({
    staffId: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  // Initialize with today's date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setNewShift(prev => ({ ...prev, date: today }))
  }, [])

  const handleAddShift = () => {
    if (!newShift.staffId || !newShift.date) {
      alert('Please select a staff member and date')
      return
    }

    const shift = {
      id: Date.now(),
      store_id: storeId,
      staff_id: newShift.staffId,
      date: newShift.date,
      start_time: newShift.startTime,
      end_time: newShift.endTime,
      notes: newShift.notes
    }

    setShifts(prev => [...prev, shift])
    setNewShift(prev => ({
      ...prev,
      staffId: '',
      startTime: '09:00',
      endTime: '17:00',
      notes: ''
    }))
  }

  const handleDeleteShift = (shiftId) => {
    setShifts(prev => prev.filter(shift => shift.id !== shiftId))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(shifts)
    } catch (error) {
      console.error('Error saving shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStaffName = (staffId) => {
    const staff = staffData.find(s => s.id === staffId)
    return staff ? staff.name : 'Unknown'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Shift Manager - {storeName}
          </h3>
          <p className="text-sm text-gray-600">
            Create and manage staff shifts
          </p>
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
            {loading ? 'Saving...' : 'Save Shifts'}
          </button>
        </div>
      </div>

      {/* Add New Shift */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Shift</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Member
            </label>
            <select
              value={newShift.staffId}
              onChange={(e) => setNewShift(prev => ({ ...prev, staffId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select staff</option>
              {staffData.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={newShift.date}
              onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={newShift.startTime}
              onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={newShift.endTime}
              onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddShift}
              className="w-full btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Shift
            </button>
          </div>
        </div>
      </div>

      {/* Shifts List */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Scheduled Shifts ({shifts.length})
        </h4>
        {shifts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No shifts scheduled</p>
        ) : (
          <div className="space-y-2">
            {shifts
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {getStaffName(shift.staff_id)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {formatDate(shift.date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {shift.start_time} - {shift.end_time}
                      </span>
                    </div>
                    {shift.notes && (
                      <span className="text-sm text-gray-500">
                        "{shift.notes}"
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteShift(shift.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0]
              const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
              const newShifts = []
              
              weekdays.forEach((day, index) => {
                const date = new Date()
                date.setDate(date.getDate() + (index + 1))
                const dateString = date.toISOString().split('T')[0]
                
                staffData.forEach(staff => {
                  newShifts.push({
                    id: Date.now() + Math.random(),
                    store_id: storeId,
                    staff_id: staff.id,
                    date: dateString,
                    start_time: '09:00',
                    end_time: '17:00',
                    notes: 'Auto-generated'
                  })
                })
              })
              
              setShifts(prev => [...prev, ...newShifts])
            }}
            className="btn-outline btn-sm"
          >
            Generate Week Schedule
          </button>
          <button
            onClick={() => setShifts([])}
            className="btn-outline btn-sm"
          >
            Clear All Shifts
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShiftManager 