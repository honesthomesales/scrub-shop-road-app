import React, { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Eye, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import DashboardChart from '../components/DashboardChart'
import { formatCurrency, getMonthName, parseDateString, formatDate } from '../utils/dateUtils'

const Dashboard = () => {
  const { salesData, currentSheet, loading, venuesData } = useApp()
  const [selectedMonthDetails, setSelectedMonthDetails] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Calculate summary statistics
  const calculateStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;
    const twoYearsAgo = currentYear - 2;

    // All sales for current year
    const yearSales = salesData.filter(sale => {
      const saleDate = parseDateString(sale.date);
      return saleDate && saleDate.getFullYear() === currentYear;
    });

    // All sales for last year
    const lastYearSales = salesData.filter(sale => {
      const saleDate = parseDateString(sale.date);
      return saleDate && saleDate.getFullYear() === lastYear;
    });

    // All sales for two years ago
    const twoYearsAgoSales = salesData.filter(sale => {
      const saleDate = parseDateString(sale.date);
      return saleDate && saleDate.getFullYear() === twoYearsAgo;
    });

    // All sales for selected month
    const monthSales = yearSales.filter(sale => {
      const saleDate = parseDateString(sale.date);
      return saleDate && saleDate.getMonth() === selectedMonth;
    });

    // Confirmed sales for selected month
    const confirmedMonthSales = monthSales.filter(sale => sale.status === 'Confirmed');
    
    // Debug: Log all confirmed sales for current month
    console.log('=== DASHBOARD DEBUG ===');
    console.log('Selected month:', selectedMonth, 'Selected year:', selectedYear);
    console.log('All month sales:', monthSales.length);
    console.log('Confirmed sales for selected month:', confirmedMonthSales.length);
    console.log('Confirmed sales details:');
    confirmedMonthSales.forEach((sale, index) => {
      console.log(`${index + 1}. Date: ${sale.date}, Status: ${sale.status}, Gross: $${sale.grossSales}, Venue: ${sale.venueId}`);
    });

    // Total gross sales for current year
    const totalGross = yearSales.reduce((sum, sale) => sum + (sale.grossSales > 0 ? sale.grossSales : 0), 0);

    // Total gross sales for last year
    const lastYearTotalGross = lastYearSales.reduce((sum, sale) => sum + (sale.grossSales > 0 ? sale.grossSales : 0), 0);

    // Total gross sales for two years ago
    const twoYearsAgoTotalGross = twoYearsAgoSales.reduce((sum, sale) => sum + (sale.grossSales > 0 ? sale.grossSales : 0), 0);

    // Count of positive sales for current year
    const positiveYearSalesCount = yearSales.filter(sale => sale.grossSales > 0).length;

    // Count of positive sales for last year
    const positiveLastYearSalesCount = lastYearSales.filter(sale => sale.grossSales > 0).length;

    // Count of positive sales for two years ago
    const positiveTwoYearsAgoSalesCount = twoYearsAgoSales.filter(sale => sale.grossSales > 0).length;

    // Sales for selected month with positive gross sales
    const positiveMonthSalesCount = monthSales.filter(sale => sale.grossSales > 0).length;

    // Total gross sales for selected month
    const monthTotalGross = monthSales.reduce((sum, sale) => sum + (sale.grossSales > 0 ? sale.grossSales : 0), 0);

    // Calculate the number of months that have passed this year (up to previous month)
    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-based (0 = January, 11 = December)
    const currentYearValue = today.getFullYear();
    
    // If we're in the current year, count months up to the previous month
    // If we're in a different year, use all 12 months
    let monthsToCount;
    if (currentYearValue === selectedYear) {
      // Count months from January (0) up to the previous month (currentMonthIndex - 1)
      // If it's January (currentMonthIndex = 0), then monthsToCount = 0, but we should show at least 1 month
      monthsToCount = Math.max(1, currentMonthIndex);
    } else {
      // For previous years, use all 12 months
      monthsToCount = 12;
    }

    // Calculate monthly averages based on actual months passed
    const currentYearMonthlyAverage = monthsToCount > 0 ? Math.round(totalGross / monthsToCount) : 0;
    const lastYearMonthlyAverage = Math.round(lastYearTotalGross / 12); // Last year always uses 12 months
    const twoYearsAgoMonthlyAverage = Math.round(twoYearsAgoTotalGross / 12); // Two years ago always uses 12 months

    // Debug logging for monthly average calculation
    console.log('=== MONTHLY AVERAGE DEBUG ===');
    console.log('Current date:', today.toDateString());
    console.log('Current month index:', currentMonthIndex);
    console.log('Current year value:', currentYearValue);
    console.log('Selected year:', selectedYear);
    console.log('Months to count:', monthsToCount);
    console.log('Total gross sales:', totalGross);
    console.log('Current year monthly average:', currentYearMonthlyAverage);
    console.log('Last year monthly average:', lastYearMonthlyAverage);

    return {
      totalGross: Math.round(totalGross),
      lastYearTotalGross: Math.round(lastYearTotalGross),
      twoYearsAgoTotalGross: Math.round(twoYearsAgoTotalGross),
      confirmedMonthSalesCount: confirmedMonthSales.length,
      positiveMonthSalesCount,
      monthTotalGross: Math.round(monthTotalGross),
      averageGross: positiveYearSalesCount > 0 ? Math.round(totalGross / positiveYearSalesCount) : 0,
      averageLastYear: positiveLastYearSalesCount > 0 ? Math.round(lastYearTotalGross / positiveLastYearSalesCount) : 0,
      averageTwoYearsAgo: positiveTwoYearsAgoSalesCount > 0 ? Math.round(twoYearsAgoTotalGross / positiveTwoYearsAgoSalesCount) : 0,
      currentYearMonthlyAverage,
      lastYearMonthlyAverage,
      twoYearsAgoMonthlyAverage,
      monthsToCount // Add this for debugging
    };
  };

  const stats = calculateStats();

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

  // Generate monthly stats table data
  const generateMonthlyStats = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    return months.map((month, index) => {
      const monthSales = salesData.filter(sale => {
        const saleDate = parseDateString(sale.date)
        return saleDate && saleDate.getMonth() === index && saleDate.getFullYear() === new Date().getFullYear()
      })
      
      const totalGross = monthSales.reduce((sum, sale) => sum + (sale.grossSales || 0), 0)
      const confirmedSales = monthSales.filter(sale => sale.status === 'Confirmed').length
      const positiveSales = monthSales.filter(sale => sale.grossSales > 0).length
      
      return {
        month,
        monthIndex: index,
        salesCount: monthSales.length,
        confirmedSales,
        positiveSales,
        totalGross,
        sales: monthSales
      }
    }).filter(stat => stat.salesCount > 0 || stat.totalGross > 0)
  }

  const monthlyStats = generateMonthlyStats()

  const handleShowMonthDetails = (monthData) => {
    setSelectedMonthDetails(monthData)
  }

  const handleCloseMonthDetails = () => {
    setSelectedMonthDetails(null)
  }

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value))
  }

  const getVenueName = (venueId) => {
    const venue = venuesData.find(v => v.id === venueId)
    return venue ? venue.promo : venueId || 'N/A'
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
        </div>
      </div>
    )
  }

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
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap">
                      {selectedYear} - ${stats.totalGross.toLocaleString()}
                    </span>
                    <span className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap">
                      {selectedYear - 1} - ${stats.lastYearTotalGross.toLocaleString()}
                    </span>
                    <span className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap">
                      {selectedYear - 2} - ${stats.twoYearsAgoTotalGross.toLocaleString()}
                    </span>
                  </div>
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
                    <p className="text-base font-bold text-primary-700 whitespace-nowrap">Sales This Month</p>
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
                  <p className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap" style={{minHeight: '2.5rem'}}>
                    Confirmed: {stats.confirmedMonthSalesCount}
                  </p>
                  <p className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap" style={{minHeight: '2.5rem'}}>
                    Completed Sales: {stats.positiveMonthSalesCount}
                  </p>
                  <p className="text-lg font-bold text-secondary-900 flex items-center whitespace-nowrap" style={{minHeight: '2.5rem'}}>
                    Total Gross Sales ({getSelectedMonthName()} {selectedYear}): ${stats.monthTotalGross.toLocaleString()}
                  </p>
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
                  <div className="text-xs w-full">
                    <div className="grid grid-cols-3 gap-2 mb-1">
                      <div></div>
                      <div className="text-primary-700 font-bold whitespace-nowrap text-base">Per Sale</div>
                      <div className="text-primary-700 font-bold whitespace-nowrap text-base">Per Month</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">{selectedYear}</div>
                      <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">${stats.averageGross.toLocaleString()}</div>
                      <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">${stats.currentYearMonthlyAverage.toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">{selectedYear - 1}</div>
                      <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">${stats.averageLastYear.toLocaleString()}</div>
                      <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">${stats.lastYearMonthlyAverage.toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">{selectedYear - 2}</div>
                      <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">${stats.averageTwoYearsAgo.toLocaleString()}</div>
                      <div className="text-secondary-900 font-bold text-lg flex items-center whitespace-nowrap">${stats.twoYearsAgoMonthlyAverage.toLocaleString()}</div>
                    </div>
                    {/* Show months used in calculation */}
                    <div className="mt-2 text-xs text-secondary-600">
                      {selectedYear === new Date().getFullYear() 
                        ? `Based on ${stats.monthsToCount} month${stats.monthsToCount !== 1 ? 's' : ''} (Jan - ${monthOptions[Math.max(0, new Date().getMonth() - 1)]?.label || 'Previous Month'})`
                        : 'Based on 12 months'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-8">
          <DashboardChart salesData={salesData} currentSheet={currentSheet} />
        </div>

        {/* Monthly Stats Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">
              Monthly Sales Statistics
            </h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Month</th>
                    <th className="table-header-cell">Total Sales</th>
                    <th className="table-header-cell">Confirmed Sales</th>
                    <th className="table-header-cell">Positive Sales</th>
                    <th className="table-header-cell">Total Gross Sales</th>
                    <th className="table-header-cell">Average per Sale</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {monthlyStats.map((stat, index) => (
                    <tr key={index} className="table-row">
                      <td className="table-cell font-medium">{stat.month}</td>
                      <td className="table-cell">{stat.salesCount}</td>
                      <td className="table-cell">{stat.confirmedSales}</td>
                      <td className="table-cell">{stat.positiveSales}</td>
                      <td className="table-cell font-semibold">
                        {formatCurrency(stat.totalGross)}
                      </td>
                      <td className="table-cell">
                        {formatCurrency(stat.salesCount > 0 ? stat.totalGross / stat.salesCount : 0)}
                      </td>
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
          </div>
        </div>
      </div>

      {/* Month Details Modal */}
      {selectedMonthDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h3 className="text-xl font-semibold text-secondary-900">
                {selectedMonthDetails.month} Sales Details
              </h3>
              <button
                onClick={handleCloseMonthDetails}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-secondary-600">Total Sales</p>
                  <p className="text-2xl font-bold text-secondary-900">{selectedMonthDetails.salesCount}</p>
                </div>
                <div className="bg-success-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-secondary-600">Confirmed Sales</p>
                  <p className="text-2xl font-bold text-success-600">{selectedMonthDetails.confirmedSales}</p>
                </div>
                <div className="bg-primary-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-secondary-600">Positive Sales</p>
                  <p className="text-2xl font-bold text-primary-600">{selectedMonthDetails.positiveSales}</p>
                </div>
                <div className="bg-warning-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-secondary-600">Total Gross Sales</p>
                  <p className="text-2xl font-bold text-warning-600">{formatCurrency(selectedMonthDetails.totalGross)}</p>
                </div>
              </div>

              {/* Sales Details Table */}
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Gross Sales</th>
                      <th className="table-header-cell">Net Sales</th>
                      <th className="table-header-cell">Sales Tax</th>
                      <th className="table-header-cell">Venue</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {selectedMonthDetails.sales.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-cell text-center text-secondary-500 py-8">
                          No sales entries found for {selectedMonthDetails.month}
                        </td>
                      </tr>
                    ) : (
                      selectedMonthDetails.sales.map((sale) => (
                        <tr key={sale.id} className="table-row">
                          <td className="table-cell font-medium">
                            {formatDate(sale.date)}
                          </td>
                          <td className="table-cell">
                            <span className={getStatusColor(sale.status)}>
                              {sale.status}
                            </span>
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
                            {getVenueName(sale.venueId)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
