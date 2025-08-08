import React, { useState, useEffect } from 'react'
import { Calendar, TrendingUp, BarChart3, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import supabaseAPI from '../services/supabaseAPI'
import { useApp } from '../contexts/AppContext'

const Bonuses = () => {
  const { staffData } = useApp()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [payrollData, setPayrollData] = useState({})
  const [dateRange, setDateRange] = useState(() => {
    // Default to current month
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1) // First day of current month
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of current month
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  })

  // Fetch stores and calculate payroll data
  useEffect(() => {
    
    const fetchData = async () => {
      try {
        const storesResult = await supabaseAPI.getStores()
        if (storesResult.success) {
          setStores(storesResult.data)
          await calculatePayrollForAllStores(storesResult.data)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const calculatePayrollForAllStores = async (storesData) => {
    const payrollResults = {}
    
    for (const store of storesData) {
      try {
        // Get staff for this store
        const storeStaff = staffData.filter(staff => staff.store_id === store.id)
        
        // Get schedule assignments for date range
        const scheduleResult = await supabaseAPI.getScheduleAssignmentsForDateRange(
          store.id, 
          dateRange.startDate, 
          dateRange.endDate
        )
        
        // Get sales data for date range
        const salesResult = await supabaseAPI.getSalesForDateRange(
          store.name, 
          dateRange.startDate, 
          dateRange.endDate
        )
        
        const storePayroll = []
        
        for (const staff of storeStaff) {
          // Get staff bonus tiers
          const bonusTiersResult = await supabaseAPI.getStaffBonusTiers(staff.id)
          const staffWithBonusTiers = {
            ...staff,
            bonus_tiers: bonusTiersResult.success ? bonusTiersResult.data : []
          }
          
          // Calculate hours from schedule assignments
          const staffHours = calculateStaffHours(scheduleResult.data || [], staff.id)
          
          // Get sales for this staff member (if applicable)
          const staffSales = salesResult.data || []
          
          // Calculate payroll
          const payroll = calculateStaffPayroll(staffWithBonusTiers, staffHours, staffSales)
          
          storePayroll.push({
            staff: staffWithBonusTiers,
            hours: staffHours,
            sales: staffSales,
            payroll
          })
        }
        
        payrollResults[store.id] = {
          store,
          staffPayroll: storePayroll,
          totalHours: storePayroll.reduce((sum, item) => sum + item.hours, 0),
          totalSales: salesResult.data ? salesResult.data.reduce((sum, sale) => sum + (parseFloat(sale.gross_sales) || 0), 0) : 0,
          totalPayroll: storePayroll.reduce((sum, item) => sum + item.payroll.total, 0)
        }
      } catch (error) {
        console.error(`Error calculating payroll for store ${store.name}:`, error)
        payrollResults[store.id] = {
          store,
          staffPayroll: [],
          totalHours: 0,
          totalSales: 0,
          totalPayroll: 0,
          error: error.message
        }
      }
    }
    
    setPayrollData(payrollResults)
  }

  const calculateStaffHours = (assignments, staffId) => {
    let totalHours = 0
    
    assignments.forEach(assignment => {
      if (assignment.staff_id === staffId && assignment.slot) {
        const startTime = new Date(`2000-01-01T${assignment.slot.start_time}`)
        const endTime = new Date(`2000-01-01T${assignment.slot.end_time}`)
        const hours = (endTime - startTime) / (1000 * 60 * 60)
        totalHours += hours
      }
    })
    
    return totalHours
  }

  const calculateStaffPayroll = (staff, hours, sales) => {
    let basePay = 0
    let hourlyRate = 0
    
    // Calculate base pay based on pay type
    if (staff.pay_type === 'salary' || staff.pay_type === 'salary+bonus') {
      // Salary is yearly, so we need to calculate the portion for this date range
      const yearlySalary = staff.salary_amount || 0
      
      // Calculate the number of days in the date range
      const [startYear, startMonth, startDay] = dateRange.startDate.split('-').map(Number)
      const [endYear, endMonth, endDay] = dateRange.endDate.split('-').map(Number)
      const startDate = new Date(startYear, startMonth - 1, startDay)
      const endDate = new Date(endYear, endMonth - 1, endDay)
      const daysInRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      
      // Calculate daily rate (yearly salary / 365 days)
      const dailyRate = yearlySalary / 365
      
      // Calculate base pay for this period
      basePay = dailyRate * daysInRange
      
      // For display purposes, calculate effective hourly rate
      hourlyRate = hours > 0 ? basePay / hours : 0
    } else {
      // Hourly pay
      hourlyRate = staff.hourly_rate || 15 // Default fallback
      basePay = hours * hourlyRate
    }
    
    // Calculate bonus from staff bonus tiers
    let bonus = 0
    if (staff.bonus_tiers && staff.bonus_tiers.length > 0) {
      const totalSales = sales.reduce((sum, sale) => sum + (parseFloat(sale.gross_sales) || 0), 0)
      
      // Find applicable bonus tier (sort by sales_target descending to get highest applicable tier)
      const sortedTiers = staff.bonus_tiers.sort((a, b) => b.sales_target - a.sales_target)
      const applicableTier = sortedTiers.find(tier => totalSales >= tier.sales_target)
      
      if (applicableTier) {
        bonus = applicableTier.bonus_amount
      }
    }
    
    return {
      basePay,
      bonus,
      total: basePay + bonus,
      hourlyRate,
      totalSales: sales.reduce((sum, sale) => sum + (parseFloat(sale.gross_sales) || 0), 0),
      payType: staff.pay_type || 'hourly'
    }
  }

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => {
      let newRange
      
      if (field === 'startDate') {
        // When start date changes, set end date to last day of that month
        const newStartDate = new Date(value)
        const lastDayOfMonth = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0)
        
        newRange = {
          startDate: value,
          endDate: lastDayOfMonth.toISOString().split('T')[0]
        }
      } else if (field === 'endDate') {
        // When end date changes, set start date to first day of that month
        const newEndDate = new Date(value)
        const firstDayOfMonth = new Date(newEndDate.getFullYear(), newEndDate.getMonth(), 1)
        
        newRange = {
          startDate: firstDayOfMonth.toISOString().split('T')[0],
          endDate: value
        }
      } else {
        newRange = {
          ...prev,
          [field]: value
        }
      }
      
      return newRange
    })
  }

  const navigateMonth = (direction) => {
    setDateRange(prev => {
      // Fix timezone issue by parsing the date string manually
      const [currentYear, currentMonth, currentDay] = prev.startDate.split('-').map(Number)
      const currentStart = new Date(currentYear, currentMonth - 1, currentDay)
      let newStart, newEnd
      
      if (direction === 'forward') {
        newStart = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 1)
        newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0)
      } else if (direction === 'backward') {
        newStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1)
        newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0)
      } else if (direction === 'current') {
        const now = new Date()
        newStart = new Date(now.getFullYear(), now.getMonth(), 1)
        newEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }
      
      return {
        startDate: newStart.toISOString().split('T')[0],
        endDate: newEnd.toISOString().split('T')[0]
      }
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bonuses</h1>
          <p className="mt-2 text-gray-600">Loading stores and calculating bonuses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center">
          <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bonuses</h1>
            <p className="mt-2 text-gray-600">View bonus calculations based on actual hours and sales data</p>
          </div>
        </div>
      </div>

             {/* Date Range Picker */}
       <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
         <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
           <div className="flex items-center">
             <Calendar className="w-5 h-5 mr-2 text-blue-600" />
             Date Range
           </div>
           <div className="flex items-center space-x-2">
             <button
               onClick={() => navigateMonth('backward')}
               className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
               title="Previous Month"
             >
               <ChevronLeft className="w-5 h-5" />
             </button>
                           <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                {(() => {
                  // Fix timezone issue by creating date in local timezone
                  const [year, month, day] = dateRange.startDate.split('-').map(Number)
                  const localDate = new Date(year, month - 1, day) // month is 0-indexed
                  return localDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                })()}
              </span>
             <button
               onClick={() => navigateMonth('forward')}
               className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
               title="Next Month"
             >
               <ChevronRight className="w-5 h-5" />
             </button>
             <button
               onClick={() => navigateMonth('current')}
               className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
               title="Go to Current Month"
             >
               Today
             </button>
           </div>
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Start Date
             </label>
                           <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
             
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               End Date
             </label>
                           <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
             
           </div>
         </div>
       </div>

      {/* Summary Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
          Overall Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stores.length}
            </div>
            <div className="text-sm text-gray-600">Total Stores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(payrollData).reduce((sum, storeData) => sum + (storeData?.totalHours || 0), 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${Object.values(payrollData).reduce((sum, storeData) => sum + (storeData?.totalSales || 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${Object.values(payrollData).reduce((sum, storeData) => sum + (storeData?.totalPayroll || 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Payroll</div>
          </div>
        </div>
      </div>

      {/* Stores List */}
      <div className="space-y-6">
        {stores.map((store) => {
          const storeData = payrollData[store.id]
          
          if (!storeData) {
            return (
              <div key={store.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{store.name}</h3>
                      <p className="text-gray-600">Store #{store.number}</p>
                    </div>
                  </div>
                  <div className="text-gray-500">Loading...</div>
                </div>
              </div>
            )
          }

          const { staffPayroll, totalHours, totalSales, totalPayroll, error } = storeData
          
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
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Payroll</div>
                    <div className="text-xl font-bold text-green-600">${totalPayroll.toFixed(2)}</div>
                  </div>
                </div>
                
                {/* Store Summary */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Hours:</span>
                    <span className="ml-2 font-medium">{totalHours.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Sales:</span>
                    <span className="ml-2 font-medium">${totalSales.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Staff Count:</span>
                    <span className="ml-2 font-medium">{staffPayroll.length}</span>
                  </div>
                </div>
              </div>

              {/* Staff Payroll Section */}
              <div className="p-6">
                {error ? (
                  <div className="text-red-600 text-center py-4">
                    Error loading data: {error}
                  </div>
                ) : staffPayroll.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No staff assigned to this store</p>
                ) : (
                  <div className="space-y-4">
                    {staffPayroll.map(({ staff, hours, sales, payroll }) => (
                      <div key={staff.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">{staff.name}</h5>
                            <p className="text-sm text-gray-600">{staff.role || 'Staff Member'}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">${payroll.total.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Total Pay</div>
                          </div>
                        </div>
                        
                                                 <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                           <div>
                             <p className="text-gray-600">Hours</p>
                             <p className="font-medium">{hours.toFixed(1)}</p>
                           </div>
                           <div>
                             <p className="text-gray-600">Rate</p>
                             <p className="font-medium">
                               {payroll.payType === 'salary' || payroll.payType === 'salary+bonus' 
                                 ? `$${payroll.hourlyRate.toFixed(2)}/hr (effective)`
                                 : `$${payroll.hourlyRate}/hr`
                               }
                             </p>
                           </div>
                           <div>
                             <p className="text-gray-600">Base Pay</p>
                             <p className="font-medium">${payroll.basePay.toFixed(2)}</p>
                           </div>
                           <div>
                             <p className="text-gray-600">Bonus</p>
                             <p className="font-medium text-green-600">${payroll.bonus.toFixed(2)}</p>
                           </div>
                         </div>

                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Sales Generated:</span>
                            <span className="font-medium">${payroll.totalSales.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Bonuses 