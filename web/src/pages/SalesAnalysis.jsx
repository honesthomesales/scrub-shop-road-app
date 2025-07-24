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

      const options = {
        startDate,
        endDate,
        storeIds: selectedStores.length > 0 ? selectedStores : null
      }

      console.log('Loading analysis data with options:', options)
      console.log('Selected stores:', selectedStores)

      const result = await supabaseAPI.getSalesAnalysis(options)
      if (result.success) {
        console.log('Analysis data loaded:', result.data.length, 'records')
        setAnalysisData(result.data)
      } else {
        console.error('Failed to load analysis data:', result.error)
      }
    } catch (error) {
      console.error('Failed to load analysis data:', error)
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

    // Daily sales data
    const dailyData = analysisData.reduce((acc, item) => {
      const date = item.invoice_date
      const existing = acc.find(d => d.date === date)
      if (existing) {
        existing.sales += parseFloat(item.actual) * parseInt(item.sold_qty)
        existing.count += 1
      } else {
        acc.push({
          date,
          sales: parseFloat(item.actual) * parseInt(item.sold_qty),
          count: 1
        })
      }
      return acc
    }, []).sort((a, b) => new Date(a.date) - new Date(b.date))

    // Store performance data
    const storeData = analysisData.reduce((acc, item) => {
      const storeId = item.store_id
      const existing = acc.find(s => s.storeId === storeId)
      const sales = parseFloat(item.actual) * parseInt(item.sold_qty)
      const cost = parseFloat(item.cost) * parseInt(item.sold_qty)
      
      if (existing) {
        existing.sales += sales
        existing.cost += cost
        existing.profit += (sales - cost)
        existing.count += 1
      } else {
        acc.push({
          storeId,
          storeName: getStoreName(storeId),
          sales,
          cost,
          profit: sales - cost,
          count: 1
        })
      }
      return acc
    }, [])

    // Product type data
    const productData = analysisData.reduce((acc, item) => {
      const product = item.product || 'Unknown'
      const existing = acc.find(p => p.product === product)
      const sales = parseFloat(item.actual) * parseInt(item.sold_qty)
      
      if (existing) {
        existing.sales += sales
        existing.count += parseInt(item.sold_qty)
      } else {
        acc.push({
          product,
          sales,
          count: parseInt(item.sold_qty)
        })
      }
      return acc
    }, []).sort((a, b) => b.sales - a.sales).slice(0, 10)

    // Brand/Vendor data
    const brandData = analysisData.reduce((acc, item) => {
      const vendor = item.vendor || 'Unknown'
      const existing = acc.find(b => b.vendor === vendor)
      const sales = parseFloat(item.actual) * parseInt(item.sold_qty)
      
      if (existing) {
        existing.sales += sales
        existing.count += parseInt(item.sold_qty)
      } else {
        acc.push({
          vendor,
          sales,
          count: parseInt(item.sold_qty)
        })
      }
      return acc
    }, []).sort((a, b) => b.sales - a.sales).slice(0, 10)

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
                Store Selection
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
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {stores.map(store => (
                <button
                  key={store.id}
                  onClick={() => handleStoreToggle(store.id)}
                  className={`p-2 border rounded-lg text-sm font-medium transition-colors ${
                    selectedStores.includes(store.id)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {store.name}
                </button>
              ))}
            </div>
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
                  {storeData.length}
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