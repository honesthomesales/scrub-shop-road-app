import React, { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency, getShortMonthName, parseDateString } from '../utils/dateUtils'

const DashboardChart = ({ salesData, currentSheet, selectedYears = [new Date().getFullYear()], selectedStores = [] }) => {
  const [showAllYears, setShowAllYears] = useState(false)
  
  // Generate chart data from actual sales data
  const generateChartData = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    return months.map((month, index) => {
      const monthData = { month }
      
      // Add data for each selected year
      selectedYears.forEach(year => {
        const yearSales = salesData.filter(sale => {
          const saleDate = parseDateString(sale.date)
          return saleDate && 
                 saleDate.getMonth() === index && 
                 saleDate.getFullYear() === year
        })
        
        const yearTotal = yearSales.reduce((sum, sale) => sum + (sale.grossSales || 0), 0)
        monthData[year] = yearTotal
      })
      
      return monthData
    })
  }

  const chartData = useMemo(() => generateChartData(), [salesData, selectedYears])

  // Calculate dynamic Y-axis domain based on actual data values
  const yAxisDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 100000]
    
    // Find the maximum value across all years and months
    let maxValue = 0
    chartData.forEach(monthData => {
      selectedYears.forEach(year => {
        const value = monthData[year] || 0
        if (value > maxValue) {
          maxValue = value
        }
      })
    })
    
    // Add 10% padding above the highest value, but ensure minimum range
    const paddedMax = Math.max(maxValue * 1.1, maxValue + 10000)
    
    return [0, paddedMax]
  }, [chartData, selectedYears])

  // Generate dynamic header based on selections
  const generateHeader = () => {
    const yearText = selectedYears.length === 1 
      ? selectedYears[0] 
      : selectedYears.length === 2 
        ? `Last ${selectedYears.length} Years` 
        : `Last ${selectedYears.length} Years`
    
    const storeText = selectedStores.length === 0 
      ? 'All Stores' 
      : selectedStores.length === 1 
        ? selectedStores[0] 
        : `${selectedStores.length} Stores`
    
    const sheetText = currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'
    
    return `Gross Sales: ${yearText} - ${storeText} (${sheetText})`
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-secondary-200 rounded-lg shadow-lg">
          <p className="font-medium text-secondary-900">{label}</p>
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
    <div className="card">
      <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-secondary-900">
          {generateHeader()}
        </h3>
        {selectedYears.length > 1 && (
          <button
            className={`mt-2 sm:mt-0 px-3 py-1 rounded border text-xs font-semibold transition ${showAllYears ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-primary-600 border-primary-200 hover:bg-primary-50'}`}
            onClick={() => setShowAllYears(v => !v)}
          >
            {showAllYears ? 'Hide' : 'Show'} All Years
          </button>
        )}
      </div>
      <div className="card-body">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                domain={yAxisDomain}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Render lines for each selected year */}
              {selectedYears.map((year, index) => {
                const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
                const color = colors[index % colors.length]
                
                return (
                  <Line
                    key={year}
                    type="monotone"
                    dataKey={year}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#94a3b8', strokeWidth: 2 }}
                    name={`${year}`}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardChart 