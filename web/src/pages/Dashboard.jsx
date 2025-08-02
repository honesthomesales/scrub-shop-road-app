import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { TrendingUp, DollarSign, Calendar, Eye, X, ChevronDown } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import DashboardChart from '../components/DashboardChart'
import { formatCurrency, getMonthName, parseDateString, formatDate } from '../utils/dateUtils'

const Dashboard = () => {
  const { salesData, currentSheet, loading } = useApp()
  const [selectedMonthDetails, setSelectedMonthDetails] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYears, setSelectedYears] = useState([new Date().getFullYear()]) // Array of selected years
  const [selectedStores, setSelectedStores] = useState([]) // Changed to array for multi-select
  const [showStorePicker, setShowStorePicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [hoveredYear, setHoveredYear] = useState(null)
  const storePickerRef = useRef(null)
  const yearPickerRef = useRef(null)

  // Debounced filter states
  const [debouncedStores, setDebouncedStores] = useState([])
  const [debouncedYears, setDebouncedYears] = useState([new Date().getFullYear()])
  const [isFiltering, setIsFiltering] = useState(false)

  // Debounce timer refs
  const storeDebounceTimer = useRef(null)
  const yearDebounceTimer = useRef(null)

  // Click outside handler to close store picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (storePickerRef.current && !storePickerRef.current.contains(event.target)) {
        setShowStorePicker(false)
      }
      if (yearPickerRef.current && !yearPickerRef.current.contains(event.target)) {
        setShowYearPicker(false)
      }
    }

    if (showStorePicker || showYearPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStorePicker, showYearPicker])

  // Debounced store filter effect
  useEffect(() => {
    setIsFiltering(true)
    
    if (storeDebounceTimer.current) {
      clearTimeout(storeDebounceTimer.current)
    }

    storeDebounceTimer.current = setTimeout(() => {
      setDebouncedStores(selectedStores)
      setIsFiltering(false)
    }, 300) // 300ms debounce delay

    return () => {
      if (storeDebounceTimer.current) {
        clearTimeout(storeDebounceTimer.current)
      }
    }
  }, [selectedStores])

  // Debounced year filter effect
  useEffect(() => {
    setIsFiltering(true)
    
    if (yearDebounceTimer.current) {
      clearTimeout(yearDebounceTimer.current)
    }

    yearDebounceTimer.current = setTimeout(() => {
      setDebouncedYears(selectedYears)
      setIsFiltering(false)
    }, 300) // 300ms debounce delay

    return () => {
      if (yearDebounceTimer.current) {
        clearTimeout(yearDebounceTimer.current)
      }
    }
  }, [selectedYears])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (storeDebounceTimer.current) {
        clearTimeout(storeDebounceTimer.current)
      }
      if (yearDebounceTimer.current) {
        clearTimeout(yearDebounceTimer.current)
      }
    }
  }, [])

  // Map store numbers to store names
  const getStoreName = (storeNumber) => {
    const storeMap = {
      '1': 'Spartanburg',
      '3': 'Greenville', 
      '4': 'Columbia',
      '5': 'Trailer',
      '7': 'Camper'
    }
    return storeMap[storeNumber] || `Store ${storeNumber}`
  }

  // Multi-store picker options (matching the transformed data)
  const STORE_OPTIONS = [
    'Trailer',
    'Camper',
    'Spartanburg',
    'Greenville',
    'Columbia'
  ];

  const getUniqueStores = () => {
    const uniqueStores = Array.from(new Set(salesData.map(sale => sale.store).filter(Boolean)));
    // If no stores found in data, return the default options
    if (uniqueStores.length === 0) {
      return STORE_OPTIONS;
    }
    return uniqueStores;
  }

  // Filter data based on debounced store selection
  const getFilteredData = useCallback(() => {
    if (debouncedStores.length === 0) {
      return salesData // Show all stores when none selected
    }
    
    // Filter salesData by selected stores
    const filtered = salesData.filter(sale =>
      debouncedStores.includes(sale.store)
    );
    
    return filtered
  }, [debouncedStores, salesData])

  // Handle store selection/deselection with optimistic UI
  const handleStoreToggle = useCallback((store) => {
    setSelectedStores(prev => {
      if (prev.includes(store)) {
        return prev.filter(s => s !== store)
      } else {
        return [...prev, store]
      }
    })
  }, [])

  // Handle "Select All" stores
  const handleSelectAll = useCallback(() => {
    const allStores = getUniqueStores()
    setSelectedStores(allStores)
  }, [])

  // Handle "Clear All" stores
  const handleClearAll = useCallback(() => {
    setSelectedStores([])
  }, [])

  // Year picker handlers with optimistic UI
  const handleYearToggle = useCallback((year) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        // Remove year if already selected
        const newYears = prev.filter(y => y !== year)
        // Ensure at least one year is selected
        return newYears.length > 0 ? newYears : [new Date().getFullYear()]
      } else {
        // Add year if not selected and under 5 year limit
        if (prev.length < 5) {
          return [...prev, year].sort((a, b) => b - a) // Sort descending
        }
        return prev
      }
    })
  }, [])

  const handleSelectAllYears = useCallback(() => {
    const currentYear = new Date().getFullYear()
    const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4]
    setSelectedYears(years)
  }, [])

  const handleClearAllYears = useCallback(() => {
    setSelectedYears([new Date().getFullYear()])
  }, [])

  const getSelectedYearsText = () => {
    if (selectedYears.length === 0) return 'Select Years'
    if (selectedYears.length === 1) return selectedYears[0].toString()
    if (selectedYears.length === 5) return 'All Years'
    return `${selectedYears.length} Years Selected`
  }

  // Get display text for selected stores
  const getSelectedStoresText = () => {
    if (selectedStores.length === 0) {
      return 'All Stores'
    }
    if (selectedStores.length === 1) {
      return selectedStores[0]
    }
    if (selectedStores.length === getUniqueStores().length) {
      return 'All Stores'
    }
    return `${selectedStores.length} Stores Selected`
  }

  // Calculate summary statistics using debounced filters
  const calculateStats = useCallback(() => {
    const filteredData = getFilteredData()
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Use debounced years instead of selected years
    const selectedYearsData = {}
    
    // Calculate data for each selected year
    debouncedYears.forEach(year => {
      const yearSales = filteredData.filter(sale => {
        const saleDate = parseDateString(sale.date);
        return saleDate && saleDate.getFullYear() === year;
      });
      
      const totalGross = yearSales.reduce((sum, sale) => sum + (sale.grossSales || 0), 0);
      const positiveSalesCount = yearSales.filter(sale => (sale.grossSales || 0) > 0).length;
      
      // Calculate monthly average
      let monthsToCount;
      let monthlyAverage;
      let averagePerSale;
      
      if (year === currentYear) {
        // For current year, use data from January through the last completed month
        const lastCompletedMonth = Math.max(0, currentMonth - 1); // Previous month (0-indexed)
        monthsToCount = lastCompletedMonth + 1; // Number of completed months (1-indexed)
        
        // Get sales for all months from January through the last completed month
        const completedMonthsSales = yearSales.filter(sale => {
          const saleDate = parseDateString(sale.date);
          return saleDate && saleDate.getMonth() <= lastCompletedMonth;
        });
        
        const completedMonthsGross = completedMonthsSales.reduce((sum, sale) => sum + (sale.grossSales || 0), 0);
        const completedMonthsPositiveSales = completedMonthsSales.filter(sale => (sale.grossSales || 0) > 0).length;
        
        // Per month average = Total gross sales for completed months ÷ number of completed months
        monthlyAverage = monthsToCount > 0 ? Math.round(completedMonthsGross / monthsToCount) : 0;
        
        // Per sale average = Total gross sales for completed months ÷ number of positive sales in completed months
        averagePerSale = completedMonthsPositiveSales > 0 ? Math.round(completedMonthsGross / completedMonthsPositiveSales) : 0;
      } else {
        // For past years, use all 12 months
        monthsToCount = 12;
        monthlyAverage = monthsToCount > 0 ? Math.round(totalGross / monthsToCount) : 0;
        averagePerSale = positiveSalesCount > 0 ? Math.round(totalGross / positiveSalesCount) : 0;
      }
      
      selectedYearsData[year] = {
        totalGross: Math.round(totalGross),
        positiveSalesCount,
        monthlyAverage,
        averagePerSale,
        monthsToCount
      };
    });

    // All sales for selected month (use the first selected year for month selection)
    const primaryYear = debouncedYears[0] || currentYear;
    const monthSales = filteredData.filter(sale => {
      const saleDate = parseDateString(sale.date);
      return saleDate && saleDate.getMonth() === selectedMonth && saleDate.getFullYear() === primaryYear;
    });

    // For aggregated data, all sales are considered "confirmed" since they represent actual transactions
    const confirmedMonthSales = monthSales;

    // Total gross sales for selected month
    const monthTotalGross = monthSales.reduce((sum, sale) => sum + (sale.grossSales || 0), 0);

    // Sales for selected month with positive gross sales
    const positiveMonthSalesCount = monthSales.filter(sale => (sale.grossSales || 0) > 0).length;

    return {
      selectedYearsData,
      confirmedMonthSalesCount: confirmedMonthSales.length,
      positiveMonthSalesCount,
      monthTotalGross: Math.round(monthTotalGross),
      primaryYear
    };
  }, [getFilteredData, debouncedYears, selectedMonth]);

  // Calculate stats whenever debounced filters change
  const stats = useMemo(() => calculateStats(), [calculateStats]);

  // Generate month options for dropdown
  const monthOptions = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' }
  ];

  const getSelectedMonthName = () => {
    return monthOptions.find(option => option.value === selectedMonth)?.label || 'Unknown';
  };

  // Generate monthly stats table data using debounced filters
  const generateMonthlyStats = useCallback(() => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    const allMonthlyStats = []
    
    // Generate stats for each month across selected years
    months.forEach((month, index) => {
      const monthData = {
        month,
        monthIndex: index,
        years: {}
      }
      
      let hasData = false
      
      // Generate stats for each selected year
      debouncedYears.forEach(year => {
        const yearSales = getFilteredData().filter(sale => {
          const saleDate = parseDateString(sale.date)
          return saleDate && saleDate.getMonth() === index && saleDate.getFullYear() === year
        })
        
        const totalGross = yearSales.reduce((sum, sale) => sum + (sale.grossSales || 0), 0)
        const confirmedSales = yearSales.length
        const positiveSales = yearSales.filter(sale => (sale.grossSales || 0) > 0).length
        
        monthData.years[year] = {
          salesCount: yearSales.length,
          confirmedSales,
          positiveSales,
          totalGross,
          sales: yearSales
        }
        
        if (yearSales.length > 0) {
          hasData = true
        }
      })
      
      // Only include months that have data in any of the selected years
      if (hasData) {
        allMonthlyStats.push(monthData)
      }
    })
    
    return allMonthlyStats
  }, [getFilteredData, debouncedYears])

  const monthlyStats = useMemo(() => generateMonthlyStats(), [generateMonthlyStats]);

  const handleShowMonthDetails = (monthData) => {
    setSelectedMonthDetails(monthData)
  }

  const handleCloseMonthDetails = () => {
    setSelectedMonthDetails(null)
  }

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value))
  }

  // Update getVenueName to show store for Trailer/Camper, venue for others
  const getVenueName = (sale) => {
    if (sale.store === 'Trailer' || sale.store === 'Camper') {
      return sale.store
    }
    return sale.venue || sale.store || 'N/A'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-success-100 text-success-800'
      case 'Pending':
        return 'bg-warning-100 text-warning-800'
      case 'Closed':
        return 'bg-secondary-100 text-secondary-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we load your data</p>
        </div>
      </div>
    )
  }

  // If we have no data but aren't loading, show a basic dashboard
  if (salesData.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900">
              Dashboard
            </h1>
            <p className="mt-2 text-secondary-600">
              Sales analytics and performance overview for {currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'} operations
            </p>
          </div>

          {/* No Data Message */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data Available</h3>
            <p className="text-gray-500 mb-4">
              Your dashboard will show sales analytics once you have data in your system.
            </p>
            <p className="text-sm text-gray-400">
              Try adding some sales entries or check your data connection.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">
                Dashboard
              </h1>
              <p className="mt-2 text-secondary-600">
                Sales analytics and performance overview for {currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'} operations
              </p>
            </div>
            
            {/* Multi-Store Picker */}
            <div className="mt-4 sm:mt-0 relative" ref={storePickerRef}>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Filter by Store
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStorePicker(!showStorePicker)}
                  className="block w-full sm:w-64 px-3 py-2 border border-secondary-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-left"
                >
                  <span className="block truncate">{getSelectedStoresText()}</span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-4 w-4 text-secondary-400" />
                  </span>
                </button>
                
                {showStorePicker && (
                  <div className="absolute z-60 mt-1 w-full sm:w-64 bg-white shadow-lg border border-secondary-300 rounded-md">
                    <div className="p-2 border-b border-secondary-200">
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-xs text-secondary-600 hover:text-secondary-800 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {getUniqueStores().map((store) => (
                        <label
                          key={store}
                          className="flex items-center px-3 py-2 hover:bg-secondary-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStores.includes(store)}
                            onChange={() => handleStoreToggle(store)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                          <span className="ml-3 text-sm text-secondary-900">{store}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Year Picker */}
            <div className="mt-4 sm:mt-0 relative mr-4" ref={yearPickerRef}>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Select Years
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowYearPicker(!showYearPicker)}
                  className="block w-full sm:w-48 px-3 py-2 border border-secondary-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-left"
                >
                  <span className="block truncate">{getSelectedYearsText()}</span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-4 w-4 text-secondary-400" />
                  </span>
                </button>
                
                {showYearPicker && (
                  <div className="absolute z-60 mt-1 w-full sm:w-48 bg-white shadow-lg border border-secondary-300 rounded-md">
                    <div className="p-2 border-b border-secondary-200">
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={handleSelectAllYears}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllYears}
                          className="text-xs text-secondary-600 hover:text-secondary-800 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <label
                          key={year}
                          className="flex items-center px-3 py-2 hover:bg-secondary-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedYears.includes(year)}
                            onChange={() => handleYearToggle(year)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                          />
                          <span className="ml-3 text-sm text-secondary-900">{year}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-[18rem_1fr_22rem] gap-6 mb-8 items-stretch">
          {/* Total Gross Sales Card */}
          <div className="card flex flex-col justify-between min-h-[200px]" style={{minWidth: '0', maxWidth: '18rem'}}>
            <div className="card-body flex flex-col justify-between h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0 flex items-center h-full pr-2">
                  <DollarSign className="h-10 w-10 text-primary-600" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-base font-bold text-primary-700 mb-2 whitespace-nowrap">Total Gross Sales</p>
                  {isFiltering ? (
                    <div className="flex flex-col gap-1">
                      {selectedYears.map(year => (
                        <div key={year} className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap">
                          {year} - <div className="animate-pulse bg-gray-200 h-6 w-20 ml-2 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {debouncedYears.map(year => (
                        <span key={year} className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap">
                          {year} - ${stats.selectedYearsData[year]?.totalGross.toLocaleString() || '0'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sales This Month Card */}
          <div className="card flex flex-col justify-between min-h-[200px]" style={{minWidth: '0', maxWidth: '40rem'}}>
            <div className="card-body flex flex-col justify-between h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0 flex items-center h-full pr-2">
                  <Calendar className="h-10 w-10 text-primary-600" />
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-2 min-w-0">
                    <p className="text-base font-bold text-primary-700 whitespace-nowrap">
                      Month Sales [{currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'} Only]
                    </p>
                    <div className="flex-shrink-0">
                      <select
                        value={selectedMonth}
                        onChange={handleMonthChange}
                        className="text-xs border border-secondary-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        style={{maxWidth: '8rem'}}
                      >
                        {monthOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {isFiltering ? (
                    <div className="space-y-2">
                      <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
                      <div className="animate-pulse bg-gray-200 h-6 w-40 rounded"></div>
                      <div className="animate-pulse bg-gray-200 h-6 w-48 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap" style={{minHeight: '2.5rem'}}>
                        Confirmed: {stats.confirmedMonthSalesCount}
                      </p>
                      <p className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap" style={{minHeight: '2.5rem'}}>
                        Completed Sales: {stats.positiveMonthSalesCount}
                      </p>
                      <p className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap" style={{minHeight: '2.5rem'}}>
                        Total Gross Sales ({getSelectedMonthName()} {stats.primaryYear}): ${stats.monthTotalGross.toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Average Card */}
          <div className="card flex flex-col justify-between min-h-[200px]" style={{minWidth: '0', maxWidth: '22rem'}}>
            <div className="card-body flex flex-col justify-between h-full">
              <div className="flex items-center h-full">
                <div className="flex-shrink-0 flex items-center h-full pr-2">
                  <TrendingUp className="h-10 w-10 text-primary-600" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-base font-bold text-primary-700 mb-2 whitespace-nowrap">Average</p>
                  {isFiltering ? (
                    <div className="text-xs w-full">
                      <div className="grid grid-cols-3 gap-2 mb-1">
                        <div></div>
                        <div className="text-primary-700 font-bold whitespace-nowrap text-base">Per Sale</div>
                        <div className="text-primary-700 font-bold whitespace-nowrap text-base">Per Month</div>
                      </div>
                      {selectedYears.map(year => (
                        <div key={year} className="grid grid-cols-3 gap-2">
                          <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">{year}</div>
                          <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                          <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs w-full">
                      <div className="grid grid-cols-3 gap-2 mb-1">
                        <div></div>
                        <div className="text-primary-700 font-bold whitespace-nowrap text-base">Per Sale</div>
                        <div className="text-primary-700 font-bold whitespace-nowrap text-base">Per Month</div>
                      </div>
                      {debouncedYears.map(year => (
                        <div key={year} className="grid grid-cols-3 gap-2">
                          <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">{year}</div>
                          <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">
                            ${stats.selectedYearsData[year]?.averagePerSale.toLocaleString() || '0'}
                          </div>
                          <div 
                            className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap cursor-help relative group"
                            onMouseEnter={() => setHoveredYear(year)}
                            onMouseLeave={() => setHoveredYear(null)}
                          >
                            ${stats.selectedYearsData[year]?.monthlyAverage.toLocaleString() || '0'}
                            {hoveredYear === year && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
                                <div>{stats.selectedYearsData[year]?.monthsToCount || 0} month{(stats.selectedYearsData[year]?.monthsToCount || 0) !== 1 ? 's' : ''} used</div>
                                <div>Total: ${stats.selectedYearsData[year]?.totalGross.toLocaleString() || '0'}</div>
                                <div>Monthly Average: ${stats.selectedYearsData[year]?.monthlyAverage.toLocaleString() || '0'}</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* Show months used in calculation for the primary year */}
                      <div className="mt-2 text-xs text-secondary-600">
                        {stats.primaryYear === new Date().getFullYear() 
                          ? `Based on ${stats.selectedYearsData[stats.primaryYear]?.monthsToCount || 0} month${(stats.selectedYearsData[stats.primaryYear]?.monthsToCount || 0) !== 1 ? 's' : ''} (Jan - ${monthOptions[Math.max(0, new Date().getMonth() - 1)]?.label || 'Previous Month'})`
                          : 'Based on 12 months'
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-8">
          {isFiltering ? (
            <div className="card">
              <div className="card-body">
                <div className="animate-pulse">
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ) : (
            <DashboardChart salesData={getFilteredData()} currentSheet={currentSheet} selectedYears={debouncedYears} />
          )}
        </div>

        {/* Monthly Stats Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">
              Monthly Sales Statistics - Last 3 Years
            </h3>
          </div>
          <div className="card-body">
            {isFiltering ? (
              <div className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Month</th>
                      {debouncedYears.map(year => (
                        <th key={year} className="table-header-cell" colSpan="3">{year}</th>
                      ))}
                      <th className="table-header-cell">Actions</th>
                    </tr>
                    <tr>
                      <th className="table-header-cell"></th>
                      {debouncedYears.map(year => (
                        <React.Fragment key={year}>
                          <th className="table-header-cell text-xs">Sales</th>
                          <th className="table-header-cell text-xs">Confirmed</th>
                          <th className="table-header-cell text-xs">Gross Sales</th>
                        </React.Fragment>
                      ))}
                      <th className="table-header-cell"></th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {monthlyStats.map((stat, index) => (
                      <tr key={index} className="table-row">
                        <td className="table-cell font-medium">{stat.month}</td>
                        {debouncedYears.map(year => (
                          <React.Fragment key={year}>
                            <td className="table-cell">{stat.years[year]?.salesCount || 0}</td>
                            <td className="table-cell">{stat.years[year]?.confirmedSales || 0}</td>
                            <td className="table-cell font-semibold">
                              {formatCurrency(stat.years[year]?.totalGross || 0)}
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="table-cell">
                          <button
                            onClick={() => handleShowMonthDetails(stat)}
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Month Details Modal */}
      {selectedMonthDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h3 className="text-xl font-semibold text-secondary-900">
                {selectedMonthDetails.month} Sales Details - {selectedYears.length} Year{selectedYears.length !== 1 ? 's' : ''}
              </h3>
              <button
                onClick={handleCloseMonthDetails}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Summary Stats for Selected Years */}
              <div className={`grid gap-4 mb-6 ${selectedYears.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {selectedYears.map((year, index) => {
                  const colors = [
                    'bg-blue-50 border-blue-200 text-blue-900',
                    'bg-green-50 border-green-200 text-green-900', 
                    'bg-purple-50 border-purple-200 text-purple-900',
                    'bg-orange-50 border-orange-200 text-orange-900',
                    'bg-pink-50 border-pink-200 text-pink-900'
                  ]
                  const colorClass = colors[index % colors.length]
                  const yearData = selectedMonthDetails.years[year]
                  
                  return (
                    <div key={year} className={`p-4 rounded-lg border ${colorClass}`}>
                      <h4 className="text-lg font-semibold mb-3">{year}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-opacity-80">Total Sales:</p>
                          <p className="font-bold">{yearData?.salesCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-opacity-80">Confirmed:</p>
                          <p className="font-bold">{yearData?.confirmedSales || 0}</p>
                        </div>
                        <div>
                          <p className="text-opacity-80">Positive:</p>
                          <p className="font-bold">{yearData?.positiveSales || 0}</p>
                        </div>
                        <div>
                          <p className="text-opacity-80">Gross Sales:</p>
                          <p className="font-bold">{formatCurrency(yearData?.totalGross || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Sales Details Tables for Selected Years */}
              <div className="space-y-6">
                {selectedYears.map((year, index) => {
                  const colors = [
                    'text-blue-900',
                    'text-green-900', 
                    'text-purple-900',
                    'text-orange-900',
                    'text-pink-900'
                  ]
                  const colorClass = colors[index % colors.length]
                  const yearData = selectedMonthDetails.years[year]
                  
                  return (
                    <div key={year}>
                      <h4 className={`text-lg font-semibold ${colorClass} mb-3`}>{year} Sales</h4>
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead className="table-header">
                            <tr>
                              <th className="table-header-cell">Date</th>
                              <th className="table-header-cell">Store</th>
                              <th className="table-header-cell">Gross Sales</th>
                              <th className="table-header-cell">Net Sales</th>
                              <th className="table-header-cell">Sales Tax</th>
                              <th className="table-header-cell">Entries</th>
                            </tr>
                          </thead>
                          <tbody className="table-body">
                            {yearData?.sales.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="table-cell text-center text-secondary-500 py-8">
                                  No sales entries found for {selectedMonthDetails.month} {year}
                                </td>
                              </tr>
                            ) : (
                              yearData?.sales.map((sale) => (
                                <tr key={sale.id} className="table-row">
                                  <td className="table-cell font-medium">
                                    {formatDate(sale.date)}
                                  </td>
                                  <td className="table-cell">
                                    {getVenueName(sale)}
                                  </td>
                                  <td className="table-cell font-semibold">
                                    {formatCurrency(sale.grossSales)}
                                  </td>
                                  <td className="table-cell font-semibold">
                                    {formatCurrency(sale.netSales)}
                                  </td>
                                  <td className="table-cell font-semibold">
                                    {formatCurrency(sale.salesTax)}
                                  </td>
                                  <td className="table-cell font-medium">
                                    {sale.count || 1}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
