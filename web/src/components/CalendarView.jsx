import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Calendar, Users, Clock, MapPin, Plus, Printer } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatDate, parseDateString } from '../utils/dateUtils'
import { cn } from '../utils/cn'

const CalendarView = () => {
  const { venuesData, workers, currentSheet, salesData } = useApp()
  const [view, setView] = useState('dayGridMonth')
  const [events, setEvents] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]) // Pre-populate with today's date
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0], // Pre-populate with today's date
    worker: '',
    hours: '',
    venueId: '',
    isWorkDay: false
  })
  
  // Hover popup state
  const [hoverPopup, setHoverPopup] = useState({
    show: false,
    x: 0,
    y: 0,
    date: null,
    venue: null,
    sales: []
  })
  
  // Debug popup state changes
  useEffect(() => {
    console.log('Calendar Debug - Popup state changed:', hoverPopup)
  }, [hoverPopup])
  
  // Add timeout for popup to prevent flickering
  const hoverTimeoutRef = useRef(null)
  
  // Add calendar ref for programmatic navigation
  const calendarRef = useRef(null)

  // Try different possible venue ID field names
  const getVenueIdFromSale = (sale) => {
    return sale.venueId || sale.venue_id || sale.venue || sale.venueName || null
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
    
    console.log('Calendar Debug - getLast5VisitsForVenue called with venueId:', venueId)
    
    // Find the venue object to get its name
    const venue = venuesData.find(v => v.id === venueId)
    if (!venue) {
      console.log('Calendar Debug - Venue not found for ID:', venueId)
      return []
    }
    
    console.log('Calendar Debug - Found venue:', venue.promo)
    
    // Today's date in YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    // Filter sales for this venue by matching venue name, only before today, then sort by date (most recent first)
    const venueSales = salesData
      .filter(sale => {
        const saleVenueId = getVenueIdFromSale(sale)
        const saleDate = parseDateString(sale.date)
        return saleVenueId && saleVenueId === venue.promo && saleDate && saleDate.toISOString().split('T')[0] < todayStr
      })
      .sort((a, b) => {
        const dateA = parseDateString(a.date)
        const dateB = parseDateString(b.date)
        return dateB - dateA // Most recent first
      })
    
    console.log('Calendar Debug - Found venueSales:', venueSales.length)
    if (venueSales.length > 0) {
      console.log('Calendar Debug - Sample venueSale:', venueSales[0])
    }
    
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
    
    console.log('Calendar Debug - Date groups:', Object.keys(dateGroups))
    
    // Convert to array and take the last 5 dates
    const visits = Object.values(dateGroups)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
    
    console.log('Calendar Debug - Final visits:', visits)
    
    return visits
  }

  // Handle day hover using FullCalendar's proper event system
  const handleDayMouseEnter = (mouseEnterInfo) => {
    console.log('Calendar Debug - handleDayMouseEnter called with:', mouseEnterInfo)
    console.log('Calendar Debug - venuesData length:', venuesData.length)
    console.log('Calendar Debug - salesData length:', salesData.length)
    console.log('Calendar Debug - events length:', events.length)
    
    const { date, jsEvent } = mouseEnterInfo
    const dateStr = date.toISOString().split('T')[0]
    console.log('Calendar Debug - Date string:', dateStr)
    console.log('Calendar Debug - Current events:', events.length)
    console.log('Calendar Debug - Venues data available:', venuesData.length)
    console.log('Calendar Debug - Sales data available:', salesData.length)
    
    // Debug: Check data structure
    if (venuesData.length > 0) {
      console.log('Calendar Debug - Sample venue:', venuesData[0])
    }
    if (salesData.length > 0) {
      console.log('Calendar Debug - Sample sale:', salesData[0])
      console.log('Calendar Debug - Sale keys:', Object.keys(salesData[0]))
    }
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    // Set a small delay before showing the popup
    hoverTimeoutRef.current = setTimeout(() => {
      console.log('Calendar Debug - Timeout triggered, checking for events')
      
      // Always show a popup, even if no data
      const dayEvents = events.filter(event => event.date === dateStr)
      console.log('Calendar Debug - Day events found:', dayEvents.length)
      console.log('Calendar Debug - Day events:', dayEvents)
      
      // Get unique venues for this date from events
      const venuesFromEvents = dayEvents
        .map(event => event.extendedProps.venue)
        .filter(venue => venue) // Remove null/undefined
        .filter((venue, index, self) => self.findIndex(v => v.id === venue.id) === index) // Remove duplicates
      
      // Also check for any sales data for this date
      const salesForDate = salesData.filter(sale => {
        const saleDate = parseDateString(sale.date)
        return saleDate && saleDate.toISOString().split('T')[0] === dateStr
      })
      
      // Try different possible venue ID field names
      const venuesFromSales = salesForDate
        .map(sale => {
          const venueId = getVenueIdFromSale(sale)
          return venueId ? venuesData.find(v => v.id === venueId || v.promo === venueId) : null
        })
        .filter(venue => venue) // Remove null/undefined
        .filter((venue, index, self) => self.findIndex(v => v.id === venue.id) === index) // Remove duplicates
      
      // Also check for any venue that has sales data (regardless of date)
      const allVenuesWithSales = salesData
        .map(sale => {
          const venueId = getVenueIdFromSale(sale)
          return venueId ? venuesData.find(v => v.id === venueId || v.promo === venueId) : null
        })
        .filter(venue => venue) // Remove null/undefined
        .filter((venue, index, self) => self.findIndex(v => v.id === venue.id) === index) // Remove duplicates
      
      // Combine venues from all sources
      const allVenues = [...venuesFromEvents, ...venuesFromSales, ...allVenuesWithSales]
      const uniqueVenues = allVenues.filter((venue, index, self) => 
        self.findIndex(v => v.id === venue.id) === index
      )
      
      console.log('Calendar Debug - Venues from events:', venuesFromEvents.length)
      console.log('Calendar Debug - Venues from sales for date:', venuesFromSales.length)
      console.log('Calendar Debug - All venues with sales:', allVenuesWithSales.length)
      console.log('Calendar Debug - Total unique venues:', uniqueVenues.length)
      console.log('Calendar Debug - Venues:', uniqueVenues.map(v => ({ id: v.id, promo: v.promo })))
      
      // Debug: Check for Patwood Hospital specifically
      const patwoodVenue = venuesData.find(v => v.promo && v.promo.toLowerCase().includes('patwood'))
      if (patwoodVenue) {
        console.log('Calendar Debug - Found Patwood venue:', patwoodVenue)
        const patwoodSales = salesData.filter(sale => sale.venueId === patwoodVenue.id)
        console.log('Calendar Debug - Patwood sales count:', patwoodSales.length)
        if (patwoodSales.length > 0) {
          console.log('Calendar Debug - Sample Patwood sale:', patwoodSales[0])
        }
      }
      
      // If there are no venues from events or sales for this date, do not show the popup
      if (venuesFromEvents.length === 0 && venuesFromSales.length === 0) {
        setHoverPopup(prev => ({ ...prev, show: false }));
        return;
      }
      
      // Create a default venue if none found
      let defaultVenue = uniqueVenues.length > 0 ? uniqueVenues[0] : null
      console.log('Calendar Debug - Initial defaultVenue from uniqueVenues:', defaultVenue ? defaultVenue.promo : 'null')
      
      // If no venue found from events/sales for this date, try to find a venue with sales on this specific date
      if (!defaultVenue && salesForDate.length > 0) {
        console.log('Calendar Debug - No venue from uniqueVenues, checking salesForDate:', salesForDate.length)
        // Get unique venues that have sales on this specific date
        const venuesForThisDate = salesForDate
          .map(sale => {
            const venueId = getVenueIdFromSale(sale)
            console.log('Calendar Debug - Sale venueId:', venueId)
            const foundVenue = venueId ? venuesData.find(v => v.promo === venueId) : null
            console.log('Calendar Debug - Found venue for', venueId, ':', foundVenue ? foundVenue.promo : 'null')
            return foundVenue
          })
          .filter(venue => venue) // Remove null/undefined
          .filter((venue, index, self) => self.findIndex(v => v.id === venue.id) === index) // Remove duplicates
        
        console.log('Calendar Debug - Venues for this date:', venuesForThisDate.map(v => v.promo))
        
        if (venuesForThisDate.length > 0) {
          defaultVenue = venuesForThisDate[0]
          console.log('Calendar Debug - Using venue with sales on this date:', defaultVenue.promo)
        }
      }
      
      // If still no venue, show "No Data" for this date
      if (!defaultVenue) {
        defaultVenue = {
          id: 'no-data',
          promo: 'No Sales Data for This Date',
          addressCity: 'Unknown'
        }
        console.log('Calendar Debug - No venue found for this date, showing no data message')
      }
      
      console.log('Calendar Debug - Final selected venue:', defaultVenue.promo)
      
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
      if (defaultVenue.id !== 'default') {
        venueVisits = getLast5VisitsForVenue(defaultVenue.id)
        console.log('Calendar Debug - Visits for venue', defaultVenue.promo, ':', venueVisits.length)
        console.log('Calendar Debug - Visit data:', venueVisits)
        
        // Debug: Check all sales for this venue
        const allVenueSales = salesData.filter(sale => {
          const saleVenueId = getVenueIdFromSale(sale)
          return saleVenueId && saleVenueId === defaultVenue.promo
        })
        console.log('Calendar Debug - All sales for venue', defaultVenue.promo, ':', allVenueSales.length)
        console.log('Calendar Debug - Sample sales:', allVenueSales.slice(0, 3))
        
        // Debug: Check venue name matching
        const venueNamesInSales = [...new Set(salesData.map(sale => getVenueIdFromSale(sale)).filter(Boolean))]
        console.log('Calendar Debug - All venue names in sales:', venueNamesInSales)
        console.log('Calendar Debug - Current venue name:', defaultVenue.promo)
        console.log('Calendar Debug - Venue name match:', venueNamesInSales.includes(defaultVenue.promo))
      }
      
      // If no visits found and we have a real venue, add some test data to verify popup is working
      if (venueVisits.length === 0 && defaultVenue.id !== 'default' && defaultVenue.id !== 'no-data') {
        console.log('Calendar Debug - No visits found for real venue, adding test data')
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
      
      console.log('Calendar Debug - Setting popup with visits:', venueVisits.length)
      console.log('Calendar Debug - Visit data:', venueVisits)
      
      // Calculate popup position to ensure it stays within viewport
      const popupWidth = 320 // Fixed width from CSS
      const popupHeight = Math.min(venueVisits.length * 40 + 80, 280) // Dynamic height based on content
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
      
      // Only show popup if not a blank or test entry
      const isTestOrBlank = !defaultVenue ||
        defaultVenue.id === 'default' ||
        defaultVenue.id === 'no-data' ||
        (defaultVenue.promo && (
          defaultVenue.promo.toLowerCase().includes('no venue data') ||
          defaultVenue.promo.toLowerCase().includes('no sales data') ||
          defaultVenue.promo.toLowerCase().includes('test event')
        ));
      if (isTestOrBlank) {
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
      
      console.log('Calendar Debug - Popup set with venue:', defaultVenue.promo)
    }, 100) // Reduced from 200ms to 100ms delay
  }

  // Handle day mouse leave
  const handleDayMouseLeave = () => {
    console.log('Calendar Debug - handleDayMouseLeave called')
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
    console.log('Calendar Debug - selectedDate changed:', selectedDate)
    if (calendarRef.current && selectedDate) {
      const calendarApi = calendarRef.current.getApi()
      try {
        console.log('Calendar Debug - Navigating to date:', selectedDate)
        calendarApi.gotoDate(selectedDate)
        console.log('Calendar Debug - Navigation successful')
      } catch (error) {
        console.error('Error navigating to date:', error)
      }
    } else {
      console.log('Calendar Debug - Calendar ref or selectedDate not available:', { 
        hasRef: !!calendarRef.current, 
        selectedDate 
      })
    }
  }, [selectedDate])

  // Handle view change
  const handleViewChange = (newView) => {
    console.log('Calendar Debug - View change requested:', newView)
    setView(newView)
    // If we have a calendar ref, also change the view programmatically
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      try {
        console.log('Calendar Debug - Changing view programmatically:', newView)
        calendarApi.changeView(newView)
        console.log('Calendar Debug - View change successful')
      } catch (error) {
        console.error('Error changing view:', error)
      }
    } else {
      console.log('Calendar Debug - Calendar ref not available for view change')
    }
  }

  // Generate events from real sales data and venues
  useEffect(() => {
    const generatedEvents = []
    
    console.log('Calendar Debug - Real staff data:', workers)
    console.log('Calendar Debug - Real sales data:', salesData)
    console.log('Calendar Debug - Real venues data:', venuesData)
    
    // Add a simple test event to ensure calendar is working
    const today = new Date()
    generatedEvents.push({
      id: 'test-event',
      title: 'Test Event',
      date: today.toISOString().split('T')[0],
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      extendedProps: {
        type: 'test',
        worker: 'Test Worker',
        hours: '8'
      }
    })
    
    // Add test events for the next few days
    for (let i = 1; i <= 7; i++) {
      const testDate = new Date(today)
      testDate.setDate(today.getDate() + i)
      generatedEvents.push({
        id: `test-event-${i}`,
        title: `Test Event ${i}`,
        date: testDate.toISOString().split('T')[0],
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        extendedProps: {
          type: 'test',
          worker: 'Test Worker',
          hours: '8',
          venue: venuesData.length > 0 ? venuesData[0] : null
        }
      })
    }
    
    // Add sales events from real data
    salesData.forEach((sale, index) => {
      const saleDate = parseDateString(sale.date)
      if (saleDate) {
        const venue = venuesData.find(v => v.id === sale.venueId)
        const assignedWorker = workers[index % workers.length] || workers[0] || { name: 'Unassigned' }
        
        generatedEvents.push({
          id: `sale-${sale.id || index}`,
          title: `Sale: ${venue ? venue.promo : sale.venueId || 'Unknown Venue'}`,
          date: saleDate.toISOString().split('T')[0],
          backgroundColor: '#10b981', // Green for sales
          borderColor: '#10b981',
          extendedProps: {
            type: 'sale',
            sale: sale,
            venue: venue,
            worker: assignedWorker.name,
            hours: '8',
            address: venue ? venue.addressCity : 'Unknown',
            grossSales: sale.grossSales,
            netSales: sale.netSales,
            status: sale.status
          }
        })
      }
    })

    console.log('Calendar Debug - Generated events:', generatedEvents)
    console.log('Calendar Debug - All event dates:', generatedEvents.map(e => e.date))
    setEvents(generatedEvents)
  }, [venuesData, workers, salesData])

  const handleDateSelect = (selectInfo) => {
    setSelectedDate(selectInfo.startStr)
    setNewEvent({
      title: '',
      date: selectInfo.startStr,
      worker: '',
      hours: '',
      venueId: '',
      isWorkDay: false
    })
    setShowAddModal(true)
  }

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event
    console.log('Event clicked:', event)
    // In a real app, you might want to show event details or edit modal
  }

  const handleEventDrop = (dropInfo) => {
    const event = dropInfo.event
    console.log('Event dropped:', event)
    // Update event date in backend
  }

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.worker || !newEvent.hours) {
      alert('Please fill in all required fields')
      return
    }

    const event = {
      id: `new-${Date.now()}`,
      title: newEvent.title,
      date: newEvent.date,
      backgroundColor: newEvent.isWorkDay ? '#f59e0b' : '#3b82f6',
      borderColor: newEvent.isWorkDay ? '#f59e0b' : '#3b82f6',
      extendedProps: {
        type: newEvent.isWorkDay ? 'workday' : 'venue',
        worker: newEvent.worker,
        hours: newEvent.hours,
        venueId: newEvent.venueId,
        venue: venuesData.find(v => v.id === newEvent.venueId)
      }
    }

    setEvents([...events, event])
    setShowAddModal(false)
    setNewEvent({
      title: '',
      date: new Date().toISOString().split('T')[0], // Reset to today's date
      worker: '',
      hours: '',
      venueId: '',
      isWorkDay: false
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo
    const { extendedProps } = event
    
    return (
      <div className="p-1 text-xs">
        <div className="font-medium truncate">{event.title}</div>
        {extendedProps.worker && (
          <div className="flex items-center text-gray-600">
            <Users className="w-3 h-3 mr-1" />
            {extendedProps.worker}
          </div>
        )}
        {extendedProps.hours && (
          <div className="flex items-center text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            {extendedProps.hours}h
          </div>
        )}
        {extendedProps.address && (
          <div className="flex items-center text-gray-600">
            <MapPin className="w-3 h-3 mr-1" />
            {extendedProps.address}
          </div>
        )}
        {extendedProps.grossSales && (
          <div className="text-green-600 font-medium">
            ${extendedProps.grossSales}
          </div>
        )}
      </div>
    )
  }

  function showVenueDetails(venue) {
    alert(`Show details for venue: ${venue.promo}`);
  }

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
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

          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate || ''}
              onChange={(e) => {
                console.log('Calendar Debug - Date picker changed:', e.target.value)
                setSelectedDate(e.target.value)
              }}
              className="input max-w-xs cursor-pointer"
              style={{ 
                position: 'relative',
                zIndex: 10,
                backgroundColor: 'white'
              }}
            />
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
      <div className="card">
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
              console.log('Calendar Debug - Dates set:', dateInfo)
            }}
            viewDidMount={(viewInfo) => {
              console.log('Calendar Debug - View mounted:', viewInfo.view.type)
            }}
            eventDidMount={(eventInfo) => {
              console.log('Calendar Debug - Event mounted:', eventInfo.event.title)
            }}
            dayCellDidMount={(arg) => {
              console.log('Calendar Debug - Day cell mounted:', arg.date)
              const dayCell = arg.el
              const date = arg.date
              
              // Add mouse enter handler
              dayCell.addEventListener('mouseenter', (e) => {
                console.log('Calendar Debug - Mouse enter on day:', date.toISOString().split('T')[0])
                handleDayMouseEnter({
                  date: date,
                  jsEvent: e
                })
              })
              
              // Add mouse leave handler
              dayCell.addEventListener('mouseleave', () => {
                console.log('Calendar Debug - Mouse leave on day:', date.toISOString().split('T')[0])
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
                    Venue Event
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
                  placeholder={newEvent.isWorkDay ? "Work Day" : "Event Title"}
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
                  Worker *
                </label>
                <select
                  value={newEvent.worker}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, worker: e.target.value }))}
                  className="input"
                >
                  <option value="">Select Worker</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.name}>
                      {worker.name} ({worker.role})
                    </option>
                  ))}
                </select>
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
    </div>
  )
}

export default CalendarView 