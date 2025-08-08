import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, User, Calendar } from 'lucide-react'
import supabaseAPI from '../services/supabaseAPI'

const WeeklyCalendar = ({ 
  storeId, 
  storeName, 
  staffData, 
  onSaveShift, 
  onDeleteShift, 
  selectedDate = new Date() 
}) => {
  const [currentWeek, setCurrentWeek] = useState(selectedDate)
  const [shifts, setShifts] = useState([])
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [newShift, setNewShift] = useState({
    staffId: '',
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  })

  // Filter staff to only show employees for this store
  const storeStaff = staffData.filter(staff => staff.store_id === storeId)

  // Get store hours for the current week
  const [storeHours, setStoreHours] = useState({})
  
  useEffect(() => {
    // This would typically fetch from your API
    // For now, using default store hours (10 AM - 7 PM weekdays, 10 AM - 6 PM weekends)
    const defaultHours = {
      0: { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Monday
      1: { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Tuesday
      2: { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Wednesday
      3: { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Thursday
      4: { isOpen: true, openTime: '10:00', closeTime: '19:00' }, // Friday
      5: { isOpen: true, openTime: '10:00', closeTime: '18:00' }, // Saturday
    }
    setStoreHours(defaultHours)
  }, [])

  // Generate time slots based on store hours for the week
  const getTimeSlotsForWeek = () => {
    const allTimes = new Set()
    
    // Get all unique times from store hours
    Object.values(storeHours).forEach(day => {
      if (day.isOpen) {
        allTimes.add(day.openTime)
        allTimes.add(day.closeTime)
      }
    })
    
    // Convert to array and sort
    const times = Array.from(allTimes).sort()
    
    // Generate slots between open and close times
    const slots = []
    times.forEach((time, index) => {
      if (index < times.length - 1) {
        const currentTime = time
        const nextTime = times[index + 1]
        
        // Add current time slot
        slots.push(currentTime)
        
        // Add intermediate hours if there are gaps
        const currentHour = parseInt(currentTime.split(':')[0])
        const nextHour = parseInt(nextTime.split(':')[0])
        
        for (let hour = currentHour + 1; hour < nextHour; hour++) {
          slots.push(`${hour.toString().padStart(2, '0')}:00`)
        }
      }
    })
    
    return slots
  }

  const timeSlots = getTimeSlotsForWeek()

  // Convert 24-hour time to 12-hour format
  const formatTime12Hour = (time) => {
    if (!time || typeof time !== 'string') {
      console.warn('Invalid time value for formatting:', time)
      return '--:--'
    }
    try {
      const [hours, minutes] = time.split(':').map(Number)
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
    } catch (error) {
      console.warn('Error formatting time:', time, error)
      return '--:--'
    }
  }

  // Get store hours for a specific day
  const getStoreHoursForDay = (dayIndex) => {
    return storeHours[dayIndex] || { isOpen: false }
  }

  // Days of the week (excluding Sunday)
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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

  const weekDates = getWeekDates(currentWeek)

  // Load shifts from database when component mounts or week changes
  useEffect(() => {
    if (weekDates.length > 0) {
      loadShiftsForWeek()
    }
  }, [currentWeek, storeId, weekDates])

  // Load shifts for the current week
  const loadShiftsForWeek = async () => {
    try {
      const startDate = weekDates[0].toISOString().split('T')[0]
      const endDate = weekDates[5].toISOString().split('T')[0]
      
      const result = await supabaseAPI.getScheduleAssignments(storeId, startDate, endDate)
      
             if (result.success) {
         // The API already returns data in camelCase format
         const validShifts = result.data.filter(shift => {
           // Filter out invalid shifts
           const isValid = shift.startTime && shift.endTime && shift.staffId
           if (!isValid) {
             console.warn('Filtering out invalid shift:', shift)
           }
           return isValid
         })
         console.log('Valid shifts:', validShifts)
         setShifts(validShifts)
       }
    } catch (error) {
      console.error('Failed to load shifts:', error)
    }
  }

  // Navigation
  const goToPreviousWeek = () => {
    const prev = new Date(currentWeek)
    prev.setDate(prev.getDate() - 7)
    setCurrentWeek(prev)
  }

  const goToNextWeek = () => {
    const next = new Date(currentWeek)
    next.setDate(next.getDate() + 7)
    setCurrentWeek(next)
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Check if date is today
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Convert time to minutes for comparison
  const timeToMinutes = (time) => {
    if (!time || typeof time !== 'string') {
      console.warn('Invalid time value:', time)
      return 0
    }
    try {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    } catch (error) {
      console.warn('Error parsing time:', time, error)
      return 0
    }
  }

  // Check if a time slot is within a shift
  const isTimeInShift = (timeSlot, shift) => {
    if (!shift.startTime || !shift.endTime) {
      return false
    }
    const slotMinutes = timeToMinutes(timeSlot)
    const startMinutes = timeToMinutes(shift.startTime)
    const endMinutes = timeToMinutes(shift.endTime)
    
    return slotMinutes >= startMinutes && slotMinutes < endMinutes
  }

  // Handle slot click
  const handleSlotClick = (dayIndex, timeSlot) => {
    setSelectedSlot({ dayIndex, timeSlot })
    setNewShift({
      staffId: '',
      startTime: timeSlot,
      endTime: getNextHour(timeSlot),
      notes: ''
    })
    setShowShiftModal(true)
  }

  // Get next hour
  const getNextHour = (time) => {
    const [hour] = time.split(':')
    const nextHour = parseInt(hour) + 1
    return `${nextHour.toString().padStart(2, '0')}:00`
  }

  // Add new shift
  const handleAddShift = async () => {
    if (!newShift.staffId) {
      alert('Please select a staff member')
      return
    }

    const shift = {
      storeId,
      staffId: newShift.staffId,
      date: weekDates[selectedSlot.dayIndex].toISOString().split('T')[0],
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      notes: newShift.notes
    }

         try {
       const result = await supabaseAPI.saveScheduleAssignment(shift)
       if (result.success) {
         setShifts(prev => [...prev, result.data])
         if (onSaveShift) {
           onSaveShift(result.data)
         }
       } else {
         alert('Failed to save shift: ' + result.error)
       }
     } catch (error) {
       console.error('Error saving shift:', error)
       alert('An unexpected error occurred while saving the shift.')
     }
    
    setShowShiftModal(false)
    setSelectedSlot(null)
    setNewShift({ staffId: '', startTime: '09:00', endTime: '17:00', notes: '' })
  }

  // Delete shift
  const handleDeleteShift = async (shiftId) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
             try {
         const result = await supabaseAPI.deleteScheduleAssignment(shiftId)
         if (result.success) {
           setShifts(prev => prev.filter(shift => shift.id !== shiftId))
           if (onDeleteShift) {
             onDeleteShift(shiftId)
           }
         } else {
           alert('Failed to delete shift: ' + result.error)
         }
       } catch (error) {
         console.error('Error deleting shift:', error)
         alert('An unexpected error occurred while deleting the shift.')
       }
    }
  }

  // Get staff name
  const getStaffName = (staffId) => {
    const staff = storeStaff.find(s => s.id === staffId || s.id === parseInt(staffId))
    return staff ? staff.name : `Unknown (ID: ${staffId})`
  }

  // Calculate shift duration in hours
  const calculateShiftHours = (startTime, endTime) => {
    if (!startTime || !endTime) {
      console.warn('Missing start or end time:', { startTime, endTime })
      return 0
    }
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    return Math.max(0, (endMinutes - startMinutes) / 60)
  }

  // Calculate totals for the week
  const calculateWeekTotals = () => {
    const staffTotals = {}
    let storeTotalHours = 0
    let storeTotalCost = 0

    // Calculate staff hours and costs
    shifts.forEach(shift => {
      // Skip invalid shifts
      if (!shift.startTime || !shift.endTime || !shift.staffId) {
        console.warn('Skipping invalid shift:', shift)
        return
      }
      
      const hours = calculateShiftHours(shift.startTime, shift.endTime)
      const staff = storeStaff.find(s => s.id === shift.staffId || s.id === parseInt(shift.staffId))
      
      if (staff) {
        // Add to staff totals
        if (!staffTotals[staff.id]) {
          staffTotals[staff.id] = {
            name: staff.name,
            hours: 0,
            cost: 0
          }
        }
        staffTotals[staff.id].hours += hours
        
        // Calculate cost based on pay type
        let shiftCost = 0
        if (staff.payType === 'hourly') {
          shiftCost = hours * (staff.hourlyRate || 0)
        } else if (staff.payType === 'salary' || staff.payType === 'salary+bonus') {
          const yearlySalary = staff.salaryAmount || 0
          const dailyRate = yearlySalary / 365
          const standardWorkdayHours = 8
          const dayFraction = hours / standardWorkdayHours
          shiftCost = dailyRate * dayFraction
        }
        
        staffTotals[staff.id].cost += shiftCost
        storeTotalHours += hours
        storeTotalCost += shiftCost
      }
    })

    return { staffTotals, storeTotalHours, storeTotalCost }
  }

  const { staffTotals, storeTotalHours, storeTotalCost } = calculateWeekTotals()

  // Check if slot has a shift
  const getShiftForSlot = (dayIndex, timeSlot) => {
    const date = weekDates[dayIndex].toISOString().split('T')[0]
    return shifts.find(shift => 
      shift.date === date && 
      isTimeInShift(timeSlot, shift)
    )
  }

  // Get all shifts for a slot (for multiple staff)
  const getShiftsForSlot = (dayIndex, timeSlot) => {
    const date = weekDates[dayIndex].toISOString().split('T')[0]
    return shifts.filter(shift => 
      shift.date === date && 
      isTimeInShift(timeSlot, shift)
    )
  }

  // Check if a time slot is the start of a shift
  const isShiftStart = (dayIndex, timeSlot) => {
    const date = weekDates[dayIndex].toISOString().split('T')[0]
    return shifts.some(shift => 
      shift.date === date && 
      shift.startTime === timeSlot
    )
  }

  // Get shift that starts at this time slot
  const getShiftStartingAt = (dayIndex, timeSlot) => {
    const date = weekDates[dayIndex].toISOString().split('T')[0]
    return shifts.find(shift => 
      shift.date === date && 
      shift.startTime === timeSlot
    )
  }

     // Calculate how many time slots a shift spans
   const getShiftSpan = (startTime, endTime) => {
     const startMinutes = timeToMinutes(startTime)
     const endMinutes = timeToMinutes(endTime)
     const durationHours = (endMinutes - startMinutes) / 60
     return Math.max(1, Math.ceil(durationHours))
   }

   // Get shifts for a day
   const getShiftsForDay = (dayIndex) => {
     const date = weekDates[dayIndex].toISOString().split('T')[0]
     return shifts.filter(shift => shift.date === date)
   }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Weekly Schedule - {storeName}
          </h3>
          <p className="text-sm text-gray-600">
            {formatDate(weekDates[0])} - {formatDate(weekDates[5])}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week Totals */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-3">Week Totals</h4>
        
        {/* Staff Totals */}
        <div className="mb-4">
          <h5 className="text-xs font-medium text-blue-800 mb-2">Staff Hours:</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {Object.values(staffTotals).map((staff) => (
              <div key={staff.name} className="text-sm bg-white p-2 rounded border">
                <div className="font-medium text-blue-900">{staff.name}</div>
                <div className="text-blue-700">{staff.hours.toFixed(1)} hours</div>
                <div className="text-blue-600">${staff.cost.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Totals */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-blue-900">Store Total Hours</div>
            <div className="text-lg font-bold text-blue-700">{storeTotalHours.toFixed(1)} hours</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-medium text-blue-900">Store Total Cost</div>
            <div className="text-lg font-bold text-blue-700">${storeTotalCost.toFixed(2)}</div>
          </div>
        </div>
      </div>

             {/* Calendar Grid */}
       <div className="overflow-x-auto">
         <div className="min-w-[800px]">
           {/* Day Headers */}
           <div className="grid grid-cols-7 gap-1 mb-2">
             <div className="h-12"></div> {/* Empty corner */}
             {weekDates.map((date, index) => (
               <div
                 key={index}
                 className={`h-12 flex flex-col items-center justify-center border rounded ${
                   isToday(date) 
                     ? 'bg-blue-50 border-blue-200' 
                     : 'bg-gray-50 border-gray-200'
                 }`}
               >
                 <div className="text-xs font-medium text-gray-600">
                   {daysOfWeek[index].slice(0, 3)}
                 </div>
                 <div className={`text-sm font-semibold ${
                   isToday(date) ? 'text-blue-700' : 'text-gray-900'
                 }`}>
                   {date.getDate()}
                 </div>
               </div>
             ))}
           </div>

           {/* Time Slots */}
           <div className="grid grid-cols-7 gap-1">
                         {/* Time Labels */}
            <div className="space-y-1">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-12 flex items-center justify-end pr-2 text-xs text-gray-500"
                >
                  {formatTime12Hour(time)}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDates.map((date, dayIndex) => {
              const dayHours = getStoreHoursForDay(dayIndex)
              
              return (
                <div key={dayIndex} className="space-y-1 relative">
                  {timeSlots.map((timeSlot) => {
                    // Check if this time slot is within store hours for this day
                    const isWithinStoreHours = dayHours.isOpen && 
                      timeToMinutes(timeSlot) >= timeToMinutes(dayHours.openTime) &&
                      timeToMinutes(timeSlot) < timeToMinutes(dayHours.closeTime)
                    
                    if (!isWithinStoreHours) {
                      return (
                        <div
                          key={timeSlot}
                          className="h-12 border border-gray-100 bg-gray-50"
                        />
                      )
                    }
                    
                    const shiftsForSlot = getShiftsForSlot(dayIndex, timeSlot)
                    const isStart = isShiftStart(dayIndex, timeSlot)
                    const startingShift = getShiftStartingAt(dayIndex, timeSlot)
                    
                                         return (
                       <div
                         key={timeSlot}
                         className={`h-12 border border-gray-200 rounded cursor-pointer transition-colors relative ${
                           shiftsForSlot.length > 0
                             ? 'bg-green-100 border-green-300 hover:bg-green-200' 
                             : 'hover:bg-gray-50'
                         }`}
                         onClick={() => handleSlotClick(dayIndex, timeSlot)}
                       >
                         {/* Show staff names for all shifts in this time slot */}
                         {shiftsForSlot.length > 0 && (
                           <div className="p-1 h-full flex flex-col justify-center">
                             {shiftsForSlot.slice(0, 2).map((shift, idx) => (
                               <div key={shift.id} className="text-xs font-medium text-green-800 truncate">
                                 {getStaffName(shift.staffId)}
                               </div>
                             ))}
                             {shiftsForSlot.length > 2 && (
                               <div className="text-xs text-green-600">
                                 +{shiftsForSlot.length - 2} more
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     )
                  })}
                  
                  
                </div>
              )
            })}
           </div>
         </div>
       </div>

      {/* Shift Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">This Week's Shifts</h4>
        <div className="space-y-2">
          {weekDates.map((date, dayIndex) => {
            const dayShifts = getShiftsForDay(dayIndex)
            if (dayShifts.length === 0) return null

            return (
              <div key={dayIndex} className="text-sm">
                <div className="font-medium text-gray-700 mb-1">
                  {daysOfWeek[dayIndex]} ({formatDate(date)})
                </div>
                <div className="space-y-1">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{getStaffName(shift.staffId)}</span>
                        <Clock className="w-4 h-4 text-gray-400" />
                                                 <span className="text-gray-600">
                           {formatTime12Hour(shift.startTime)} - {formatTime12Hour(shift.endTime)}
                         </span>
                      </div>
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Shift
            </h3>
            
            <div className="space-y-4">
              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Member
                </label>
                <select
                  value={newShift.staffId}
                  onChange={(e) => setNewShift(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select staff member</option>
                  {storeStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={newShift.notes}
                  onChange={(e) => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any special instructions or notes..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowShiftModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddShift}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Add Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeeklyCalendar 