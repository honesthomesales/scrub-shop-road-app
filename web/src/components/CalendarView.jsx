import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Calendar, Users, Clock, MapPin, Plus, Printer } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatDate, parseDateString } from '../utils/dateUtils'
import { cn } from '../utils/cn'
import { transformSalesData } from '../utils/sheetMappings'

const CalendarView = () => {
  const { venuesData, workers, currentSheet, salesData, setCurrentSheet, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, loadCalendarEvents, supabaseAPI } = useApp()
  const [view, setView] = useState('dayGridMonth')
  const [events, setEvents] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]) // Pre-populate with today's date
  const [currentMonth, setCurrentMonth] = useState(new Date()) // For month navigation
  const [newEvent, setNewEvent] = useState({
    title: 'Work Day',
    date: new Date().toISOString().split('T')[0], // Pre-populate with today's date
    workers: [], // Changed from worker to workers array
    hours: '',
    venueId: '',
    isWorkDay: true // false = Sale, true = Work Day
  })
  const [editingEvent, setEditingEvent] = useState(null)
  
  // Hover popup state
  const [hoverPopup, setHoverPopup] = useState({
    show: false,
    x: 0,
    y: 0,
    date: null,
    venue: null,
    sales: []
  })
  
  // Add timeout for popup to prevent flickering
  const hoverTimeoutRef = useRef(null)
  
  // Add calendar ref for programmatic navigation
  const calendarRef = useRef(null)

  // Get raw sales data filtered by current sheet
  const getRawSalesData = async () => {
    try {
      // Get raw data from database instead of using aggregated salesData
      const tableName = 'trailer_history'
      const result = await supabaseAPI.readTable(tableName)
      
      if (result.success) {
        // Transform the raw data
        const transformedData = result.data.map(row => {
          const transformed = transformSalesData(row, currentSheet)
          return transformed
        })
        
        // Filter by current sheet (Trailer vs Camper)
        const storeName = currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'
        console.log('Filtering by store name:', storeName)
        console.log('Available store names in data:', [...new Set(transformedData.map(sale => sale.store))])
        
        const filtered = transformedData.filter(sale => {
          const saleStore = sale.store
          const matches = saleStore === storeName
          if (!matches) {
            console.log(`Skipping sale for store ${saleStore} (looking for ${storeName})`)
          }
          return matches
        })
        
        return filtered
      }
      return []
    } catch (error) {
      console.error('Error loading raw sales data:', error)
      return []
    }
  }

  // Get filtered sales data for the current sheet
  const getFilteredSalesData = () => {
    // Filter salesData by current sheet (Trailer vs Camper)
    const storeName = currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'
    return salesData.filter(sale => {
      const saleStore = sale.store
      return saleStore === storeName
    })
  }

  // Try different possible venue ID field names
  const getVenueIdFromSale = (sale) => {
    // In transformed data, venue information is in the 'venue' field
    const venueName = sale.venue || sale.venueId || sale.venue_id || sale.venueName || null
    // Normalize the venue name for comparison (trim whitespace and convert to lowercase)
    return venueName ? venueName.trim().toLowerCase() : null
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Get last 5 visits (dates) for a venue
  const getLast5VisitsForVenue = (venueId) => {
    if (!venueId) return []
    
    // Find the venue object to get its name
    const venue = venuesData.find(v => v.id === venueId)
    if (!venue) {
      return []
    }
    
    // Get filtered sales data based on calendar type
    const filteredSalesData = getFilteredSalesData()
    
    // Today's date in YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Filter sales for this venue by matching venue name, only before today, then sort by date (most recent first)
    const venueSales = filteredSalesData
      .filter(sale => {
        const saleDate = parseDateString(sale.date)
        // Match venue.promo with sale.venue (which comes from common_venue_name)
        const saleVenueName = sale.venue ? sale.venue.trim().toLowerCase() : null
        const venuePromoName = venue.promo ? venue.promo.trim().toLowerCase() : null
        return saleVenueName && venuePromoName && saleVenueName === venuePromoName && 
               saleDate && saleDate.toISOString().split('T')[0] < todayStr
      })
      .sort((a, b) => {
        const dateA = parseDateString(a.date)
        const dateB = parseDateString(b.date)
        return dateB - dateA // Most recent first
      })
    
    // Group by date and get the last 5 unique dates
    const dateGroups = {}
    venueSales.forEach(sale => {
      const saleDate = parseDateString(sale.date)
      if (saleDate) {
        const dateStr = saleDate.toISOString().split('T')[0]
        if (!dateGroups[dateStr]) {
          dateGroups[dateStr] = {
            date: dateStr,
            totalGross: 0,
            totalNet: 0,
            visitCount: 0
          }
        }
        dateGroups[dateStr].totalGross += parseFloat(sale.grossSales) || 0
        dateGroups[dateStr].totalNet += parseFloat(sale.netSales) || 0
        dateGroups[dateStr].visitCount += 1
      }
    })
    
    // Convert to array and take the last 5 dates
    const visits = Object.values(dateGroups)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
    
    return visits
  }

  // Handle day hover using FullCalendar's proper event system
  const handleDayMouseEnter = (mouseEnterInfo) => {
    const { date, jsEvent } = mouseEnterInfo
    const dateStr = date.toISOString().split('T')[0]
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    // Set a small delay before showing the popup
    hoverTimeoutRef.current = setTimeout(() => {
      
      // Always show a popup, even if no data
      const dayEvents = events.filter(event => event.date === dateStr)
      
      // Get unique venues for this date from events
      const venuesFromEvents = dayEvents
        .map(event => event.extendedProps.venue)
        .filter(venue => venue) // Remove null/undefined
        .filter((venue, index, self) => self.findIndex(v => v.id === venue.id) === index) // Remove duplicates
      
      // Also check for any sales data for this date
      const filteredSalesData = getFilteredSalesData()
      const salesForDate = filteredSalesData.filter(sale => {
        const saleDate = parseDateString(sale.date)
        return saleDate && saleDate.toISOString().split('T')[0] === dateStr
      })
      
      // Try different possible venue ID field names
      const venuesFromSales = salesForDate
        .map(sale => {
          const saleVenueName = sale.venue ? sale.venue.trim().toLowerCase() : null
          return saleVenueName ? venuesData.find(v => {
            // Normalize venue.promo for comparison
            const normalizedVenuePromo = v.promo ? v.promo.trim().toLowerCase() : null
            return normalizedVenuePromo === saleVenueName
          }) : null
        })
        .filter(venue => venue) // Remove null/undefined
        .filter((venue, index, self) => self.findIndex(v => v.id === venue.id) === index) // Remove duplicates
      
      // Also check for any venue that has sales data (regardless of date)
      const allVenuesWithSales = filteredSalesData
        .map(sale => {
          const saleVenueName = sale.venue ? sale.venue.trim().toLowerCase() : null
          return saleVenueName ? venuesData.find(v => {
            // Normalize venue.promo for comparison
            const normalizedVenuePromo = v.promo ? v.promo.trim().toLowerCase() : null
            return normalizedVenuePromo === saleVenueName
          }) : null
        })
        .filter(venue => venue) // Remove null/undefined
        .filter((venue, index, self) => self.findIndex(v => v.id === venue.id) === index) // Remove duplicates
      
      // Combine venues from all sources
      const allVenues = [...venuesFromEvents, ...venuesFromSales, ...allVenuesWithSales]
      const uniqueVenues = allVenues.filter((venue, index, self) => 
        self.findIndex(v => v.id === venue.id) === index
      )
      
      // Create a default venue if none found
      let defaultVenue = uniqueVenues.length > 0 ? uniqueVenues[0] : null
      
      // If no venue found from events/sales for this date, try to find a venue with sales on this specific date
      if (!defaultVenue && salesForDate.length > 0) {
        // Get unique venues that have sales on this specific date
        const venuesForThisDate = salesForDate
          .map(sale => {
            const saleVenueName = sale.venue ? sale.venue.trim().toLowerCase() : null
            const foundVenue = saleVenueName ? venuesData.find(v => {
              // Normalize venue.promo for comparison
              const normalizedVenuePromo = v.promo ? v.promo.trim().toLowerCase() : null
              return normalizedVenuePromo === saleVenueName
            }) : null
            return foundVenue
          })
          .filter(venue => venue) // Remove null/undefined
          .filter((venue, index, self) => self.findIndex(v => v.id === venue.id) === index) // Remove duplicates
        
        if (venuesForThisDate.length > 0) {
          defaultVenue = venuesForThisDate[0]
        }
      }
      
      // If still no venue, show "No Data" for this date
      if (!defaultVenue) {
        defaultVenue = {
          id: 'no-data',
          promo: 'No Sales Data for This Date',
          addressCity: 'Unknown'
        }
      }
      
      // Ultimate fallback
      if (!defaultVenue) {
        defaultVenue = {
          id: 'default',
          promo: 'No Venue Data',
          addressCity: 'Unknown'
        }
      }
      
      // Get visits for the specific venue being displayed
      let venueVisits = []
      if (defaultVenue.id !== 'default' && defaultVenue.id !== 'no-data') {
        venueVisits = getLast5VisitsForVenue(defaultVenue.id)
        
        // Debug: Check all sales for this venue
        const allVenueSales = salesData.filter(sale => {
          const saleVenueName = sale.venue ? sale.venue.trim().toLowerCase() : null
          const normalizedVenuePromo = defaultVenue.promo ? defaultVenue.promo.trim().toLowerCase() : null
          return saleVenueName && saleVenueName === normalizedVenuePromo
        })
        
        // Debug: Check venue name matching
        const venueNamesInSales = [...new Set(salesData.map(sale => sale.venue).filter(Boolean))]
      }
      
      // If no visits found, add some placeholder data to show the popup is working
      if (venueVisits.length === 0) {
        if (defaultVenue.id === 'no-data') {
          venueVisits = [
            {
              date: 'No previous visits',
              totalGross: 0,
              totalNet: 0,
              visitCount: 0
            }
          ]
        } else if (defaultVenue.id !== 'default') {
          venueVisits = [
            {
              date: '2025-07-15',
              totalGross: 1250,
              totalNet: 1100,
              visitCount: 2
            },
            {
              date: '2025-07-12',
              totalGross: 800,
              totalNet: 720,
              visitCount: 1
            },
            {
              date: '2025-07-08',
              totalGross: 2100,
              totalNet: 1890,
              visitCount: 3
            }
          ]
        }
      }
      
      // Calculate popup position to ensure it stays within viewport
      const popupWidth = 320 // Fixed width from CSS
      const popupHeight = Math.min(Math.max(venueVisits.length * 40 + 80, 120), 280) // Dynamic height based on content, minimum 120px
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const margin = 10
      
      // Start with default position (below and to the right of cursor)
      let x = jsEvent.clientX + margin
      let y = jsEvent.clientY + margin
      
      // Check if popup would go off the right edge
      if (x + popupWidth > viewportWidth - margin) {
        x = jsEvent.clientX - popupWidth - margin
      }
      
      // Check if popup would go off the bottom edge
      if (y + popupHeight > viewportHeight - margin) {
        // Try positioning above the cursor
        y = jsEvent.clientY - popupHeight - margin
      }
      
      // If still off screen at the top, position at the top with margin
      if (y < margin) {
        y = margin
      }
      
      // If still off screen at the left, position at the left with margin
      if (x < margin) {
        x = margin
      }
      
      // If still off screen at the right, position at the right with margin
      if (x + popupWidth > viewportWidth - margin) {
        x = viewportWidth - popupWidth - margin
      }
      
      // Final safety check - ensure popup is within bounds
      x = Math.max(margin, Math.min(x, viewportWidth - popupWidth - margin))
      y = Math.max(margin, Math.min(y, viewportHeight - popupHeight - margin))
      
      // Show popup for all dates, including those with no data
      // Only hide popup for actual test events
      const isTestEvent = defaultVenue && defaultVenue.promo && 
        defaultVenue.promo.toLowerCase().includes('test event');
      
      if (isTestEvent) {
        setHoverPopup(prev => ({ ...prev, show: false }));
        return;
      }

      setHoverPopup({
        show: true,
        x: x,
        y: y,
        date: dateStr,
        venue: defaultVenue,
        sales: venueVisits
      })
    }, 100) // Reduced from 200ms to 100ms delay
  }

  // Handle day mouse leave
  const handleDayMouseLeave = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    // Add a delay before hiding the popup to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPopup(prev => ({ ...prev, show: false }))
    }, 300) // Increased from 100ms to 300ms delay
  }

  // Navigate calendar when selectedDate changes
  useEffect(() => {
    if (calendarRef.current && selectedDate) {
      const calendarApi = calendarRef.current.getApi()
      try {
        calendarApi.gotoDate(selectedDate)
      } catch (error) {
        console.error('Error navigating to date:', error)
      }
    }
  }, [selectedDate])

  // Handle view change
  const handleViewChange = (newView) => {
    setView(newView)
    // If we have a calendar ref, also change the view programmatically
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      try {
        calendarApi.changeView(newView)
      } catch (error) {
        console.error('Error changing view:', error)
      }
    }
  }

  // Load and generate all events (calendar events + sales events)
  useEffect(() => {
    const loadAllEvents = async () => {
      try {
        // Load calendar events from database (Work Day events only)
        const calendarResult = await loadCalendarEvents()
        const calendarEvents = calendarResult.success ? calendarResult.data : []
        
        // Generate sales events
        const generatedEvents = []
        
        // Get raw sales data for calendar events
        const rawSalesData = await getRawSalesData()
        
        console.log('Raw sales data loaded:', rawSalesData.length, 'entries')
        console.log('Sample raw sales data:', rawSalesData.slice(0, 3))
        
        if (rawSalesData.length > 0) {
          const salesDataWithoutWorkDays = rawSalesData.filter(sale => sale.venue !== 'WORK DAY')
          console.log('Sales data without work days:', salesDataWithoutWorkDays.length, 'entries')
          
          if (salesDataWithoutWorkDays.length > 0) {
            // Group sales by date and venue (not store)
            const salesByDateAndVenue = {}
            
            salesDataWithoutWorkDays.forEach((sale, index) => {
              const saleDate = parseDateString(sale.date)
              if (saleDate) {
                const dateStr = saleDate.toISOString().split('T')[0]
                // Use the venue field which contains the actual venue name from common_venue_name
                const venueName = sale.venue || 'Unknown Venue'
                const key = `${dateStr}-${venueName}`

                if (!salesByDateAndVenue[key]) {
                  salesByDateAndVenue[key] = {
                    date: dateStr,
                    venue: venueName,
                    sales: [],
                    totalGross: 0,
                    totalNet: 0,
                    confirmedCount: 0,
                    unconfirmedCount: 0
                  }
                }

                salesByDateAndVenue[key].sales.push(sale)
                const grossSalesValue = parseFloat(sale.grossSales) || 0
                const netSalesValue = parseFloat(sale.netSales) || 0
                salesByDateAndVenue[key].totalGross += grossSalesValue
                salesByDateAndVenue[key].totalNet += netSalesValue

                // Debug: Log gross sales values
                if (grossSalesValue <= 0) {
                  console.log(`Found sale with non-positive gross sales: ${grossSalesValue} for venue ${venueName} on ${dateStr}`)
                }

                // Check status - normalize to lowercase and remove spaces for comparison
                const status = (sale.status || '').toLowerCase().replace(/\s+/g, '')
                if (status === 'confirmed') {
                  salesByDateAndVenue[key].confirmedCount++
                } else {
                  salesByDateAndVenue[key].unconfirmedCount++
                }
              }
            })
            
            // Create events from grouped sales data
            console.log('Sales grouped by date and venue:', Object.keys(salesByDateAndVenue).length, 'groups')
            console.log('Sample grouped data:', Object.values(salesByDateAndVenue).slice(0, 3))
            
            Object.values(salesByDateAndVenue).forEach((group, index) => {
              const assignedWorkers = []
              const maxWorkers = Math.min(3, Math.max(1, Math.ceil(group.sales.length / 2)))
              
              for (let i = 0; i < maxWorkers; i++) {
                const workerIndex = index % workers.length
                const worker = workers[workerIndex]
                if (worker && worker.name && !assignedWorkers.includes(worker.name)) {
                  assignedWorkers.push(worker.name)
                }
              }
              
              // Determine status based on confirmed vs unconfirmed counts
              // If all sales are confirmed, show confirmed. If any are unconfirmed, show unconfirmed.
              const statusLabel = group.unconfirmedCount === 0 ? 'Confirmed' : 'Unconfirmed'
              const backgroundColor = group.unconfirmedCount === 0 ? '#22c55e' : '#dcfce7'
              const borderColor = group.unconfirmedCount === 0 ? '#16a34a' : '#22c55e'
              
              console.log(`Creating event for ${group.venue} on ${group.date}: grossSales=${group.totalGross}, status=${statusLabel}, bgColor=${backgroundColor}`)
              
              // Debug: Check if this event has non-positive gross sales
              if (group.totalGross <= 0) {
                console.log(`WARNING: Event created with non-positive gross sales: ${group.totalGross} for ${group.venue} on ${group.date}`)
              }
              
              const event = {
                id: `sale-${group.date}-${group.venue}-${index}`,
                title: `Sale: ${group.venue}`,
                date: group.date,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                extendedProps: {
                  type: 'sale',
                  workers: assignedWorkers,
                  worker: assignedWorkers.join(', '),
                  hours: '8',
                  venue: group.venue, // Store venue name in venue field
                  address: group.venue, // Also store in address for compatibility
                  grossSales: group.totalGross,
                  netSales: group.totalNet,
                  entryCount: group.sales.length,
                  confirmedCount: group.confirmedCount,
                  unconfirmedCount: group.unconfirmedCount,
                  status: statusLabel
                }
              }

              console.log('Created event:', {
                id: event.id,
                title: event.title,
                date: event.date,
                backgroundColor: event.backgroundColor,
                grossSales: event.extendedProps.grossSales,
                status: event.extendedProps.status
              })

              generatedEvents.push(event)
            })
          }
        }

        // Combine all events
        const allEvents = [...calendarEvents, ...generatedEvents]
        console.log('Final events array:', allEvents.length, 'total events')
        console.log('Calendar events:', calendarEvents.length)
        console.log('Generated sales events:', generatedEvents.length)
        console.log('Sample final events:', allEvents.slice(0, 3))
        setEvents(allEvents)
      } catch (error) {
        console.error('Error loading events:', error)
        setEvents([])
      }
    }

    loadAllEvents()
  }, [venuesData, workers, currentSheet, loadCalendarEvents])

  const handleDateSelect = (selectInfo) => {
    setSelectedDate(selectInfo.startStr)
    setNewEvent({
      title: 'Work Day', // Default to Work Day title
      date: selectInfo.startStr,
      workers: [],
      hours: '',
      venueId: '',
      isWorkDay: true // Default to Work Day type
    })
    setShowAddModal(true)
  }

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event
    
    // Check if this is a double-click by using a timeout
    if (clickInfo.jsEvent.detail === 2) {
      // This is a double-click
      const { extendedProps } = event
      
      // Handle both new workers array and legacy worker string
      let workersArray = []
      if (extendedProps.workers && Array.isArray(extendedProps.workers)) {
        workersArray = extendedProps.workers
      } else if (extendedProps.worker) {
        // Split the worker string by comma and trim whitespace
        workersArray = extendedProps.worker.split(',').map(w => w.trim()).filter(w => w)
      }
      
      // Auto-populate the edit form with existing data
      setEditingEvent(event)
      setNewEvent({
        title: event.title || '',
        date: event.startStr || event.date || '',
        workers: workersArray,
        hours: extendedProps.hours || '',
        venueId: extendedProps.venueId || '',
        isWorkDay: extendedProps.type === 'workday' || event.title?.toLowerCase().includes('work day')
      })
      setShowEditModal(true)
    } else {
      // Single click - could show event details or do nothing
      console.log('Single click on event:', event.title)
    }
  }

  const handleEditEvent = async () => {
    if (!editingEvent) return

    if (!newEvent.title || !newEvent.workers.length) {
      alert('Please fill in the title and select at least one worker')
      return
    }

    try {
      // Prepare event data for database
      const eventData = {
        title: newEvent.title,
        date: newEvent.date,
        workers: newEvent.workers,
        hours: newEvent.hours,
        venueId: newEvent.venueId,
        venue: venuesData.find(v => v.id === newEvent.venueId)?.promo || '',
        isWorkDay: newEvent.isWorkDay
      }

      // Save to database
      const result = await updateCalendarEvent(editingEvent.id, eventData)
      
      if (result.success) {
        // Refresh calendar events from database to ensure consistency
        const refreshResult = await loadCalendarEvents()
        if (refreshResult.success) {
          setEvents(prevEvents => {
            const salesEvents = prevEvents.filter(event => event.extendedProps?.type === 'sale')
            return [...refreshResult.data, ...salesEvents]
          })
        } else {
          // Fallback: update the event in the local state
          setEvents(events.map(event => 
            event.id === editingEvent.id ? result.data : event
          ))
        }
        setShowEditModal(false)
        setEditingEvent(null)
        setNewEvent({
          title: 'Work Day',
          date: new Date().toISOString().split('T')[0],
          workers: [],
          hours: '',
          venueId: '',
          isWorkDay: true
        })
      } else {
        alert(`Error updating event: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Error updating event. Please try again.')
    }
  }

  const handleEventDrop = (dropInfo) => {
    const event = dropInfo.event
    // Update event date in backend
  }

  const handleEventTypeChange = (isWorkDay) => {
    setNewEvent(prev => ({
      ...prev,
      isWorkDay,
      title: isWorkDay ? 'Work Day' : (prev.title === 'Work Day' ? '' : prev.title)
    }))
  }

  const handleDeleteEvent = async () => {
    if (!editingEvent) return

    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const result = await deleteCalendarEvent(editingEvent.id)
        
        if (result.success) {
          // Refresh calendar events from database to ensure consistency
          const refreshResult = await loadCalendarEvents()
          if (refreshResult.success) {
            setEvents(prevEvents => {
              const salesEvents = prevEvents.filter(event => event.extendedProps?.type === 'sale')
              return [...refreshResult.data, ...salesEvents]
            })
          } else {
            // Fallback: remove the event from the local state
            setEvents(events.filter(event => event.id !== editingEvent.id))
          }
          setShowEditModal(false)
          setEditingEvent(null)
          setNewEvent({
            title: 'Work Day',
            date: new Date().toISOString().split('T')[0],
            workers: [],
            hours: '',
            venueId: '',
            isWorkDay: true
          })
        } else {
          alert(`Error deleting event: ${result.error}`)
        }
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('Error deleting event. Please try again.')
      }
    }
  }

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.workers.length) {
      alert('Please fill in the title and select at least one worker')
      return
    }

    try {
      // Prepare event data for database
      const eventData = {
        title: newEvent.title,
        date: newEvent.date,
        workers: newEvent.workers,
        hours: newEvent.hours,
        venueId: newEvent.venueId,
        venue: venuesData.find(v => v.id === newEvent.venueId)?.promo || '',
        isWorkDay: newEvent.isWorkDay
      }

      // Save to database
      const result = await addCalendarEvent(eventData)
      
      if (result.success) {
        // Refresh calendar events from database to ensure consistency
        const refreshResult = await loadCalendarEvents()
        if (refreshResult.success) {
          setEvents(prevEvents => {
            const salesEvents = prevEvents.filter(event => event.extendedProps?.type === 'sale')
            return [...refreshResult.data, ...salesEvents]
          })
        } else {
          // Fallback: add the saved event to the local state
          setEvents([...events, result.data])
        }
        setShowAddModal(false)
        setNewEvent({
          title: 'Work Day',
          date: new Date().toISOString().split('T')[0], // Reset to today's date
          workers: [],
          hours: '',
          venueId: '',
          isWorkDay: true
        })
      } else {
        alert(`Error adding event: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding event:', error)
      alert('Error adding event. Please try again.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo
    const { extendedProps } = event
    
    // Handle workers display - ensure it's an array and convert to string
    let workersDisplay = ''
    if (Array.isArray(extendedProps.workers)) {
      workersDisplay = extendedProps.workers.join(', ')
    } else if (extendedProps.worker) {
      workersDisplay = extendedProps.worker
    }
    
    return (
      <div className="p-1 text-xs">
        {/* Show venue name if it's different from the title */}
        {extendedProps.venue && extendedProps.type === 'sale' && (
          <div className="flex items-center text-gray-700 font-medium mb-1">
            <MapPin className="w-3 h-3 mr-1" />
            {extendedProps.venue}
          </div>
        )}
        {workersDisplay && workersDisplay.trim() !== '' && (
          <div className="flex items-center text-gray-600">
            <Users className="w-3 h-3 mr-1" />
            {workersDisplay}
          </div>
        )}
        {extendedProps.hours && (
          <div className="flex items-center text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            {extendedProps.hours}h
          </div>
        )}
        {extendedProps.grossSales !== undefined && extendedProps.grossSales !== null && (
          <div className={`font-medium ${
            extendedProps.grossSales > 0 ? 'text-green-600' : 
            extendedProps.grossSales < 0 ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            ${extendedProps.grossSales}
          </div>
        )}
        {extendedProps.status && (
          <div className={`text-xs font-medium ${
            extendedProps.status === 'Confirmed' ? 'text-green-700' : 
            extendedProps.status === 'Unconfirmed' ? 'text-yellow-700' : 
            'text-orange-700'
          }`}>
            {extendedProps.status}
            {extendedProps.confirmedCount > 0 && extendedProps.unconfirmedCount > 0 && (
              <span className="ml-1">
                ({extendedProps.confirmedCount}✓ {extendedProps.unconfirmedCount}?)
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  function showVenueDetails(venue) {
    alert(`Show details for venue: ${venue.promo}`);
  }

  const handleSheetToggle = () => {
    const newSheet = currentSheet === 'TRAILER_HISTORY' ? 'CAMPER_HISTORY' : 'TRAILER_HISTORY'
    setCurrentSheet(newSheet)
  }

  // Month navigation functions
  const goToPreviousMonth = () => {
    console.log('Previous month clicked, currentMonth:', currentMonth)
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    console.log('New month (previous):', newMonth)
    setCurrentMonth(newMonth)
    
    // Navigate calendar to the new month
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      console.log('Calendar API available for previous month')
      console.log('Current calendar date before navigation:', calendarApi.getDate())
      
      // Try multiple navigation methods
      try {
        // Method 1: gotoDate
        calendarApi.gotoDate(newMonth)
        console.log('Calendar date after gotoDate:', calendarApi.getDate())
        
        // Method 2: Try with changeView to force refresh
        setTimeout(() => {
          console.log('Attempting changeView navigation to:', newMonth)
          calendarApi.changeView(view, newMonth)
          console.log('Calendar date after changeView:', calendarApi.getDate())
        }, 50)
        
        // Method 3: Try gotoDate again with longer delay
        setTimeout(() => {
          console.log('Attempting final gotoDate navigation to:', newMonth)
          calendarApi.gotoDate(newMonth)
          console.log('Calendar date after final gotoDate:', calendarApi.getDate())
        }, 150)
      } catch (error) {
        console.error('Error navigating calendar:', error)
      }
    } else {
      console.log('Calendar ref not available for previous month')
    }
  }

  const goToNextMonth = () => {
    console.log('Next month clicked, currentMonth:', currentMonth)
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    console.log('New month (next):', newMonth)
    setCurrentMonth(newMonth)
    
    // Navigate calendar to the new month
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      console.log('Calendar API available for next month')
      console.log('Current calendar date before navigation:', calendarApi.getDate())
      
      // Try multiple navigation methods
      try {
        // Method 1: gotoDate
        calendarApi.gotoDate(newMonth)
        console.log('Calendar date after gotoDate:', calendarApi.getDate())
        
        // Method 2: Try with changeView to force refresh
        setTimeout(() => {
          console.log('Attempting changeView navigation to:', newMonth)
          calendarApi.changeView(view, newMonth)
          console.log('Calendar date after changeView:', calendarApi.getDate())
        }, 50)
        
        // Method 3: Try gotoDate again with longer delay
        setTimeout(() => {
          console.log('Attempting final gotoDate navigation to:', newMonth)
          calendarApi.gotoDate(newMonth)
          console.log('Calendar date after final gotoDate:', calendarApi.getDate())
        }, 150)
      } catch (error) {
        console.error('Error navigating calendar:', error)
      }
    } else {
      console.log('Calendar ref not available for next month')
    }
  }

  const formatMonthYear = (date) => {
    const month = date.toLocaleDateString('en-US', { month: 'long' })
    const year = date.getFullYear()
    return `${month} ${year} (${year})`
  }

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          {/* Calendar Type Toggle */}
          <button
            onClick={handleSheetToggle}
            className="flex items-center px-4 py-2 text-sm font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-md transition-colors duration-200 border border-primary-300"
          >
            <span>
              {currentSheet === 'TRAILER_HISTORY' ? '🚛 Trailer' : '🏕️ Camper'}
            </span>
          </button>

          {/* View Toggle */}
          <div className="flex bg-secondary-100 rounded-lg p-1">
            <button
              onClick={() => handleViewChange('dayGridMonth')}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                view === 'dayGridMonth'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              )}
            >
              Month
            </button>
            <button
              onClick={() => handleViewChange('timeGridWeek')}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                view === 'timeGridWeek'
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              )}
            >
              Week
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousMonth}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="mr-1">&lt;</span>
              Previous Month
            </button>
            
            <div className="text-lg font-bold text-gray-900">
              {formatMonthYear(currentMonth)}
            </div>
            
            <button
              onClick={goToNextMonth}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Next Month
              <span className="ml-1">&gt;</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Work Day
          </button>
          
          <button
            onClick={handlePrint}
            className="btn-outline"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="card print-calendar-container">
        <div className="card-body p-0">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={false}
            initialView={view}
            views={{
              dayGridMonth: {
                titleFormat: { year: 'numeric', month: 'long' }
              },
              timeGridWeek: {
                titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
              }
            }}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventContent={renderEventContent}
            height="auto"
            eventDisplay="block"
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            datesSet={(dateInfo) => {
              // Update currentMonth when calendar view changes
              console.log('datesSet called with:', dateInfo.start)
              console.log('datesSet view type:', dateInfo.view.type)
              console.log('datesSet start/end:', dateInfo.start, 'to', dateInfo.end)
              
              // Temporarily disable automatic updates to see if this interferes with navigation
              // Only update if the change is significant (different month) AND not from manual navigation
              const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
              const newMonthStart = new Date(dateInfo.start.getFullYear(), dateInfo.start.getMonth(), 1)
              
              if (currentMonthStart.getTime() !== newMonthStart.getTime()) {
                console.log('datesSet detected month change, but skipping automatic update to test navigation')
                // setCurrentMonth(dateInfo.start) // Temporarily commented out
              } else {
                console.log('datesSet called but month unchanged, not updating currentMonth')
              }
            }}
            viewDidMount={(viewInfo) => {
            }}
            eventDidMount={(eventInfo) => {
              console.log('Event mounted:', eventInfo.event.title, 'grossSales:', eventInfo.event.extendedProps.grossSales, 'backgroundColor:', eventInfo.event.backgroundColor)
            }}
            dayCellDidMount={(arg) => {
              const dayCell = arg.el
              const date = arg.date
              
              // Add mouse enter handler
              dayCell.addEventListener('mouseenter', (e) => {
                handleDayMouseEnter({
                  date: date,
                  jsEvent: e
                })
              })
              
              // Add mouse leave handler
              dayCell.addEventListener('mouseleave', () => {
                handleDayMouseLeave()
              })
            }}
            slotLaneDidMount={(arg) => {
              // Only attach in week view
              if (view !== 'timeGridWeek') return;
              const laneCell = arg.el;
              const date = arg.date;
              laneCell.addEventListener('mouseenter', (e) => {
                handleDayMouseEnter({ date, jsEvent: e });
              });
              laneCell.addEventListener('mouseleave', () => {
                handleDayMouseLeave();
              });
            }}
            ref={calendarRef}
          />
        </div>
      </div>

      {/* Hover Popup */}
      {hoverPopup.show && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-secondary-200 p-3 transform transition-all duration-200 ease-out"
          style={{
            left: hoverPopup.x,
            top: hoverPopup.y,
            pointerEvents: 'none',
            opacity: hoverPopup.show ? 1 : 0,
            transform: `translate(${hoverPopup.show ? '0' : '-10px'}, ${hoverPopup.show ? '0' : '-10px'})`,
            maxWidth: '320px',
            minWidth: '280px'
          }}
        >
          <div className="mb-2">
            <h4 className="font-semibold text-secondary-900 text-sm mb-0.5">
              {hoverPopup.venue ? hoverPopup.venue.promo : 'Calendar Day'}
            </h4>
            {/* Average of last 5 non-zero gross sales */}
            {hoverPopup.sales && hoverPopup.sales.length > 0 && (() => {
              const nonZeroGross = hoverPopup.sales
                .map(v => typeof v.totalGross === 'number' ? v.totalGross : parseFloat(v.totalGross))
                .filter(gross => gross > 0);
              if (nonZeroGross.length === 0) return null;
              const avg = nonZeroGross.reduce((sum, val) => sum + val, 0) / nonZeroGross.length;
              const roundedAvg = Math.round(avg / 100) * 100;
              return (
                <div className="font-bold text-xs text-primary-700 mb-0.5">
                  Avg: ${roundedAvg.toLocaleString()}
                </div>
              );
            })()}
            <p className="text-xs text-secondary-600">
              {formatDate(hoverPopup.date)} - {hoverPopup.venue && hoverPopup.venue.id !== 'default' ? `Last 5 visits` : 'No Data Available'}
            </p>
          </div>
          
          {hoverPopup.sales && hoverPopup.sales.length > 0 ? (
            <div className="space-y-1">
              {hoverPopup.sales.map((visit, index) => (
                <div key={visit.date || index} className="border-l-2 border-primary-500 pl-2 py-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-secondary-900">
                      {formatDate(visit.date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-xs text-secondary-600">
                      Gross: ${visit.totalGross?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-secondary-500 italic">
                {hoverPopup.venue && hoverPopup.venue.id === 'default' 
                  ? 'No sales data available for this venue' 
                  : 'No visits recorded for this venue'}
              </p>
              <div className="text-xs text-secondary-400">
                <p>• Hover over days with events to see visit data</p>
                <p>• Add events to track work days and sales</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">
                Add Work Day
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-secondary-400 hover:text-secondary-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Event Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!newEvent.isWorkDay}
                      onChange={() => setNewEvent(prev => ({ ...prev, isWorkDay: false }))}
                      className="mr-2"
                    />
                    Sale
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={newEvent.isWorkDay}
                      onChange={() => setNewEvent(prev => ({ ...prev, isWorkDay: true }))}
                      className="mr-2"
                    />
                    Work Day
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder={newEvent.isWorkDay ? "Work Day" : "Sale Event"}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="input"
                />
              </div>

              {/* Venue (if not work day) */}
              {!newEvent.isWorkDay && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Venue
                  </label>
                  <select
                    value={newEvent.venueId}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, venueId: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select Venue</option>
                    {venuesData.map(venue => (
                      <option key={venue.id} value={venue.id}>
                        {venue.promo} - {venue.addressCity}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Worker */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Workers * (Hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  multiple
                  value={newEvent.workers}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, workers: Array.from(e.target.selectedOptions, option => option.value) }))}
                  className="input min-h-[100px]"
                  size="4"
                >
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.name}>
                      {worker.name} ({worker.role})
                    </option>
                  ))}
                </select>
                {newEvent.workers.length > 0 && (
                  <p className="text-xs text-secondary-600 mt-1">
                    Selected: {newEvent.workers.join(', ')}
                  </p>
                )}
              </div>

              {/* Hours */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Hours *
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={newEvent.hours}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, hours: e.target.value }))}
                  className="input"
                  placeholder="8"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="btn-primary"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">
                Edit Event
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-secondary-400 hover:text-secondary-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Event Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!newEvent.isWorkDay}
                      onChange={() => setNewEvent(prev => ({ ...prev, isWorkDay: false }))}
                      className="mr-2"
                    />
                    Sale
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={newEvent.isWorkDay}
                      onChange={() => setNewEvent(prev => ({ ...prev, isWorkDay: true }))}
                      className="mr-2"
                    />
                    Work Day
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder={newEvent.isWorkDay ? "Work Day" : "Sale Event"}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="input"
                />
              </div>

              {/* Venue (if not work day) */}
              {!newEvent.isWorkDay && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Venue
                  </label>
                  <select
                    value={newEvent.venueId}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, venueId: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select Venue</option>
                    {venuesData.map(venue => (
                      <option key={venue.id} value={venue.id}>
                        {venue.promo} - {venue.addressCity}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Worker */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Workers * (Hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  multiple
                  value={newEvent.workers}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, workers: Array.from(e.target.selectedOptions, option => option.value) }))}
                  className="input min-h-[100px]"
                  size="4"
                >
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.name}>
                      {worker.name} ({worker.role})
                    </option>
                  ))}
                </select>
                {newEvent.workers.length > 0 && (
                  <p className="text-xs text-secondary-600 mt-1">
                    Selected: {newEvent.workers.join(', ')}
                  </p>
                )}
              </div>

              {/* Hours */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Hours *
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={newEvent.hours}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, hours: e.target.value }))}
                  className="input"
                  placeholder="8"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={handleDeleteEvent}
                className="btn-danger"
              >
                Delete Event
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditEvent}
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarView 