import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Clock, DollarSign, Calendar, Download, Filter } from 'lucide-react'

const SchedulerReports = ({ 
  storeId, 
  storeName, 
  staffData, 
  schedules, 
  salesData, 
  commissionTiers
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [reportType, setReportType] = useState('staff-hours')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)

  // Generate report based on type
  const generateReport = async () => {
    setLoading(true)
    
    try {
      let data = null
      
      switch (reportType) {
        case 'staff-hours':
          data = generateStaffHoursReport()
          break
        case 'sales-performance':
          data = generateSalesPerformanceReport()
          break
        case 'payroll-summary':
          data = generatePayrollSummaryReport()
          break
        case 'schedule-coverage':
          data = generateScheduleCoverageReport()
          break
        case 'commission-analysis':
          data = generateCommissionAnalysisReport()
          break
        default:
          data = generateStaffHoursReport()
      }
      
      setReportData(data)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  // Staff Hours Report
  const generateStaffHoursReport = () => {
    const staffHours = staffData.map(staff => {
      const staffSchedules = schedules.filter(s => 
        s.staff_id === staff.id && 
        s.date >= selectedPeriod.startDate && 
        s.date <= selectedPeriod.endDate
      )

      const totalHours = staffSchedules.reduce((total, schedule) => {
        const startTime = new Date(`2000-01-01T${schedule.start_time}`)
        const endTime = new Date(`2000-01-01T${schedule.end_time}`)
        const hours = (endTime - startTime) / (1000 * 60 * 60)
        return total + hours
      }, 0)

      const shiftsCount = staffSchedules.length
      const avgHoursPerShift = shiftsCount > 0 ? totalHours / shiftsCount : 0

      return {
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        totalHours,
        shiftsCount,
        avgHoursPerShift,
        schedules: staffSchedules
      }
    })

    return {
      type: 'staff-hours',
      title: 'Staff Hours Report',
      period: selectedPeriod,
      data: staffHours,
      summary: {
        totalHours: staffHours.reduce((sum, staff) => sum + staff.totalHours, 0),
        totalShifts: staffHours.reduce((sum, staff) => sum + staff.shiftsCount, 0),
        avgHoursPerStaff: staffHours.length > 0 ? 
          staffHours.reduce((sum, staff) => sum + staff.totalHours, 0) / staffHours.length : 0
      }
    }
  }

  // Sales Performance Report
  const generateSalesPerformanceReport = () => {
    const salesByDate = salesData.reduce((acc, sale) => {
      if (!acc[sale.date]) {
        acc[sale.date] = { date: sale.date, totalSales: 0, staffCount: 0 }
      }
      acc[sale.date].totalSales += sale.total_sales || 0
      
      // Count staff working on this date
      const staffWorking = schedules.filter(s => s.date === sale.date)
      acc[sale.date].staffCount = staffWorking.length
      
      return acc
    }, {})

    const salesPerStaff = staffData.map(staff => {
      const staffSchedules = schedules.filter(s => 
        s.staff_id === staff.id && 
        s.date >= selectedPeriod.startDate && 
        s.date <= selectedPeriod.endDate
      )

      const totalHours = staffSchedules.reduce((total, schedule) => {
        const startTime = new Date(`2000-01-01T${schedule.start_time}`)
        const endTime = new Date(`2000-01-01T${schedule.end_time}`)
        const hours = (endTime - startTime) / (1000 * 60 * 60)
        return total + hours
      }, 0)

      // Calculate sales per hour (mock data for now)
      const salesPerHour = totalHours > 0 ? 150 : 0 // Mock $150/hour

      return {
        staffId: staff.id,
        staffName: staff.name,
        totalHours,
        salesPerHour,
        totalSales: totalHours * salesPerHour
      }
    })

    return {
      type: 'sales-performance',
      title: 'Sales Performance Report',
      period: selectedPeriod,
      data: {
        salesByDate: Object.values(salesByDate),
        salesPerStaff
      },
      summary: {
        totalSales: salesData.reduce((sum, sale) => sum + (sale.total_sales || 0), 0),
        avgSalesPerDay: salesData.length > 0 ? 
          salesData.reduce((sum, sale) => sum + (sale.total_sales || 0), 0) / salesData.length : 0,
        totalStaffHours: staffData.reduce((sum, staff) => {
          const staffSchedules = schedules.filter(s => 
            s.staff_id === staff.id && 
            s.date >= selectedPeriod.startDate && 
            s.date <= selectedPeriod.endDate
          )
          const hours = staffSchedules.reduce((total, schedule) => {
            const startTime = new Date(`2000-01-01T${schedule.start_time}`)
            const endTime = new Date(`2000-01-01T${schedule.end_time}`)
            const hours = (endTime - startTime) / (1000 * 60 * 60)
            return total + hours
          }, 0)
          return sum + hours
        }, 0)
      }
    }
  }

  // Payroll Summary Report
  const generatePayrollSummaryReport = () => {
    const payrollData = staffData.map(staff => {
      const staffSchedules = schedules.filter(s => 
        s.staff_id === staff.id && 
        s.date >= selectedPeriod.startDate && 
        s.date <= selectedPeriod.endDate
      )

      const totalHours = staffSchedules.reduce((total, schedule) => {
        const startTime = new Date(`2000-01-01T${schedule.start_time}`)
        const endTime = new Date(`2000-01-01T${schedule.end_time}`)
        const hours = (endTime - startTime) / (1000 * 60 * 60)
        return total + hours
      }, 0)

      // Calculate pay based on staff type
      let basePay = 0
      let commission = 0

      if (staff.payType === 'hourly') {
        basePay = totalHours * (staff.hourlyRate || 0)
      } else if (staff.payType === 'salary' || staff.payType === 'salary+bonus') {
        // Salary is yearly, calculate portion for this period
        const yearlySalary = staff.salaryAmount || 0
        
        // Calculate the number of days in the selected period
        const startDate = new Date(selectedPeriod.startDate)
        const endDate = new Date(selectedPeriod.endDate)
        const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
        
        // Calculate daily rate (yearly salary / 365 days)
        const dailyRate = yearlySalary / 365
        
        // Calculate base pay for this period
        basePay = dailyRate * daysInPeriod
        
        // Calculate commission using flat rate bonus system for salary+bonus
        if (staff.payType === 'salary+bonus') {
          const salesAmount = totalHours * 150 // Mock sales per hour
          const applicableTier = commissionTiers
            .sort((a, b) => b.sales_target - a.sales_target)
            .find(tier => salesAmount >= tier.sales_target)
          
          if (applicableTier) {
            commission = applicableTier.bonus_amount
          }
        }
      }

      return {
        staffId: staff.id,
        staffName: staff.name,
        payType: staff.payType,
        totalHours,
        basePay,
        commission,
        totalPay: basePay + commission
      }
    })

    return {
      type: 'payroll-summary',
      title: 'Payroll Summary Report',
      period: selectedPeriod,
      data: payrollData,
      summary: {
        totalBasePay: payrollData.reduce((sum, pay) => sum + pay.basePay, 0),
        totalCommission: payrollData.reduce((sum, pay) => sum + pay.commission, 0),
        totalPayroll: payrollData.reduce((sum, pay) => sum + pay.totalPay, 0),
        avgPayPerStaff: payrollData.length > 0 ? 
          payrollData.reduce((sum, pay) => sum + pay.totalPay, 0) / payrollData.length : 0
      }
    }
  }

  // Schedule Coverage Report
  const generateScheduleCoverageReport = () => {
    const coverageByDate = {}
    
    // Get all dates in the period
    const startDate = new Date(selectedPeriod.startDate)
    const endDate = new Date(selectedPeriod.endDate)
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0]
      const daySchedules = schedules.filter(s => s.date === dateString)
      
      coverageByDate[dateString] = {
        date: dateString,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        staffCount: daySchedules.length,
        totalHours: daySchedules.reduce((total, schedule) => {
          const startTime = new Date(`2000-01-01T${schedule.start_time}`)
          const endTime = new Date(`2000-01-01T${schedule.end_time}`)
          const hours = (endTime - startTime) / (1000 * 60 * 60)
          return total + hours
        }, 0),
        staffList: daySchedules.map(s => {
          const staff = staffData.find(st => st.id === s.staff_id)
          return staff ? staff.name : 'Unknown'
        })
      }
    }

    return {
      type: 'schedule-coverage',
      title: 'Schedule Coverage Report',
      period: selectedPeriod,
      data: Object.values(coverageByDate),
      summary: {
        totalDays: Object.keys(coverageByDate).length,
        avgStaffPerDay: Object.values(coverageByDate).reduce((sum, day) => sum + day.staffCount, 0) / Object.keys(coverageByDate).length,
        totalHoursScheduled: Object.values(coverageByDate).reduce((sum, day) => sum + day.totalHours, 0),
        avgHoursPerDay: Object.values(coverageByDate).reduce((sum, day) => sum + day.totalHours, 0) / Object.keys(coverageByDate).length
      }
    }
  }

  // Commission Analysis Report
  const generateCommissionAnalysisReport = () => {
    const commissionData = staffData.map(staff => {
      const staffSchedules = schedules.filter(s => 
        s.staff_id === staff.id && 
        s.date >= selectedPeriod.startDate && 
        s.date <= selectedPeriod.endDate
      )

      const totalHours = staffSchedules.reduce((total, schedule) => {
        const startTime = new Date(`2000-01-01T${schedule.start_time}`)
        const endTime = new Date(`2000-01-01T${schedule.end_time}`)
        const hours = (endTime - startTime) / (1000 * 60 * 60)
        return total + hours
      }, 0)

      const salesAmount = totalHours * 150 // Mock sales per hour
      
      let tierBonus = 0
      
      // Find applicable commission tier for flat rate bonus
      const applicableTier = commissionTiers
        .sort((a, b) => b.sales_target - a.sales_target)
        .find(tier => salesAmount >= tier.sales_target)
      
      if (applicableTier) {
        tierBonus = applicableTier.bonus_amount
      }

      return {
        staffId: staff.id,
        staffName: staff.name,
        totalHours,
        salesAmount,
        tierBonus,
        totalCommission: tierBonus
      }
    })

    return {
      type: 'commission-analysis',
      title: 'Commission Analysis Report',
      period: selectedPeriod,
      data: commissionData,
      summary: {
        totalSales: commissionData.reduce((sum, data) => sum + data.salesAmount, 0),
        totalCommission: commissionData.reduce((sum, data) => sum + data.totalCommission, 0),
        avgCommissionRate: commissionData.length > 0 ? 
          commissionData.reduce((sum, data) => sum + data.totalCommission, 0) / commissionData.length : 0,
        totalTierBonuses: commissionData.reduce((sum, data) => sum + data.tierBonus, 0)
      }
    }
  }

  // Export report to CSV
  const exportToCSV = () => {
    if (!reportData) return

    let csvContent = ''
    
    // Add header
    csvContent += `${reportData.title}\n`
    csvContent += `Period: ${selectedPeriod.startDate} to ${selectedPeriod.endDate}\n\n`

    // Add data based on report type
    switch (reportData.type) {
      case 'staff-hours':
        csvContent += 'Staff Name,Role,Total Hours,Shifts Count,Avg Hours Per Shift\n'
        reportData.data.forEach(staff => {
          csvContent += `${staff.staffName},${staff.role},${staff.totalHours.toFixed(2)},${staff.shiftsCount},${staff.avgHoursPerShift.toFixed(2)}\n`
        })
        break
      case 'payroll-summary':
        csvContent += 'Staff Name,Pay Type,Total Hours,Base Pay,Commission,Total Pay\n'
        reportData.data.forEach(pay => {
          csvContent += `${pay.staffName},${pay.payType},${pay.totalHours.toFixed(2)},${pay.basePay.toFixed(2)},${pay.commission.toFixed(2)},${pay.totalPay.toFixed(2)}\n`
        })
        break
      case 'schedule-coverage':
        csvContent += 'Date,Day of Week,Staff Count,Total Hours,Staff List\n'
        reportData.data.forEach(day => {
          csvContent += `${day.date},${day.dayOfWeek},${day.staffCount},${day.totalHours.toFixed(2)},"${day.staffList.join(', ')}"\n`
        })
        break
      default:
        csvContent += 'No data to export\n'
    }

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportData.title.replace(/\s+/g, '_')}_${selectedPeriod.startDate}_${selectedPeriod.endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Render report content
  const renderReportContent = () => {
    if (!reportData) return null

    switch (reportData.type) {
      case 'staff-hours':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Total Hours</div>
                <div className="text-2xl font-bold text-blue-900">{reportData.summary.totalHours.toFixed(1)}h</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Total Shifts</div>
                <div className="text-2xl font-bold text-green-900">{reportData.summary.totalShifts}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600">Avg Hours/Staff</div>
                <div className="text-2xl font-bold text-purple-900">{reportData.summary.avgHoursPerStaff.toFixed(1)}h</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shifts</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg/Shift</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.data.map((staff) => (
                    <tr key={staff.staffId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.staffName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.totalHours.toFixed(1)}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.shiftsCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.avgHoursPerShift.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'payroll-summary':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Total Base Pay</div>
                <div className="text-2xl font-bold text-blue-900">${reportData.summary.totalBasePay.toFixed(2)}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Total Commission</div>
                <div className="text-2xl font-bold text-green-900">${reportData.summary.totalCommission.toFixed(2)}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600">Total Payroll</div>
                <div className="text-2xl font-bold text-purple-900">${reportData.summary.totalPayroll.toFixed(2)}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600">Avg Pay/Staff</div>
                <div className="text-2xl font-bold text-orange-900">${reportData.summary.avgPayPerStaff.toFixed(2)}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.data.map((pay) => (
                    <tr key={pay.staffId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pay.staffName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pay.payType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pay.totalHours.toFixed(1)}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${pay.basePay.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">${pay.commission.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${pay.totalPay.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      default:
        return <div className="text-gray-500">Report data not available</div>
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Scheduler Reports - {storeName}
          </h3>
          <p className="text-sm text-gray-600">
            Generate and analyze scheduling and payroll reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            disabled={!reportData}
            className="btn-outline btn-sm"
          >
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={selectedPeriod.startDate}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={selectedPeriod.endDate}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="staff-hours">Staff Hours</option>
              <option value="sales-performance">Sales Performance</option>
              <option value="payroll-summary">Payroll Summary</option>
              <option value="schedule-coverage">Schedule Coverage</option>
              <option value="commission-analysis">Commission Analysis</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full btn-primary btn-sm"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h4 className="text-lg font-medium text-gray-900">{reportData.title}</h4>
            <p className="text-sm text-gray-600">
              Period: {selectedPeriod.startDate} to {selectedPeriod.endDate}
            </p>
          </div>
          {renderReportContent()}
        </div>
      )}

      {/* Quick Report Buttons */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Reports</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <button
            onClick={() => {
              setReportType('staff-hours')
              setSelectedPeriod({
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              })
            }}
            className="btn-outline btn-sm"
          >
            <Clock className="w-4 h-4 mr-1" />
            This Week
          </button>
          <button
            onClick={() => {
              setReportType('payroll-summary')
              setSelectedPeriod({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              })
            }}
            className="btn-outline btn-sm"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            This Month
          </button>
          <button
            onClick={() => {
              setReportType('sales-performance')
              setSelectedPeriod({
                startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              })
            }}
            className="btn-outline btn-sm"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Last 3 Months
          </button>
          <button
            onClick={() => {
              setReportType('schedule-coverage')
              setSelectedPeriod({
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              })
            }}
            className="btn-outline btn-sm"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Next Week
          </button>
          <button
            onClick={() => {
              setReportType('commission-analysis')
              setSelectedPeriod({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              })
            }}
            className="btn-outline btn-sm"
          >
            <Users className="w-4 h-4 mr-1" />
            Commission
          </button>
        </div>
      </div>
    </div>
  )
}

export default SchedulerReports 