import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { TrendingUp, DollarSign, Calendar, AlertCircle, RefreshCw, CreditCard, Users } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import supabaseAPI from '../services/supabaseAPI'
import { useApp } from '../contexts/AppContext'
import { formatCurrency, parseDateString, getShortMonthName } from '../utils/dateUtils'

const ExpensesDashboard = () => {
  const { salesData } = useApp()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedYears, setSelectedYears] = useState([new Date().getFullYear()])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [recurringExpenses, setRecurringExpenses] = useState([])
  const [duplicateExpenses, setDuplicateExpenses] = useState([])

  // Load expenses data
  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const result = await supabaseAPI.readTable('expenses', {
        orderBy: { column: 'date', ascending: false }
      })
      
      if (result.success) {
        setExpenses(result.data || [])
        // Analyze for recurring and duplicates
        analyzeRecurringExpenses(result.data || [])
        analyzeDuplicateExpenses(result.data || [])
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  // Analyze recurring expenses
  const analyzeRecurringExpenses = (expenseData) => {
    // Group by description (normalized)
    const normalizedDescriptions = expenseData.map(exp => ({
      ...exp,
      normalizedDesc: normalizeDescription(exp.description || '')
    }))

    const groupedByDesc = {}
    normalizedDescriptions.forEach(exp => {
      const key = exp.normalizedDesc
      if (!groupedByDesc[key]) {
        groupedByDesc[key] = []
      }
      groupedByDesc[key].push(exp)
    })

    // Find expenses that appear multiple times with similar amounts
    const recurring = []
    Object.entries(groupedByDesc).forEach(([desc, exps]) => {
      if (exps.length >= 3) {
        // Sort by date
        exps.sort((a, b) => new Date(a.date) - new Date(b.date))
        
        // Check if amounts are similar (within 10%)
        const amounts = exps.map(e => Math.abs(parseFloat(e.amount)))
        const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
        const isSimilarAmount = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.1)
        
        // Check if dates are roughly monthly (within 5 days of expected interval)
        let isMonthly = false
        if (exps.length >= 3) {
          const intervals = []
          for (let i = 1; i < exps.length; i++) {
            const daysDiff = (new Date(exps[i].date) - new Date(exps[i-1].date)) / (1000 * 60 * 60 * 24)
            intervals.push(daysDiff)
          }
          const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length
          // Check if average interval is between 25-35 days (roughly monthly)
          isMonthly = avgInterval >= 25 && avgInterval <= 35
        }

        if (isSimilarAmount && (isMonthly || exps.length >= 4)) {
          recurring.push({
            description: desc,
            count: exps.length,
            averageAmount: avgAmount,
            lastDate: exps[exps.length - 1].date,
            nextExpectedDate: new Date(new Date(exps[exps.length - 1].date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            expenses: exps
          })
        }
      }
    })

    setRecurringExpenses(recurring.sort((a, b) => b.count - a.count))
  }

  // Normalize description for comparison
  const normalizeDescription = (desc) => {
    if (!desc) return ''
    return desc
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Analyze duplicate expenses
  const analyzeDuplicateExpenses = (expenseData) => {
    const duplicates = []
    const seen = new Map()

    expenseData.forEach(exp => {
      const key = `${exp.date}_${normalizeDescription(exp.description)}_${Math.abs(parseFloat(exp.amount)).toFixed(2)}`
      
      if (seen.has(key)) {
        const existing = seen.get(key)
        if (!existing.duplicates) {
          existing.duplicates = [existing.expense]
        }
        existing.duplicates.push(exp)
        existing.count = existing.duplicates.length
      } else {
        seen.set(key, { expense: exp, count: 1 })
      }
    })

    // Filter to only show actual duplicates (2+ occurrences)
    seen.forEach((value, key) => {
      if (value.count > 1) {
        duplicates.push({
          key,
          count: value.count,
          expenses: value.duplicates || [value.expense]
        })
      }
    })

    setDuplicateExpenses(duplicates.sort((a, b) => b.count - a.count))
  }

  // Calculate stats
  const stats = useMemo(() => {
    const filteredExpenses = expenses.filter(exp => {
      const expDate = parseDateString(exp.date)
      if (!expDate) return false
      return selectedYears.includes(expDate.getFullYear())
    })

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Math.abs(parseFloat(exp.amount) || 0), 0)
    const bySource = {}
    const byCardMember = {}
    
    filteredExpenses.forEach(exp => {
      const source = exp.source || 'Unknown'
      bySource[source] = (bySource[source] || 0) + Math.abs(parseFloat(exp.amount) || 0)
      
      const cardMember = exp.card_member || 'Unknown'
      byCardMember[cardMember] = (byCardMember[cardMember] || 0) + Math.abs(parseFloat(exp.amount) || 0)
    })

    // Monthly breakdown
    const monthlyData = {}
    filteredExpenses.forEach(exp => {
      const expDate = parseDateString(exp.date)
      if (expDate) {
        const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Math.abs(parseFloat(exp.amount) || 0)
      }
    })

    return {
      totalExpenses,
      count: filteredExpenses.length,
      bySource,
      byCardMember,
      monthlyData
    }
  }, [expenses, selectedYears])

  // Generate monthly trend chart data
  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return months.map((month, index) => {
      const monthData = { month }
      
      selectedYears.forEach(year => {
        const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`
        monthData[year] = stats.monthlyData[monthKey] || 0
      })
      
      return monthData
    })
  }, [stats.monthlyData, selectedYears])

  // Generate expense vs sales comparison data
  const expenseVsSalesData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return months.map((month, index) => {
      const monthData = { month }
      
      selectedYears.forEach(year => {
        // Get expenses for this month
        const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`
        const monthExpenses = stats.monthlyData[monthKey] || 0
        
        // Get sales for this month
        const monthSales = salesData
          .filter(sale => {
            const saleDate = parseDateString(sale.date)
            return saleDate && 
                   saleDate.getMonth() === index && 
                   saleDate.getFullYear() === year
          })
          .reduce((sum, sale) => sum + (sale.grossSales || 0), 0)
        
        monthData[`${year} Expenses`] = monthExpenses
        monthData[`${year} Sales`] = monthSales
        monthData[`${year} Net`] = monthSales - monthExpenses
      })
      
      return monthData
    })
  }, [stats.monthlyData, salesData, selectedYears])

  // Source breakdown data for pie chart
  const sourceBreakdownData = useMemo(() => {
    return Object.entries(stats.bySource).map(([source, amount]) => ({
      name: source,
      value: amount
    }))
  }, [stats.bySource])

  // Card member breakdown data
  const cardMemberData = useMemo(() => {
    return Object.entries(stats.byCardMember)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10
      .map(([member, amount]) => ({
        name: member,
        value: amount
      }))
  }, [stats.byCardMember])

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses Dashboard</h1>
            <p className="mt-2 text-gray-600">Track and analyze business expenses</p>
          </div>
          <button
            onClick={loadExpenses}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading expenses...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <CreditCard className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Recurring Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">{recurringExpenses.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Potential Duplicates</p>
                    <p className="text-2xl font-bold text-gray-900">{duplicateExpenses.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Expense Trends</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {selectedYears.map((year, index) => (
                      <Line
                        key={year}
                        type="monotone"
                        dataKey={year}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                        name={`${year}`}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense vs Sales Comparison */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Expenses vs Sales Comparison</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseVsSalesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {selectedYears.flatMap(year => [
                      <Bar key={`${year}-expenses`} dataKey={`${year} Expenses`} fill="#ef4444" name={`${year} Expenses`} />,
                      <Bar key={`${year}-sales`} dataKey={`${year} Sales`} fill="#10b981" name={`${year} Sales`} />,
                      <Bar key={`${year}-net`} dataKey={`${year} Net`} fill="#3b82f6" name={`${year} Net Profit`} />
                    ])}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Source and Card Member Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Expenses by Source */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Expenses by Source</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {sourceBreakdownData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expenses by Card Member */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Card Members</h2>
                <div className="space-y-3">
                  {cardMemberData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recurring Expenses */}
            {recurringExpenses.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recurring Expenses</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Expected</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recurringExpenses.slice(0, 10).map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.count}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.averageAmount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(item.lastDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(item.nextExpectedDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Duplicate Expenses */}
            {duplicateExpenses.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Potential Duplicate Expenses</h2>
                <div className="space-y-4">
                  {duplicateExpenses.slice(0, 10).map((duplicate, index) => (
                    <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-orange-900">
                          {duplicate.count} duplicate(s) found
                        </span>
                        <span className="text-sm text-orange-700">
                          Amount: {formatCurrency(Math.abs(parseFloat(duplicate.expenses[0].amount)))}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">{duplicate.expenses[0].description}</p>
                        <div className="space-y-1">
                          {duplicate.expenses.map((exp, expIndex) => (
                            <p key={expIndex} className="text-xs text-gray-600">
                              {new Date(exp.date).toLocaleDateString()} - {exp.source} - {exp.card_member || 'N/A'}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ExpensesDashboard

