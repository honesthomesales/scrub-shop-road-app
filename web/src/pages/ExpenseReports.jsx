import React, { useState, useEffect, useMemo } from 'react'
import { FileText, Calendar, DollarSign, CreditCard, TrendingUp, Filter, Download } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import supabaseAPI from '../services/supabaseAPI'
import { formatCurrency, parseDateString } from '../utils/dateUtils'

const ExpenseReports = () => {
  const [expenses, setExpenses] = useState([])
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
  const [selectedSource, setSelectedSource] = useState('all')
  const [selectedCardMember, setSelectedCardMember] = useState('all')
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    loadExpenses()
  }, [])

  useEffect(() => {
    if (expenses.length > 0) {
      generateReport()
    }
  }, [reportType, dateRange, selectedSource, selectedCardMember, expenses])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const result = await supabaseAPI.readTable('expenses', {
        orderBy: { column: 'date', ascending: false }
      })
      
      if (result.success) {
        setExpenses(result.data || [])
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = () => {
    // Filter expenses based on selections
    let filtered = expenses.filter(exp => {
      const expDate = parseDateString(exp.date)
      if (!expDate) return false
      
      const expDateStr = exp.date
      if (expDateStr < dateRange.startDate || expDateStr > dateRange.endDate) {
        return false
      }
      
      if (selectedSource !== 'all' && exp.source !== selectedSource) {
        return false
      }
      
      if (selectedCardMember !== 'all') {
        const cardMember = exp.card_member || 'Unknown'
        if (cardMember !== selectedCardMember) {
          return false
        }
      }
      
      return true
    })

    let data = null

    switch (reportType) {
      case 'monthly-summary':
        data = generateMonthlySummary(filtered)
        break
      case 'by-source':
        data = generateBySourceReport(filtered)
        break
      case 'by-card-member':
        data = generateByCardMemberReport(filtered)
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
    // Group by month
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
          total: 0,
          count: 0,
          bySource: {}
        }
      }
      
      monthlyData[monthKey].total += Math.abs(parseFloat(exp.amount) || 0)
      monthlyData[monthKey].count += 1
      
      const source = exp.source || 'Unknown'
      monthlyData[monthKey].bySource[source] = (monthlyData[monthKey].bySource[source] || 0) + Math.abs(parseFloat(exp.amount) || 0)
    })

    const chartData = Object.values(monthlyData).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    
    const total = filteredExpenses.reduce((sum, exp) => sum + Math.abs(parseFloat(exp.amount) || 0), 0)
    const average = chartData.length > 0 ? total / chartData.length : 0

    return {
      type: 'monthly-summary',
      title: 'Monthly Expense Summary',
      chartData,
      summary: {
        total,
        count: filteredExpenses.length,
        average,
        months: chartData.length
      }
    }
  }

  const generateBySourceReport = (filteredExpenses) => {
    const bySource = {}
    
    filteredExpenses.forEach(exp => {
      const source = exp.source || 'Unknown'
      if (!bySource[source]) {
        bySource[source] = {
          source,
          total: 0,
          count: 0,
          percentage: 0
        }
      }
      bySource[source].total += Math.abs(parseFloat(exp.amount) || 0)
      bySource[source].count += 1
    })

    const total = Object.values(bySource).reduce((sum, item) => sum + item.total, 0)
    
    // Calculate percentages
    Object.values(bySource).forEach(item => {
      item.percentage = total > 0 ? (item.total / total) * 100 : 0
    })

    const chartData = Object.values(bySource).sort((a, b) => b.total - a.total)

    return {
      type: 'by-source',
      title: 'Expenses by Source',
      chartData,
      summary: {
        total,
        count: filteredExpenses.length,
        sources: chartData.length
      }
    }
  }

  const generateByCardMemberReport = (filteredExpenses) => {
    const byCardMember = {}
    
    filteredExpenses.forEach(exp => {
      const cardMember = exp.card_member || 'Unknown'
      if (!byCardMember[cardMember]) {
        byCardMember[cardMember] = {
          cardMember,
          total: 0,
          count: 0,
          percentage: 0
        }
      }
      byCardMember[cardMember].total += Math.abs(parseFloat(exp.amount) || 0)
      byCardMember[cardMember].count += 1
    })

    const total = Object.values(byCardMember).reduce((sum, item) => sum + item.total, 0)
    
    // Calculate percentages
    Object.values(byCardMember).forEach(item => {
      item.percentage = total > 0 ? (item.total / total) * 100 : 0
    })

    const chartData = Object.values(byCardMember).sort((a, b) => b.total - a.total)

    return {
      type: 'by-card-member',
      title: 'Expenses by Card Member',
      chartData,
      summary: {
        total,
        count: filteredExpenses.length,
        cardMembers: chartData.length
      }
    }
  }

  const generateDateRangeReport = (filteredExpenses) => {
    // Group by date
    const dailyData = {}
    
    filteredExpenses.forEach(exp => {
      const date = exp.date
      if (!date) return
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          total: 0,
          count: 0,
          bySource: {}
        }
      }
      
      dailyData[date].total += Math.abs(parseFloat(exp.amount) || 0)
      dailyData[date].count += 1
      
      const source = exp.source || 'Unknown'
      dailyData[date].bySource[source] = (dailyData[date].bySource[source] || 0) + Math.abs(parseFloat(exp.amount) || 0)
    })

    const chartData = Object.values(dailyData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        ...item,
        dateFormatted: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
    
    const total = filteredExpenses.reduce((sum, exp) => sum + Math.abs(parseFloat(exp.amount) || 0), 0)
    const average = chartData.length > 0 ? total / chartData.length : 0

    return {
      type: 'date-range',
      title: 'Daily Expense Breakdown',
      chartData,
      summary: {
        total,
        count: filteredExpenses.length,
        average,
        days: chartData.length
      }
    }
  }

  // Get unique sources and card members for filters
  const sources = useMemo(() => {
    const unique = [...new Set(expenses.map(e => e.source).filter(Boolean))]
    return unique.sort()
  }, [expenses])

  const cardMembers = useMemo(() => {
    const unique = [...new Set(expenses.map(e => e.card_member).filter(Boolean))]
    return unique.sort()
  }, [expenses])

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expense Reports</h1>
          <p className="mt-2 text-gray-600">Generate detailed expense reports and analysis</p>
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
                    <option value="by-source">By Source</option>
                    <option value="by-card-member">By Card Member</option>
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

                {/* Source Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Filter
                  </label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Sources</option>
                    {sources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card Member Filter (only show for relevant reports) */}
              {(reportType === 'by-card-member' || reportType === 'date-range') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Member Filter
                  </label>
                  <select
                    value={selectedCardMember}
                    onChange={(e) => setSelectedCardMember(e.target.value)}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Card Members</option>
                    {cardMembers.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Report Results */}
            {reportData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <DollarSign className="w-8 h-8 text-red-500" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.total)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <CreditCard className="w-8 h-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Transactions</p>
                        <p className="text-2xl font-bold text-gray-900">{reportData.summary.count}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">
                          {reportType === 'monthly-summary' ? 'Avg per Month' : 
                           reportType === 'date-range' ? 'Avg per Day' : 'Average'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(reportData.summary.average || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <Calendar className="w-8 h-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">
                          {reportType === 'monthly-summary' ? 'Months' : 
                           reportType === 'date-range' ? 'Days' : 
                           reportType === 'by-source' ? 'Sources' : 'Card Members'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.summary.months || reportData.summary.days || reportData.summary.sources || reportData.summary.cardMembers || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
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
                          <Bar dataKey="total" fill="#ef4444" name="Total Expenses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {reportType === 'by-source' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData.chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ source, percentage }) => `${source}: ${percentage.toFixed(1)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="total"
                            >
                              {reportData.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3">
                        {reportData.chartData.map((item, index) => (
                          <div key={item.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded mr-3" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="font-medium text-gray-900">{item.source}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                              <p className="text-xs text-gray-500">{item.count} transactions ({item.percentage.toFixed(1)}%)</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reportType === 'by-card-member' && (
                    <div className="space-y-4">
                      {reportData.chartData.map((item, index) => (
                        <div key={item.cardMember} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Users className="w-5 h-5 text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900">{item.cardMember}</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">{formatCurrency(item.total)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{item.count} transactions</span>
                            <span>{item.percentage.toFixed(1)}% of total</span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full" 
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
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
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
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
                          {reportData.chartData.slice(-30).map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(item.date).toLocaleDateString()}
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
                          ))}
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

export default ExpenseReports

