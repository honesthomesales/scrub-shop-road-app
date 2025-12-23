import React, { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Tag, Search, CheckCircle, AlertCircle, Loader, Calendar, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import supabaseAPI from '../services/supabaseAPI'
import { formatCurrency, parseDateString } from '../utils/dateUtils'
import { getSupabase } from '../services/supabaseAPI'

const ExpenseCategorization = () => {
  // Initialize date range to current month
  const getCurrentMonthRange = () => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoCategorizing, setAutoCategorizing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState({})
  const [updatingExpense, setUpdatingExpense] = useState(null)
  const [dateRange, setDateRange] = useState(getCurrentMonthRange())
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [stats, setStats] = useState({ total: 0, uncategorized: 0, categorized: 0 })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadExpenses()
    calculateStats()
  }, [dateRange])

  const loadCategories = async () => {
    try {
      const categoriesResult = await supabaseAPI.readTable('categories', {
        orderBy: { column: 'name', ascending: true }
      })
      
      if (categoriesResult.success) {
        setCategories(categoriesResult.data || [])
      } else {
        setError('Failed to load categories: ' + categoriesResult.error)
      }
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

      // Query uncategorized expenses (null or 'OTHER') within date range
      // Exclude positive amounts (income) and payment transfers
      // Use pagination to fetch all expenses (Supabase has a default limit of 1000)
      let allData = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error: queryError } = await supabase
          .from('expenses')
          .select('id, date, description, amount, source, category')
          .or('category.is.null,category.eq.OTHER')
          .lt('amount', 0) // Only negative amounts (expenses)
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate)
          .order('date', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (queryError) {
          throw new Error(queryError.message)
        }

        if (data && data.length > 0) {
          allData = allData.concat(data)
          // If we got less than pageSize, we've reached the end
          hasMore = data.length === pageSize
          page++
        } else {
          hasMore = false
        }
      }

      // Filter out payment transfers (PMT AMEX and CAPITAL ONE in description) - case insensitive
      const filtered = allData.filter(exp => {
        const description = (exp.description || '').toUpperCase().trim()
        return !description.includes('PMT AMEX') && !description.includes('CAPITAL ONE')
      })

      setExpenses(filtered)
    } catch (err) {
      setError('Error loading expenses: ' + err.message)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = async () => {
    try {
      const supabase = getSupabase()
      if (!supabase) {
        return
      }

      // Use count queries for better performance
      // Only count expenses (negative amounts) and exclude payment transfers
      const [totalResult, uncategorizedResult, categorizedResult] = await Promise.all([
        supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .lt('amount', 0) // Only expenses (negative amounts)
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate),
        supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .or('category.is.null,category.eq.OTHER')
          .lt('amount', 0) // Only expenses (negative amounts)
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate),
        supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .not('category', 'is', null)
          .neq('category', 'OTHER')
          .lt('amount', 0) // Only expenses (negative amounts)
          .gte('date', dateRange.startDate)
          .lte('date', dateRange.endDate)
      ])

      // Note: Payment transfers (PMT AMEX, CAPITAL ONE) are excluded from counts
      // This matches the filtering in loadExpenses

      setStats({
        total: totalResult.count || 0,
        uncategorized: uncategorizedResult.count || 0,
        categorized: categorizedResult.count || 0
      })
    } catch (err) {
      console.error('Error calculating stats:', err)
    }
  }

  const normalizeText = (text) => {
    if (!text) return ''
    // Normalize to uppercase and trim for case-insensitive comparison
    // Handle null/undefined and convert to string
    return String(text).toUpperCase().trim()
  }

  const findMatchingCategory = (description) => {
    if (!description) return null

    // Case-insensitive matching - normalize description once
    const normalizedDesc = normalizeText(description)
    
    // Find the first category that matches (case insensitive, contains check)
    for (const category of categories) {
      // Skip if no keywords
      if (!category.keywords) continue
      
      // Handle both array and string formats (in case keywords is stored as string)
      let keywordsArray = []
      if (Array.isArray(category.keywords)) {
        keywordsArray = category.keywords
      } else if (typeof category.keywords === 'string') {
        // If stored as comma-separated string, split it
        keywordsArray = category.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      }
      
      // Check each keyword (case-insensitive contains check)
      for (const keyword of keywordsArray) {
        if (!keyword) continue // Skip null/empty keywords
        
        const normalizedKeyword = normalizeText(keyword)
        
        // Use contains check (case-insensitive) - keyword must be found within description
        if (normalizedKeyword && normalizedDesc.includes(normalizedKeyword)) {
          return category
        }
      }
    }
    
    return null
  }

  const handleAutoCategorize = async () => {
    setAutoCategorizing(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabase()
      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      // Load uncategorized expenses (null or 'OTHER') in date range
      // Exclude positive amounts (income) and payment transfers
      const { data: uncategorizedExpenses, error: queryError } = await supabase
        .from('expenses')
        .select('id, description, category')
        .or('category.is.null,category.eq.OTHER')
        .lt('amount', 0) // Only negative amounts (expenses)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)

      if (queryError) {
        throw new Error('Failed to load expenses: ' + queryError.message)
      }

      if (!uncategorizedExpenses || uncategorizedExpenses.length === 0) {
        setError('No uncategorized expenses found in the selected date range.')
        return
      }

      // Filter out payment transfers (PMT AMEX and CAPITAL ONE in description) - case insensitive
      const filteredExpenses = uncategorizedExpenses.filter(exp => {
        const description = (exp.description || '').toUpperCase().trim()
        return !description.includes('PMT AMEX') && !description.includes('CAPITAL ONE')
      })

      if (filteredExpenses.length === 0) {
        setError('No uncategorized expenses found in the selected date range (after filtering payment transfers).')
        return
      }
      
      let categorizedCount = 0
      let failedCount = 0

      // Process each uncategorized expense
      for (const expense of filteredExpenses) {
        const matchingCategory = findMatchingCategory(expense.description)
        
        if (matchingCategory) {
          try {
            const { error: updateError } = await supabase
              .from('expenses')
              .update({ category: matchingCategory.name })
              .eq('id', expense.id)
            
            if (!updateError) {
              categorizedCount++
            } else {
              failedCount++
              console.error('Failed to update expense:', expense.id, updateError)
            }
          } catch (err) {
            failedCount++
            console.error('Error updating expense:', expense.id, err)
          }
        }
      }

      // Reload data
      await loadExpenses()
      await calculateStats()

      if (categorizedCount > 0) {
        setSuccess(`Successfully categorized ${categorizedCount} expense(s). ${failedCount > 0 ? `${failedCount} failed.` : ''}`)
      } else {
        setError('No expenses were auto-categorized. Make sure categories have keywords defined.')
      }
    } catch (err) {
      setError('Error during auto-categorization: ' + err.message)
    } finally {
      setAutoCategorizing(false)
    }
  }

  const handleManualCategorize = async (expenseId, categoryName) => {
    setUpdatingExpense(expenseId)
    setError(null)
    setSuccess(null)

    try {
      const result = await supabaseAPI.updateRow('expenses', expenseId, {
        category: categoryName || null
      })

      if (result.success) {
        setSuccess('Expense category updated successfully')
        // Update local state
        setExpenses(prev => prev.filter(exp => exp.id !== expenseId))
        await calculateStats()
      } else {
        setError('Failed to update expense: ' + result.error)
      }
    } catch (err) {
      setError('Error updating expense: ' + err.message)
    } finally {
      setUpdatingExpense(null)
    }
  }

  const filteredExpenses = useMemo(() => {
    // First filter by search term (case insensitive)
    let filtered = expenses.filter(exp => {
      if (!searchTerm) return true
      
      const searchLower = searchTerm.toLowerCase().trim()
      const description = (exp.description || '').toLowerCase().trim()
      const source = (exp.source || '').toLowerCase().trim()
      const dateStr = (exp.date || '').toString()
      
      return (
        description.includes(searchLower) ||
        source.includes(searchLower) ||
        dateStr.includes(searchLower)
      )
    })

    // Then sort
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortField) {
        case 'date':
          aValue = a.date ? new Date(a.date).getTime() : 0
          bValue = b.date ? new Date(b.date).getTime() : 0
          break
        case 'description':
          aValue = (a.description || '').toLowerCase()
          bValue = (b.description || '').toLowerCase()
          break
        case 'amount':
          aValue = parseFloat(a.amount || 0)
          bValue = parseFloat(b.amount || 0)
          break
        case 'source':
          aValue = (a.source || '').toLowerCase()
          bValue = (b.source || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [expenses, searchTerm, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with default direction
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-primary-600" />
      : <ArrowDown className="w-4 h-4 text-primary-600" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expense Categorization</h1>
            <p className="mt-2 text-gray-600">Categorize uncategorized expenses automatically or manually</p>
          </div>
          <button
            onClick={() => {
              loadExpenses()
              calculateStats()
            }}
            disabled={loading || autoCategorizing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="pt-6">
                <button
                  onClick={() => setDateRange(getCurrentMonthRange())}
                  className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Current Month
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Tag className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Uncategorized</p>
                <p className="text-2xl font-bold text-orange-600">{stats.uncategorized}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Categorized</p>
                <p className="text-2xl font-bold text-green-600">{stats.categorized}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Auto-Categorize Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleAutoCategorize}
            disabled={autoCategorizing || loading || expenses.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {autoCategorizing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Auto-Categorizing...</span>
              </>
            ) : (
              <>
                <Tag className="w-5 h-5" />
                <span>Auto-Categorize All</span>
              </>
            )}
          </button>
          <div className="text-sm text-gray-600">
            {expenses.length} uncategorized expense(s) remaining
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by description, source, or date..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Expenses Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Tag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No expenses match your search' : 'All expenses are categorized!'}
            </p>
            <p className="text-gray-600">
              {searchTerm ? 'Try a different search term.' : 'Great job! All expenses have been categorized.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-2">
                      Description
                      <SortIcon field="description" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-2">
                      Amount
                      <SortIcon field="amount" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('source')}
                  >
                    <div className="flex items-center gap-2">
                      Source
                      <SortIcon field="source" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md truncate" title={expense.description}>
                        {expense.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {expense.source || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {updatingExpense === expense.id ? (
                        <Loader className="w-5 h-5 animate-spin text-primary-600" />
                      ) : (
                        <select
                          value={selectedCategory[expense.id] || ''}
                          onChange={(e) => {
                            const categoryName = e.target.value
                            setSelectedCategory(prev => ({ ...prev, [expense.id]: categoryName }))
                            handleManualCategorize(expense.id, categoryName)
                          }}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select category...</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExpenseCategorization

