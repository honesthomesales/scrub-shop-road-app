import React, { useState, useEffect, useMemo } from 'react'
import { FileText, Calendar, DollarSign, CreditCard, TrendingUp, RefreshCw } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import supabaseAPI from '../services/supabaseAPI'
import { formatCurrency, parseDateString } from '../utils/dateUtils'
import { useApp } from '../contexts/AppContext'

const Profit = () => {
  const { salesData } = useApp()
  const [expenses, setExpenses] = useState([])
  const [allExpensesData, setAllExpensesData] = useState([]) // Store all data including income for monthly breakdown
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('monthly-summary')
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  })
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    loadExpenses()
  }, [])

  useEffect(() => {
    generateReport()
  }, [reportType, dateRange.startDate, dateRange.endDate, expenses])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const result = await supabaseAPI.readTable('expenses', {
        orderBy: { column: 'date', ascending: false }
      })
      
      if (result.success) {
        // Store all data (including income) for monthly breakdown chart
        const allData = (result.data || []).filter(exp => {
          const source = (exp.source || '').trim().toUpperCase()
          return source === 'CAPITAL ONE' || source === 'AMEX' || source === 'TRUIST'
        })
        setAllExpensesData(allData)
        
        // Filter to only include expenses (no income) from CAPITAL ONE, AMEX, and TRUIST
        // All sources: negative = expense, positive = income (filter out positive)
        const allExpenses = allData.filter(exp => {
          const source = (exp.source || '').trim().toUpperCase()
          const amount = parseFloat(exp.amount) || 0
          const description = (exp.description || '').toUpperCase()
          
          // All sources: only include negative amounts (expenses)
          if (source === 'AMEX' || source === 'CAPITAL ONE' || source === 'TRUIST') {
            if (amount < 0) {
              // Exclude payment transfers (internal transfers to pay other cards)
              // Exclude any expense with description containing "PMT AMEX" or "CAPITAL ONE"
              if (description.includes('PMT AMEX') || description.includes('CAPITAL ONE')) {
                return false
              }
              return true
            }
          }
          return false
        })
        setExpenses(allExpenses)
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = () => {
    // Filter expenses based on date range
    let filtered = expenses.filter(exp => {
      const expDateStr = exp.date ? String(exp.date).split('T')[0] : null
      if (!expDateStr) return false
      
      if (expDateStr < dateRange.startDate || expDateStr > dateRange.endDate) {
        return false
      }
      
      return true
    })

    let data = null

    switch (reportType) {
      case 'monthly-summary':
        data = generateMonthlySummary(filtered)
        break
      case 'date-range':
        data = generateDateRangeReport(filtered)
        break
      default:
        data = generateMonthlySummary(filtered)
    }

    setReportData(data)
  }

  const generateMonthlySummary = (filteredExpenses) => {
    // Group by month - only expenses (no income in Profit screen)
    // All sources: negative = expense
    const monthlyData = {}
    
    filteredExpenses.forEach(exp => {
      const date = parseDateString(exp.date)
      if (!date) return
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          monthKey,
          expenses: 0, // All are expenses (negative amounts stored as positive)
          count: 0
        }
      }
      
      const amount = parseFloat(exp.amount) || 0
      
      // Convert all to positive expense amounts (all sources store expenses as negative)
      monthlyData[monthKey].expenses += Math.abs(amount)
      monthlyData[monthKey].count += 1
    })

    const chartData = Object.values(monthlyData).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    
    // Calculate totals - all expenses only
    let totalExpenses = 0
    filteredExpenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0
      totalExpenses += Math.abs(amount) // All amounts are expenses, convert to positive
    })
    
    const avgExpensesPerMonth = chartData.length > 0 ? totalExpenses / chartData.length : 0

    return {
      type: 'monthly-summary',
      title: 'Monthly Summary',
      chartData,
      summary: {
        totalExpenses,
        count: filteredExpenses.length,
        avgExpensesPerMonth,
        months: chartData.length
      }
    }
  }

  const generateDateRangeReport = (filteredExpenses) => {
    let expensesForReport = filteredExpenses
    
    // Group by date - normalize dates to YYYY-MM-DD format for consistent grouping
    const dailyData = {}
    
    // First, collect all valid dates from expenses
    const validDates = []
    
    expensesForReport.forEach(exp => {
      // Normalize date to YYYY-MM-DD format (remove time component if present)
      const dateStr = exp.date ? String(exp.date).split('T')[0] : null
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          total: 0,
          count: 0,
          bySource: {}
        }
        validDates.push(dateStr)
      }
      
      // All expenses are stored as negative for consistent display
      const amount = parseFloat(exp.amount) || 0
      const expenseAmount = amount // All sources store expenses as negative
      
      dailyData[dateStr].total += expenseAmount
      dailyData[dateStr].count += 1
      
      const sourceName = exp.source || 'Unknown'
      dailyData[dateStr].bySource[sourceName] = (dailyData[dateStr].bySource[sourceName] || 0) + expenseAmount
    })

    // Use the actual dates from ALL expenses to determine the complete range
    if (validDates.length > 0) {
      validDates.sort()
      const actualMinDate = new Date(validDates[0] + 'T00:00:00')
      const actualMaxDate = new Date(validDates[validDates.length - 1] + 'T00:00:00')
      
      // Use ONLY the actual date range from filtered expenses - no mixing with selected range
      const finalStartDate = actualMinDate
      const finalEndDate = actualMaxDate
      
      const allDaysData = []
      // Create a new date object to avoid mutating the original
      const currentDate = new Date(finalStartDate.getTime())
      
      // Iterate through each day in the range
      while (currentDate <= finalEndDate) {
        // Format date as YYYY-MM-DD without timezone conversion
        const year = currentDate.getFullYear()
        const month = String(currentDate.getMonth() + 1).padStart(2, '0')
        const day = String(currentDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        // Use existing data if available, otherwise create zero entry
        if (dailyData[dateStr]) {
          allDaysData.push({
            ...dailyData[dateStr],
            dateFormatted: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          })
        } else {
          allDaysData.push({
            date: dateStr,
            total: 0,
            count: 0,
            bySource: {},
            dateFormatted: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          })
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }

      const chartData = allDaysData
      
      // Calculate total expenses from filtered expenses
      let totalExpenses = 0
      expensesForReport.forEach(exp => {
        const amount = parseFloat(exp.amount) || 0
        totalExpenses += Math.abs(amount) // All are expenses, convert to positive
      })
      
      // Calculate total income from all data (including income) for the date range
      let totalIncome = 0
      const incomeData = allExpensesData.filter(exp => {
        const expDateStr = exp.date ? String(exp.date).split('T')[0] : null
        if (!expDateStr) return false
        if (expDateStr < dateRange.startDate || expDateStr > dateRange.endDate) {
          return false
        }
        return true
      })
      
      incomeData.forEach(exp => {
        const amount = parseFloat(exp.amount) || 0
        
        // Calculate income: all sources store positive = income
        if (amount > 0) {
          totalIncome += amount
        }
      })
      
      const totalTransactions = expensesForReport.length
      
      // Calculate average based on days with transactions (non-zero amounts)
      const daysWithExpenses = chartData.filter(item => item.total !== 0).length
      const avgExpensePerDay = daysWithExpenses > 0 ? totalExpenses / daysWithExpenses : 0
      const avgIncomePerDay = daysWithExpenses > 0 ? totalIncome / daysWithExpenses : 0

      return {
        type: 'date-range',
        title: 'Daily Profit Breakdown',
        chartData,
        summary: {
          totalIncome,
          totalExpenses,
          count: totalTransactions,
          avgIncomePerDay,
          avgExpensePerDay,
          days: daysWithExpenses
        }
      }
    } else {
      // No expenses in range - return empty data structure
      return {
        type: 'date-range',
        title: 'Daily Profit Breakdown',
        chartData: [],
        summary: {
          totalIncome: 0,
          totalExpenses: 0,
          count: 0,
          avgIncomePerDay: 0,
          avgExpensePerDay: 0,
          days: 0
        }
      }
    }
  }

  // Memoize monthly breakdown chart data (includes income and expenses from all sources)
  const monthlyBreakdownChartData = useMemo(() => {
    if (reportType !== 'date-range') return null

    // Use all expenses data (including income) filtered by date range
    const filteredData = allExpensesData.filter(exp => {
      const expDateStr = exp.date ? String(exp.date).split('T')[0] : null
      if (!expDateStr) return false
      if (expDateStr < dateRange.startDate || expDateStr > dateRange.endDate) {
        return false
      }
      return true
    })

    if (filteredData.length === 0) {
      return null
    }

    const monthlyData = {}
    
    filteredData.forEach(exp => {
      const date = parseDateString(exp.date)
      if (!date) return
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          monthKey,
          income: 0,
          expenses: 0,
          sales: 0
        }
      }
      
      const amount = parseFloat(exp.amount) || 0
      const description = (exp.description || '').toUpperCase()
      
      // Exclude payment transfers (internal transfers to pay other cards)
      // Exclude any expense with description containing "PMT AMEX" or "CAPITAL ONE"
      if (amount < 0) {
        if (description.includes('PMT AMEX') || description.includes('CAPITAL ONE')) {
          return // Skip this entry
        }
        monthlyData[monthKey].expenses += Math.abs(amount)
      } else if (amount > 0) {
        monthlyData[monthKey].income += amount
      }
    })

    // Add sales data for all 5 stores (Trailer, Camper, Spartanburg, Greenville, Columbia)
    const allStores = ['Trailer', 'Camper', 'Spartanburg', 'Greenville', 'Columbia']
    
    if (salesData && salesData.length > 0) {
      salesData.forEach(sale => {
        if (!sale.date || !sale.grossSales || !sale.store) return
        
        const saleDate = parseDateString(sale.date)
        if (!saleDate) return
        
        // Check if sale is in date range
        const saleDateStr = saleDate.toISOString().split('T')[0]
        if (saleDateStr < dateRange.startDate || saleDateStr > dateRange.endDate) return
        
        // Only include sales from the 5 main stores
        if (!allStores.includes(sale.store)) return
        
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
        const monthName = saleDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthName,
            monthKey,
            income: 0,
            expenses: 0,
            sales: 0
          }
        }
        
        // Add grossSales to the sales total for this month
        monthlyData[monthKey].sales += parseFloat(sale.grossSales) || 0
      })
    }

    return Object.values(monthlyData).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }, [reportType, allExpensesData, salesData, dateRange.startDate, dateRange.endDate])

  // Calculate totals from monthly breakdown chart data
  const monthlyTotals = useMemo(() => {
    if (!monthlyBreakdownChartData || monthlyBreakdownChartData.length === 0) {
      return { totalIncome: 0, totalSales: 0 }
    }
    
    const totals = monthlyBreakdownChartData.reduce((acc, month) => {
      acc.totalIncome += month.income || 0
      acc.totalSales += month.sales || 0
      return acc
    }, { totalIncome: 0, totalSales: 0 })
    
    return totals
  }, [monthlyBreakdownChartData])

  // Memoize daily breakdown table data to prevent recalculation on every render
  const dailyTableData = useMemo(() => {
    if (reportType !== 'date-range') return []

    const filteredForTable = expenses.filter(exp => {
      const expDateStr = exp.date ? String(exp.date).split('T')[0] : null
      if (!expDateStr) return false
      if (expDateStr < dateRange.startDate || expDateStr > dateRange.endDate) {
        return false
      }
      return true
    })

    const dailyData = {}
    const validDates = []
    
    filteredForTable.forEach(exp => {
      const dateStr = exp.date ? String(exp.date).split('T')[0] : null
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          total: 0,
          count: 0,
          bySource: {}
        }
        validDates.push(dateStr)
      }
      
      const amount = parseFloat(exp.amount) || 0
      dailyData[dateStr].total += amount
      dailyData[dateStr].count += 1
      
      const source = exp.source || 'Unknown'
      dailyData[dateStr].bySource[source] = (dailyData[dateStr].bySource[source] || 0) + amount
    })

    validDates.sort()
    
    return validDates.map(dateStr => ({
      ...dailyData[dateStr],
      dateFormatted: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'numeric', 
        day: 'numeric' 
      })
    }))
  }, [reportType, expenses, dateRange.startDate, dateRange.endDate])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profit</h1>
          </div>
          <button
            onClick={loadExpenses}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Refresh data from Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading expenses...</p>
          </div>
        ) : (
          <>
            {/* Report Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="monthly-summary">Monthly Summary</option>
                    <option value="date-range">Date Range (Daily)</option>
                  </select>
                </div>

                {/* Date Range Start */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Date Range End */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Report Results */}
            {reportData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                {reportType === 'date-range' ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <DollarSign className="w-8 h-8 text-green-500" />
                          <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Collected Income</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyTotals.totalIncome || 0)}</p>
                          </div>
                        </div>
                        <div className="border-t border-gray-300 pt-4 mt-4">
                          <div className="flex items-center">
                            <TrendingUp className={`w-6 h-6 ${((monthlyTotals.totalIncome || 0) - (reportData.summary.totalExpenses || 0)) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                            <div className="ml-3">
                              <p className="text-xs text-gray-600">Total Profit</p>
                              <p className={`text-lg font-bold ${((monthlyTotals.totalIncome || 0) - (reportData.summary.totalExpenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency((monthlyTotals.totalIncome || 0) - (reportData.summary.totalExpenses || 0))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <DollarSign className="w-8 h-8 text-lime-500" />
                          <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Sold</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyTotals.totalSales || 0)}</p>
                          </div>
                        </div>
                        <div className="border-t border-gray-300 pt-4 mt-4">
                          <div className="flex items-center">
                            <TrendingUp className={`w-6 h-6 ${((monthlyTotals.totalSales || 0) - (reportData.summary.totalExpenses || 0)) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                            <div className="ml-3">
                              <p className="text-xs text-gray-600">Total Profit</p>
                              <p className={`text-lg font-bold ${((monthlyTotals.totalSales || 0) - (reportData.summary.totalExpenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency((monthlyTotals.totalSales || 0) - (reportData.summary.totalExpenses || 0))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <DollarSign className="w-8 h-8 text-red-500" />
                          <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.totalExpenses || 0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-red-500" />
                        <div className="ml-4">
                          <p className="text-sm text-gray-600">Total Expenses</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.totalExpenses || 0)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <CreditCard className="w-8 h-8 text-blue-500" />
                        <div className="ml-4">
                          <p className="text-sm text-gray-600">Transactions</p>
                          <p className="text-2xl font-bold text-gray-900">{reportData.summary.count || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <TrendingUp className="w-8 h-8 text-red-500" />
                        <div className="ml-4">
                          <p className="text-sm text-gray-600">Avg Expenses/Month</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(reportData.summary.avgExpensesPerMonth || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charts */}
                {/* Monthly Breakdown Chart - Show before Daily Profit Breakdown */}
                {monthlyBreakdownChartData && monthlyBreakdownChartData.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyBreakdownChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#64748b" 
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#64748b"
                            fontSize={12}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar 
                            dataKey="income" 
                            fill="#10b981" 
                            name="Income"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="expenses" 
                            fill="#ef4444" 
                            name="Expenses"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="sales" 
                            fill="#32cd32" 
                            name="Sales"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{reportData.title}</h2>
                  
                  {reportType === 'monthly-summary' && (
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                          <YAxis 
                            stroke="#64748b"
                            fontSize={12}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {reportType === 'date-range' && (
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="dateFormatted" 
                            stroke="#64748b" 
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            stroke="#64748b"
                            fontSize={12}
                            tickFormatter={(value) => {
                              const absValue = Math.abs(value)
                              const sign = value < 0 ? '-' : ''
                              return `${sign}$${(absValue / 1000).toFixed(0)}k`
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            dot={{ fill: '#ef4444', r: 4 }}
                            name="Daily Expenses"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Detailed Table */}
                {reportType === 'date-range' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Profit Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">By Source</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dailyTableData.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="px-4 py-3 text-sm text-center text-gray-500">
                                No expenses found
                              </td>
                            </tr>
                          ) : (
                            dailyTableData.map((item) => (
                                <tr key={item.date}>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {item.dateFormatted}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    {formatCurrency(item.total)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {item.count}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {Object.entries(item.bySource).map(([source, amount]) => (
                                      <span key={source} className="mr-2">
                                        {source}: {formatCurrency(amount)}
                                      </span>
                                    ))}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Profit

