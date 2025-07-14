import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency, getShortMonthName, parseDateString } from '../utils/dateUtils'

const DashboardChart = ({ salesData, currentSheet }) => {
  const [showTwoYearsAgo, setShowTwoYearsAgo] = useState(false)
  // Generate chart data from actual sales data
  const generateChartData = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1
    const twoYearsAgo = currentYear - 2
    
    return months.map((month, index) => {
      // Filter sales for this year, last year, and two years ago for this month
      const thisYearSales = salesData.filter(sale => {
        const saleDate = parseDateString(sale.date)
        return saleDate && 
               saleDate.getMonth() === index && 
               saleDate.getFullYear() === currentYear
      })
      
      const lastYearSales = salesData.filter(sale => {
        const saleDate = parseDateString(sale.date)
        return saleDate && 
               saleDate.getMonth() === index && 
               saleDate.getFullYear() === lastYear
      })
      
      const twoYearsAgoSales = salesData.filter(sale => {
        const saleDate = parseDateString(sale.date)
        return saleDate && 
               saleDate.getMonth() === index && 
               saleDate.getFullYear() === twoYearsAgo
      })
      
      // Calculate totals
      const thisYearTotal = thisYearSales.reduce((sum, sale) => sum + (sale.grossSales || 0), 0)
      const lastYearTotal = lastYearSales.reduce((sum, sale) => sum + (sale.grossSales || 0), 0)
      const twoYearsAgoTotal = twoYearsAgoSales.reduce((sum, sale) => sum + (sale.grossSales || 0), 0)
      
      return {
        month,
        thisYear: thisYearTotal,
        lastYear: lastYearTotal,
        twoYearsAgo: twoYearsAgoTotal
      }
    })
  }

  const chartData = generateChartData()

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
          Gross Sales: This Year vs Last Year{showTwoYearsAgo ? ' vs 2 Years Ago' : ''} ({currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'})
        </h3>
        <button
          className={`mt-2 sm:mt-0 px-3 py-1 rounded border text-xs font-semibold transition ${showTwoYearsAgo ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-primary-600 border-primary-200 hover:bg-primary-50'}`}
          onClick={() => setShowTwoYearsAgo(v => !v)}
        >
          {showTwoYearsAgo ? 'Hide' : 'Show'} 2 Years Ago
        </button>
      </div>
      <div className="card-body">
        <div className="h-80">
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="thisYear" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="This Year"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="lastYear" 
                stroke="#94a3b8" 
                strokeWidth={2}
                name="Last Year"
                dot={{ fill: '#94a3b8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#94a3b8', strokeWidth: 2 }}
              />
              {showTwoYearsAgo && (
                <Line
                  type="monotone"
                  dataKey="twoYearsAgo"
                  stroke="#f59e42"
                  strokeWidth={2}
                  name="2 Years Ago"
                  dot={{ fill: '#f59e42', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#f59e42', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardChart 