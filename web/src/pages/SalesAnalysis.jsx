import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns'
import { 
  Calendar, 
  Filter, 
  Download, 
  TrendingUp, 
  Store, 
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import supabaseAPI from '../services/supabaseAPI'

const SalesAnalysis = () => {
  const { salesAnalysisData, salesAnalysisStats } = useApp()
  const [dateRange, setDateRange] = useState('30')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedStores, setSelectedStores] = useState([])
  const [analysisData, setAnalysisData] = useState([])
  const [loading, setLoading] = useState(true)
  const [compareYear, setCompareYear] = useState(false)

  const stores = [
    { id: 1, name: 'Spartanburg' },
    { id: 2, name: 'Greenville' },
    { id: 3, name: 'Columbia' },
    { id: 5, name: 'Trailer' },
    { id: 7, name: 'Camper' }
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  // Date range options
  const dateRanges = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: '365', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  useEffect(() => {
    loadAnalysisData()
  }, [dateRange, customStartDate, customEndDate, selectedStores, compareYear])

  const loadAnalysisData = async () => {
    setLoading(true)
    try {
      let startDate, endDate

      if (dateRange === 'custom') {
        startDate = customStartDate
        endDate = customEndDate
      } else {
        endDate = format(new Date(), 'yyyy-MM-dd')
        startDate = format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd')
      }

      // Only apply store filtering if specific stores are selected
      // If no stores are selected, show all stores (don't filter)
      const options = {
        startDate,
        endDate,
        storeIds: selectedStores.length > 0 ? selectedStores : undefined
      }

      console.log('Loading analysis data with options:', options)
      console.log('Selected stores:', selectedStores)

      const result = await supabaseAPI.getSalesAnalysis(options)
      console.log('API result:', result)
      
      if (result.success) {
        console.log('Analysis data loaded:', result.data.length, 'records')
        console.log('Sample data:', result.data.slice(0, 3))
        console.log('Store IDs in data:', [...new Set(result.data.map(item => item.store_id))])
        console.log('Requested store IDs:', options.storeIds)
        console.log('Date range:', options.startDate, 'to', options.endDate)
        
        // Debug store selection vs data availability
        if (selectedStores.length > 0) {
          const storesWithData = [...new Set(result.data.map(item => item.store_id))]
          const storesWithoutData = selectedStores.filter(id => !storesWithData.includes(id))
          if (storesWithoutData.length > 0) {
            console.log('⚠️ Selected stores with no data in date range:', storesWithoutData.map(id => getStoreName(id)))
          }
        }
        
        // Check if we're getting the expected number of records
        if (result.data.length >= 1000) {
          console.warn('⚠️ Data may be limited to 1000 records. Consider implementing pagination.')
        }
        
        setAnalysisData(result.data)
      } else {
        console.error('Failed to load analysis data:', result.error)
        // Set empty data if API fails
        setAnalysisData([])
      }
    } catch (error) {
      console.error('Failed to load analysis data:', error)
      // Set empty data if there's an error
      setAnalysisData([])
    } finally {
      setLoading(false)
    }
  }

  const handleStoreToggle = (storeId) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    )
  }

  const handleSelectAllStores = () => {
    setSelectedStores(stores.map(store => store.id))
  }

  const handleClearStores = () => {
    setSelectedStores([])
  }

  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId)
    return store ? store.name : `Store ${storeId}`
  }

  // Process data for charts
  const processChartData = () => {
    if (!analysisData.length) return { dailyData: [], storeData: [], productData: [], brandData: [] }

    console.log('Processing chart data for', analysisData.length, 'records')

    // Daily sales data
    const dailyData = analysisData.reduce((acc, item) => {
      const date = item.invoice_date
      if (!date) return acc
      
      const existing = acc.find(d => d.date === date)
      const actual = parseFloat(item.actual) || 0
      const soldQty = parseInt(item.sold_qty) || 0
      const sales = actual * soldQty
      
      if (existing) {
        existing.sales += sales
        existing.count += 1
      } else {
        acc.push({
          date,
          sales,
          count: 1
        })
      }
      return acc
    }, []).sort((a, b) => new Date(a.date) - new Date(b.date))

    // Store performance data
    const storeData = analysisData.reduce((acc, item) => {
      const storeId = item.store_id
      if (!storeId) return acc
      
      const existing = acc.find(s => s.storeId === storeId)
      const actual = parseFloat(item.actual) || 0
      const cost = parseFloat(item.cost) || 0
      const soldQty = parseInt(item.sold_qty) || 0
      const sales = actual * soldQty
      const totalCost = cost * soldQty
      
      if (existing) {
        existing.sales += sales
        existing.cost += totalCost
        existing.profit += (sales - totalCost)
        existing.count += 1
      } else {
        acc.push({
          storeId,
          storeName: getStoreName(storeId),
          sales,
          cost: totalCost,
          profit: sales - totalCost,
          count: 1
        })
      }
      return acc
    }, [])

    // Add stores with no data to show them in the UI
    if (selectedStores.length > 0) {
      // When specific stores are selected, include all selected stores even if they have no data
      selectedStores.forEach(storeId => {
        const existing = storeData.find(s => s.storeId === storeId)
        if (!existing) {
          storeData.push({
            storeId,
            storeName: getStoreName(storeId),
            sales: 0,
            cost: 0,
            profit: 0,
            count: 0
          })
        }
      })
    } else {
      // When no stores are selected (showing all), include all available stores
      stores.forEach(store => {
        const existing = storeData.find(s => s.storeId === store.id)
        if (!existing) {
          storeData.push({
            storeId: store.id,
            storeName: store.name,
            sales: 0,
            cost: 0,
            profit: 0,
            count: 0
          })
        }
      })
    }

    // Product type data
    const productData = analysisData.reduce((acc, item) => {
      const product = item.product || 'Unknown'
      const existing = acc.find(p => p.product === product)
      const actual = parseFloat(item.actual) || 0
      const soldQty = parseInt(item.sold_qty) || 0
      const sales = actual * soldQty
      
      if (existing) {
        existing.sales += sales
        existing.count += soldQty
      } else {
        acc.push({
          product,
          sales,
          count: soldQty
        })
      }
      return acc
    }, []).sort((a, b) => b.sales - a.sales).slice(0, 10)

    // Brand/Vendor data
    const brandData = analysisData.reduce((acc, item) => {
      const vendor = item.vendor || 'Unknown'
      const existing = acc.find(b => b.vendor === vendor)
      const actual = parseFloat(item.actual) || 0
      const soldQty = parseInt(item.sold_qty) || 0
      const sales = actual * soldQty
      
      if (existing) {
        existing.sales += sales
        existing.count += soldQty
      } else {
        acc.push({
          vendor,
          sales,
          count: soldQty
        })
      }
      return acc
    }, []).sort((a, b) => b.sales - a.sales).slice(0, 10)

    console.log('Processed data:', {
      dailyDataCount: dailyData.length,
      storeDataCount: storeData.length,
      productDataCount: productData.length,
      brandDataCount: brandData.length
    })

    return { dailyData, storeData, productData, brandData }
  }

  const exportData = () => {
    const { dailyData, storeData, productData, brandData } = processChartData()
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,'
    
    // Daily data
    csvContent += 'Daily Sales Data\n'
    csvContent += 'Date,Sales,Transaction Count\n'
    dailyData.forEach(row => {
      csvContent += `${row.date},${row.sales.toFixed(2)},${row.count}\n`
    })
    
    csvContent += '\nStore Performance\n'
    csvContent += 'Store,Sales,Cost,Profit,Transaction Count\n'
    storeData.forEach(row => {
      csvContent += `${row.storeName},${row.sales.toFixed(2)},${row.cost.toFixed(2)},${row.profit.toFixed(2)},${row.count}\n`
    })
    
    // Download file
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `sales_analysis_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const { dailyData, storeData, productData, brandData } = processChartData()

  const totalSales = storeData.reduce((sum, store) => sum + store.sales, 0)
  const totalProfit = storeData.reduce((sum, store) => sum + store.profit, 0)
  const avgDailySales = dailyData.length > 0 ? totalSales / dailyData.length : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading sales analysis...</p>
        </div>
      </div>
    )
  }

  // Show message if no data
  if (analysisData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900">
              Sales Analysis
            </h1>
            <p className="mt-2 text-secondary-600">
              Comprehensive sales performance analysis and insights
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
            <p className="text-gray-500 mb-4">Your sales analysis will show data once you have uploaded sales information.</p>
            <p className="text-sm text-gray-400 mb-6">Upload your first CSV file using the Sales Upload feature to get started.</p>
            <a
              href="/admin/sales-upload"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Sales Upload
            </a>
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
          <h1 className="text-3xl font-bold text-secondary-900">
            Sales Analysis
          </h1>
          <p className="mt-2 text-secondary-600">
            Comprehensive sales performance analysis and insights
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </>
            )}

            {/* Year Comparison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Comparison
              </label>
              <button
                onClick={() => setCompareYear(!compareYear)}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                  compareYear
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {compareYear ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Store Selection */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Store Selection {selectedStores.length === 0 && <span className="text-gray-500">(All Stores)</span>}
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAllStores}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearStores}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  Show All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {stores.map(store => (
                <button
                  key={store.id}
                  onClick={() => handleStoreToggle(store.id)}
                  className={`p-2 border rounded-lg text-sm font-medium transition-colors ${
                    selectedStores.length === 0 || selectedStores.includes(store.id)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {store.name}
                </button>
              ))}
            </div>
            {selectedStores.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">
                Showing data from all stores. Select specific stores to filter the data.
              </p>
            )}
            {selectedStores.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                Showing data from {selectedStores.length} selected store{selectedStores.length !== 1 ? 's' : ''}.
              </p>
            )}
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={exportData}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Daily Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${avgDailySales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center">
              <Store className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stores Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedStores.length > 0 ? selectedStores.length : stores.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Sales Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Sales Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(parseISO(date), 'MM/dd')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Store Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Store Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={storeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="storeName" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']} />
                <Legend />
                <Bar dataKey="sales" fill="#0088FE" name="Sales" />
                <Bar dataKey="profit" fill="#00C49F" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product and Brand Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products by Sales</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="product" type="category" width={100} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']} />
                <Bar dataKey="sales" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Brands/Vendors */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Brands/Vendors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brandData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="vendor" type="category" width={100} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']} />
                <Bar dataKey="sales" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Store Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {storeData.map((store) => (
                  <tr key={store.storeId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {store.storeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${store.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${store.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${store.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {store.sales > 0 ? ((store.profit / store.sales) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {store.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesAnalysis 