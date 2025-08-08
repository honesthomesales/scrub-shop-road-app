import React, { useState, useEffect } from 'react'
import { Zap, AlertTriangle, DollarSign, Users, Clock, Save, X, Settings } from 'lucide-react'
import supabaseAPI from '../services/supabaseAPI'

const AutoScheduler = ({ 
  storeId, 
  storeName, 
  staffData, 
  storeHours, 
  commissionTiers, 
  onSave, 
  onCancel 
}) => {
  const [schedules, setSchedules] = useState([])
  const [localStoreHours, setLocalStoreHours] = useState([])
  const [localCommissionTiers, setLocalCommissionTiers] = useState([])
  const [settings, setSettings] = useState({
    minStaffing: 2,
    maxConsecutiveHours: 8,
    lunchBreakRequired: true,
    lunchBreakDuration: 30,
    minShiftDuration: 3,
    maxHoursPerWeek: 40,
    preferredHoursPerWeek: 32
  })
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(new Date())

  // Filter staff to only show employees for this store
  const storeStaff = staffData.filter(staff => staff.store_id === storeId)

  // Fetch store data on component mount
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        // Fetch store hours
        const hoursResult = await supabaseAPI.getStoreHours(storeId)
        if (hoursResult.success) {
          setLocalStoreHours(hoursResult.data || [])
        }

        // Fetch commission tiers
        const tiersResult = await supabaseAPI.getCommissionTiers(storeId)
        if (tiersResult.success) {
          setLocalCommissionTiers(tiersResult.data || [])
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
      }
    }

    fetchStoreData()
  }, [storeId])

  // Get week dates (Monday to Saturday, excluding Sunday)
  const getWeekDates = (date) => {
    const start = new Date(date)
    // Find Monday of the current week
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    start.setDate(diff)
    
    const week = []
    for (let i = 0; i < 6; i++) { // Only 6 days (Mon-Sat)
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      week.push(day)
    }
    return week
  }

  const weekDates = getWeekDates(selectedWeek)

  // Convert 24-hour time to 12-hour format
  const formatTime12Hour = (time24) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Calculate staff availability and preferences
  const calculateStaffAvailability = () => {
    return storeStaff.map(staff => {
      const currentHours = getCurrentWeekHours(staff.id)
      const availableHours = Math.max(0, settings.maxHoursPerWeek - currentHours)
      
      return {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        preferredHours: staff.preferredHoursPerWeek || settings.preferredHoursPerWeek,
        maxHours: staff.maxHoursPerWeek || settings.maxHoursPerWeek,
        currentHours,
        availableHours,
        hourlyRate: staff.hourlyRate || 0,
        commissionRate: getCommissionRate(staff.id)
      }
    })
  }

  // Get current week hours for a staff member
  const getCurrentWeekHours = (staffId) => {
    const weekStart = weekDates[0].toISOString().split('T')[0]
    const weekEnd = weekDates[5].toISOString().split('T')[0]
    
    // This would normally query the database
    // For now, return 0 as mock data
    return 0
  }

  // Get commission rate for a staff member
  const getCommissionRate = (staffId) => {
    return 0
  }

  // Get store hours for a specific day (0=Monday, 1=Tuesday, etc.)
  const getStoreHoursForDay = (dayIndex) => {
    const dayHours = localStoreHours.find(h => h.day_of_week === dayIndex)
    
    if (dayHours) {
      return {
        isOpen: dayHours.is_open,
        openTime: dayHours.open_time,
        closeTime: dayHours.close_time
      }
    }
    
    // Default hours if no data found
    const defaultHours = [
      { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Monday
      { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Tuesday
      { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Wednesday
      { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Thursday
      { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Friday
      { isOpen: true, openTime: '10:00', closeTime: '18:00' }  // Saturday
    ]
    
    return defaultHours[dayIndex] || { isOpen: false, openTime: '10:00', closeTime: '19:00' }
  }

  // Auto-generate schedule
  const generateSchedule = () => {
    setLoading(true)
    
    try {
      const availability = calculateStaffAvailability()
      const newSchedules = []
      const newConflicts = []

      weekDates.forEach((date, dayIndex) => {
        const dayHours = getStoreHoursForDay(dayIndex)
        
        if (!dayHours.isOpen) return

        const daySchedules = generateDaySchedule(
          date,
          availability,
          dayHours,
          newConflicts,
          dayIndex
        )
        
        newSchedules.push(...daySchedules)
      })

      setSchedules(newSchedules)
      setConflicts(newConflicts)
    } catch (error) {
      console.error('Error generating schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate schedule for a single day
  const generateDaySchedule = (date, availability, dayHours, conflicts, dayIndex) => {
    const daySchedules = []
    const availableStaff = [...availability].sort((a, b) => b.availableHours - a.availableHours)
    
    // Calculate required staffing based on store hours
    const openTime = new Date(`2000-01-01T${dayHours.openTime}`)
    const closeTime = new Date(`2000-01-01T${dayHours.closeTime}`)
    const totalHours = (closeTime - openTime) / (1000 * 60 * 60)
    
    // Ensure minimum staffing
    const requiredStaff = Math.max(settings.minStaffing, Math.ceil(totalHours / 8))
    
    // Assign staff to shifts
    let assignedStaff = 0
    let currentTime = new Date(openTime)
    
    while (assignedStaff < requiredStaff && availableStaff.length > 0) {
      const staff = availableStaff.shift()
      
      if (staff.availableHours < settings.minShiftDuration) {
        conflicts.push({
          type: 'insufficient_hours',
          staff: staff.name,
          date: date.toISOString().split('T')[0],
          message: `${staff.name} has insufficient available hours (${staff.availableHours}h)`
        })
        continue
      }

      // Calculate shift duration
      const shiftDuration = Math.min(
        staff.availableHours,
        Math.max(settings.minShiftDuration, 8)
      )

      // Check for lunch break requirement
      let endTime = new Date(currentTime)
      endTime.setHours(endTime.getHours() + shiftDuration)
      
      if (shiftDuration > 5 && settings.lunchBreakRequired) {
        // Add lunch break
        const lunchStart = new Date(currentTime)
        lunchStart.setHours(lunchStart.getHours() + Math.floor(shiftDuration / 2))
        
        const lunchEnd = new Date(lunchStart)
        lunchEnd.setMinutes(lunchEnd.getMinutes() + settings.lunchBreakDuration)
        
        // Create two shifts with lunch break
        daySchedules.push({
          id: Date.now() + Math.random(),
          store_id: storeId,
          staff_id: staff.id,
          staff_name: staff.name,
          date: date.toISOString().split('T')[0],
          day_index: dayIndex,
          start_time: currentTime.toTimeString().slice(0, 5),
          end_time: lunchStart.toTimeString().slice(0, 5),
          notes: 'Auto-generated (before lunch)'
        })
        
        daySchedules.push({
          id: Date.now() + Math.random() + 1,
          store_id: storeId,
          staff_id: staff.id,
          staff_name: staff.name,
          date: date.toISOString().split('T')[0],
          day_index: dayIndex,
          start_time: lunchEnd.toTimeString().slice(0, 5),
          end_time: endTime.toTimeString().slice(0, 5),
          notes: 'Auto-generated (after lunch)'
        })
      } else {
        // Create single shift
        daySchedules.push({
          id: Date.now() + Math.random(),
          store_id: storeId,
          staff_id: staff.id,
          staff_name: staff.name,
          date: date.toISOString().split('T')[0],
          day_index: dayIndex,
          start_time: currentTime.toTimeString().slice(0, 5),
          end_time: endTime.toTimeString().slice(0, 5),
          notes: 'Auto-generated'
        })
      }

      assignedStaff++
      currentTime = new Date(endTime)
      
      // Update staff availability
      staff.availableHours -= shiftDuration
    }

    return daySchedules
  }

  // Calculate pay for a schedule
  const calculatePay = (schedule) => {
    const staff = storeStaff.find(s => s.id === schedule.staff_id)
    if (!staff) return 0

    const startTime = new Date(`2000-01-01T${schedule.start_time}`)
    const endTime = new Date(`2000-01-01T${schedule.end_time}`)
    const hours = (endTime - startTime) / (1000 * 60 * 60)

    let pay = 0

    if (staff.payType === 'hourly') {
      pay = hours * (staff.hourlyRate || 0)
    } else if (staff.payType === 'salary' || staff.payType === 'salary+bonus') {
      const yearlySalary = staff.salaryAmount || 0
      const dailyRate = yearlySalary / 365
      const standardWorkdayHours = 8
      const dayFraction = hours / standardWorkdayHours
      pay = dailyRate * dayFraction
      
      if (staff.payType === 'salary+bonus') {
        const commissionPotential = hours * getCommissionRate(staff.id) / 100
        pay += commissionPotential
      }
    }

    return pay
  }

  // Calculate total pay for all schedules
  const calculateTotalPay = () => {
    return schedules.reduce((total, schedule) => {
      return total + calculatePay(schedule)
    }, 0)
  }

  // Handle save
  const handleSave = async () => {
    if (schedules.length === 0) {
      alert('No schedules to save. Please generate a schedule first.')
      return
    }

    setLoading(true)
    try {
      const formattedSchedules = schedules.map(schedule => ({
        store_id: storeId,
        staff_id: schedule.staff_id,
        date: schedule.date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        notes: schedule.notes || '',
        created_at: new Date().toISOString()
      }))

      await onSave(formattedSchedules)
      alert('Schedule saved successfully!')
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Error saving schedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get staff name by ID
  const getStaffName = (staffId) => {
    const staff = storeStaff.find(s => s.id === staffId)
    return staff ? staff.name : 'Unknown Staff'
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Group schedules by day for table display
  const groupSchedulesByDay = () => {
    const grouped = {}
    weekDates.forEach((date, index) => {
      const dayKey = date.toISOString().split('T')[0]
      grouped[dayKey] = {
        date: date,
        dayIndex: index,
        schedules: schedules.filter(s => s.date === dayKey)
      }
    })
    return grouped
  }

  const groupedSchedules = groupSchedulesByDay()

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Auto Scheduler - {storeName}
          </h3>
          <p className="text-sm text-gray-600">
            Generate optimal schedules based on store hours and staff availability
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
            disabled={loading || schedules.length === 0}
            className="btn-primary btn-sm"
          >
            <Save className="w-4 h-4 mr-1" />
            {loading ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>

      {/* Staff Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-3">
          Store Staff ({storeStaff.length} employees)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {calculateStaffAvailability().map((staff) => (
            <div key={staff.id} className="text-sm">
              <div className="font-medium text-blue-900">{staff.name}</div>
              <div className="text-blue-700">
                Available: {staff.availableHours}h / {staff.maxHours}h
              </div>
              <div className="text-blue-600">
                Rate: ${staff.hourlyRate}/hr
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-gray-600 mr-2" />
          <h4 className="text-sm font-medium text-gray-900">Scheduling Rules</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Staffing
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.minStaffing}
              onChange={(e) => setSettings(prev => ({ ...prev, minStaffing: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Consecutive Hours
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={settings.maxConsecutiveHours}
              onChange={(e) => setSettings(prev => ({ ...prev, maxConsecutiveHours: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Shift Duration
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={settings.minShiftDuration}
              onChange={(e) => setSettings(prev => ({ ...prev, minShiftDuration: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Hours/Week
            </label>
            <input
              type="number"
              min="20"
              max="60"
              value={settings.maxHoursPerWeek}
              onChange={(e) => setSettings(prev => ({ ...prev, maxHoursPerWeek: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generateSchedule}
          disabled={loading}
          className="w-full btn-primary"
        >
          <Zap className="w-4 h-4 mr-2" />
          {loading ? 'Generating Schedule...' : 'Generate Auto Schedule'}
        </button>
      </div>

      {/* Conflicts Display */}
      {conflicts.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="text-sm font-medium text-red-900">Scheduling Conflicts</h4>
          </div>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="text-sm text-red-700">
                <strong>{conflict.date}:</strong> {conflict.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Schedules - Table Format */}
      {schedules.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">
              Generated Schedule ({schedules.length} shifts)
            </h4>
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-600">
                Total Pay: ${calculateTotalPay().toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Schedule Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium">Mon</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium">Tue</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium">Wed</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium">Thu</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium">Fri</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium">Sat</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(groupedSchedules).map((dayData, dayIndex) => {
                  const daySchedules = dayData.schedules
                  const maxRows = Math.max(1, daySchedules.length)
                  
                  return Array.from({ length: maxRows }, (_, rowIndex) => (
                    <tr key={`${dayData.date}-${rowIndex}`}>
                      {weekDates.map((date, colIndex) => {
                        const colDayData = groupedSchedules[date.toISOString().split('T')[0]]
                        const colSchedules = colDayData?.schedules || []
                        const schedule = colSchedules[rowIndex]
                        
                        if (schedule) {
                          return (
                            <td key={colIndex} className="border border-gray-300 px-4 py-2">
                              <div className="text-sm">
                                <div className="font-medium">{schedule.staff_name}</div>
                                <div className="text-gray-600">
                                  {formatTime12Hour(schedule.start_time)} - {formatTime12Hour(schedule.end_time)}
                                </div>
                              </div>
                            </td>
                          )
                        } else {
                          return (
                            <td key={colIndex} className="border border-gray-300 px-4 py-2">
                              {rowIndex === 0 && colSchedules.length === 0 && (
                                <div className="text-sm text-gray-400 italic">No shifts</div>
                              )}
                            </td>
                          )
                        }
                      })}
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutoScheduler 