import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  TrendingUp, DollarSign, Calendar, RefreshCw, BarChart3, PieChart as PieChartIcon,
  Download, Filter, ArrowUp, ArrowDown, AlertCircle, Target, TrendingDown, CreditCard
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Treemap
} from 'recharts'
import { getSupabase } from '../services/supabaseAPI'
import { formatCurrency, parseDateString, getShortMonthName, formatDateInput } from '../utils/dateUtils'

const ExpenseCategoryKPI = () => {
  // Date range state
  const getCurrentMonthRange = () => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const [dateRange, setDateRange] = useState(getCurrentMonthRange())
  const [dateRangeType, setDateRangeType] = useState('current-month')
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [comparisonPeriod, setComparisonPeriod] = useState(null)
  const [visibleCategories, setVisibleCategories] = useState(new Set())

  // Load categories
  useEffect(() => {
    loadCategories()
  }, [])

  // Load expenses when date range changes
  useEffect(() => {
    loadExpenses()
  }, [dateRange])

  const loadCategories = async () => {
    try {
      const supabase = getSupabase()
      if (!supabase) return

      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (err) throw err
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadExpenses = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabase()
      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      // Use pagination to fetch all expenses (Supabase has a default limit of 1000)
      let allData = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error: err } = await supabase
          .from('expenses')
          .select('id, date, description, amount, source, category')
          .lt('amount', 0) // Only expenses (negative amounts)
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate)
          .order('date', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (err) throw err

        if (data && data.length > 0) {
          allData = allData.concat(data)
          // If we got less than pageSize, we've reached the end
          hasMore = data.length === pageSize
          page++
        } else {
          hasMore = false
        }
      }

      // Filter out payment transfers and map null categories to "OTHER"
      // Use the same filtering logic as ExpenseCategorization page
      const filtered = allData.filter(exp => {
        const description = (exp.description || '').toUpperCase().trim()
        return !description.includes('PMT AMEX') && !description.includes('CAPITAL ONE')
      }).map(exp => ({
        ...exp,
        category: exp.category || 'OTHER'
      }))

      setExpenses(filtered)
    } catch (err) {
      setError('Error loading expenses: ' + err.message)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  // Date range handlers
  const handleDateRangeChange = (type) => {
    setDateRangeType(type)
    const now = new Date()
    let startDate, endDate

    switch (type) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last-6-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last-12-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'year-to-date':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        break
      case 'last-quarter':
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1
        const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear()
        const lastQuarterMonth = lastQuarter < 0 ? 9 : lastQuarter * 3
        startDate = new Date(lastQuarterYear, lastQuarterMonth, 1)
        endDate = new Date(lastQuarterYear, lastQuarterMonth + 3, 0)
        break
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      case '2-years':
        // This YTD (current year to date) and previous year
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      default:
        return
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    })
  }

  // Calculate category spending data
  const categoryData = useMemo(() => {
    const categoryMap = {}
    
    expenses.forEach(exp => {
      const category = exp.category || 'OTHER'
      const amount = Math.abs(parseFloat(exp.amount) || 0)
      
      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          total: 0,
          count: 0,
          transactions: []
        }
      }
      
      categoryMap[category].total += amount
      categoryMap[category].count += 1
      categoryMap[category].transactions.push(exp)
    })

    const total = Object.values(categoryMap).reduce((sum, cat) => sum + cat.total, 0)
    
    return Object.values(categoryMap)
      .map(cat => ({
        ...cat,
        percentage: total > 0 ? (cat.total / total) * 100 : 0,
        average: cat.count > 0 ? cat.total / cat.count : 0
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  // Pie chart data
  const pieChartData = useMemo(() => {
    return categoryData.map(cat => ({
      name: cat.name,
      value: cat.total,
      percentage: cat.percentage
    }))
  }, [categoryData])

  // Bar chart data (horizontal)
  const barChartData = useMemo(() => {
    return categoryData
      .sort((a, b) => b.total - a.total)
      .map(cat => ({
        name: cat.name,
        amount: cat.total,
        percentage: cat.percentage
      }))
  }, [categoryData])

  // Monthly trend data by category
  const monthlyTrendData = useMemo(() => {
    const monthMap = {}
    const categorySet = new Set(categoryData.map(c => c.name))
    
    expenses.forEach(exp => {
      const date = parseDateString(exp.date)
      if (!date) return
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const category = exp.category || 'OTHER'
      const amount = Math.abs(parseFloat(exp.amount) || 0)
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey }
        categorySet.forEach(cat => {
          monthMap[monthKey][cat] = 0
        })
      }
      
      if (monthMap[monthKey][category] !== undefined) {
        monthMap[monthKey][category] += amount
      }
    })

    return Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }))
  }, [expenses, categoryData])

  // Monthly comparison data
  const monthlyComparison = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const currentMonthData = {}
    const lastMonthData = {}

    expenses.forEach(exp => {
      const date = parseDateString(exp.date)
      if (!date) return
      
      const category = exp.category || 'OTHER'
      const amount = Math.abs(parseFloat(exp.amount) || 0)
      
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        currentMonthData[category] = (currentMonthData[category] || 0) + amount
      } else if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
        lastMonthData[category] = (lastMonthData[category] || 0) + amount
      }
    })

    const allCategories = new Set([
      ...Object.keys(currentMonthData),
      ...Object.keys(lastMonthData)
    ])

    return Array.from(allCategories).map(category => {
      const current = currentMonthData[category] || 0
      const previous = lastMonthData[category] || 0
      const change = current - previous
      const changePercent = previous > 0 ? (change / previous) * 100 : 0

      return {
        category,
        current,
        previous,
        change,
        changePercent
      }
    }).sort((a, b) => b.current - a.current)
  }, [expenses])

  // Top 10 categories
  const top10Categories = useMemo(() => {
    return categoryData.slice(0, 10).map((cat, index) => ({
      rank: index + 1,
      ...cat
    }))
  }, [categoryData])

  // Growth rate data
  const growthRateData = useMemo(() => {
    return monthlyComparison.map(item => ({
      category: item.category,
      growthRate: item.changePercent,
      change: item.change
    })).sort((a, b) => b.growthRate - a.growthRate)
  }, [monthlyComparison])

  // Quarterly data
  const quarterlyData = useMemo(() => {
    const quarterMap = {}
    
    expenses.forEach(exp => {
      const date = parseDateString(exp.date)
      if (!date) return
      
      const quarter = Math.floor(date.getMonth() / 3) + 1
      const quarterKey = `Q${quarter} ${date.getFullYear()}`
      const category = exp.category || 'OTHER'
      const amount = Math.abs(parseFloat(exp.amount) || 0)
      
      if (!quarterMap[quarterKey]) {
        quarterMap[quarterKey] = {}
      }
      
      quarterMap[quarterKey][category] = (quarterMap[quarterKey][category] || 0) + amount
    })

    return Object.entries(quarterMap).map(([quarter, categories]) => ({
      quarter,
      ...categories
    }))
  }, [expenses])

  // Year-over-year comparison
  const yearOverYearData = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const lastYear = currentYear - 1

    const currentYearData = {}
    const lastYearData = {}

    expenses.forEach(exp => {
      const date = parseDateString(exp.date)
      if (!date) return
      
      const category = exp.category || 'OTHER'
      const amount = Math.abs(parseFloat(exp.amount) || 0)
      
      if (date.getFullYear() === currentYear) {
        currentYearData[category] = (currentYearData[category] || 0) + amount
      } else if (date.getFullYear() === lastYear) {
        lastYearData[category] = (lastYearData[category] || 0) + amount
      }
    })

    const allCategories = new Set([
      ...Object.keys(currentYearData),
      ...Object.keys(lastYearData)
    ])

    return Array.from(allCategories).map(category => {
      const current = currentYearData[category] || 0
      const previous = lastYearData[category] || 0
      const change = current - previous
      const changePercent = previous > 0 ? (change / previous) * 100 : 0

      return {
        category,
        currentYear: current,
        lastYear: previous,
        change,
        changePercent
      }
    }).sort((a, b) => b.currentYear - a.currentYear)
  }, [expenses])

  // Colors for charts
  const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
    '#06b6d4', '#84cc16', '#f97316', '#a855f7', '#e11d48', '#14b8a6'
  ]

  const getColor = (index) => COLORS[index % COLORS.length]

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
              {entry.payload?.percentage && ` (${entry.payload.percentage.toFixed(1)}%)`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = ['Category', 'Total Amount', 'Transaction Count', 'Percentage', 'Average per Transaction']
    const rows = categoryData.map(cat => [
      cat.name,
      cat.total.toFixed(2),
      cat.count,
      cat.percentage.toFixed(2) + '%',
      cat.average.toFixed(2)
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-category-kpi-${dateRange.startDate}-${dateRange.endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }, [categoryData, dateRange])

  const totalExpenses = categoryData.reduce((sum, cat) => sum + cat.total, 0)

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expense data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expense Category KPI Dashboard</h1>
            <p className="mt-2 text-gray-600">Comprehensive analysis of expense category spending patterns</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={loadExpenses}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Date Range Controls */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Date Range</h2>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'current-month', label: 'This Month' },
              { key: 'last-month', label: 'Last Month' },
              { key: 'last-3-months', label: 'Last 3 Months' },
              { key: 'last-6-months', label: 'Last 6 Months' },
              { key: 'last-12-months', label: 'Last 12 Months' },
              { key: 'year-to-date', label: 'Year to Date' },
              { key: 'this-quarter', label: 'This Quarter' },
              { key: 'last-quarter', label: 'Last Quarter' },
              { key: 'this-year', label: 'This Year' },
              { key: 'last-year', label: 'Last Year' },
              { key: '2-years', label: '2 Years (This YTD and Previous Year)' }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => handleDateRangeChange(option.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRangeType === option.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categoryData.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg per Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(expenses.length > 0 ? totalExpenses / expenses.length : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Spending Overview Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Spending Overview</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pie Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category (Pie Chart)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      onClick={(data) => setSelectedCategory(data.name)}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {pieChartData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-2" 
                        style={{ backgroundColor: getColor(index) }}
                      />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                      <span className="text-xs text-gray-500 ml-2">{item.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category (Bar Chart)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" width={150} stroke="#64748b" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(index)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution (Donut Chart)</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold">
                    {formatCurrency(totalExpenses)}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Time-Based Analysis Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Time-Based Analysis</h2>
          
          {/* Multi-Line Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category Over Time</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {categoryData.slice(0, 10).map((cat, index) => (
                    <Line
                      key={cat.name}
                      type="monotone"
                      dataKey={cat.name}
                      stroke={getColor(index)}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name={cat.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stacked Area Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Trends Over Time (Stacked)</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {categoryData.slice(0, 8).map((cat, index) => (
                    <Area
                      key={cat.name}
                      type="monotone"
                      dataKey={cat.name}
                      stackId="1"
                      stroke={getColor(index)}
                      fill={getColor(index)}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison (Current vs Previous Month)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Month</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Previous Month</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change ($)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyComparison.map((item, index) => (
                    <tr key={item.category} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.current)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(item.previous)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-semibold ${
                        item.change >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.change >= 0 ? '+' : ''}{formatCurrency(item.change)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-semibold ${
                        item.changePercent >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Year-over-Year Comparison */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Year-over-Year Comparison</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearOverYearData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="currentYear" fill="#3b82f6" name="Current Year" />
                  <Bar dataKey="lastYear" fill="#94a3b8" name="Last Year" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quarterly Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Trends</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="quarter" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {categoryData.slice(0, 8).map((cat, index) => (
                    <Bar key={cat.name} dataKey={cat.name} stackId="1" fill={getColor(index)} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category Performance Metrics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Performance Metrics</h2>
          
          {/* Top 10 Categories */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Categories by Spending</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg per Transaction</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {top10Categories.map((cat, index) => (
                    <tr key={cat.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700">
                          {cat.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat.name}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(cat.total)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{cat.percentage.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{cat.count}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(cat.average)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Average Expense per Category */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Expense per Category</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="average" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transaction Count by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Count by Category</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ExpenseCategoryKPI

