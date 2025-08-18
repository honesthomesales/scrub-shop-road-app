import React, { useState, useEffect } from 'react'
import { Edit, Trash2, Plus, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { formatDate, formatCurrency, getMonthName, getNextMonth, getPreviousMonth, parseDateString } from '../utils/dateUtils'
import { SALES_STATUS_OPTIONS } from '../utils/sheetMappings'
import { cn } from '../utils/cn'

const SalesList = ({ onAddSale, onEditSale, onDeleteSale }) => {
  const { rawSalesData, currentMonth, setCurrentMonth, venuesData } = useApp()
  const [filteredSales, setFilteredSales] = useState([])
  const [selectedSale, setSelectedSale] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // Filter sales by current month
  useEffect(() => {
    const filtered = rawSalesData.filter(sale => {
      // Use the parseDateString function for consistent date parsing
      const saleDate = parseDateString(sale.date)
      
      // Skip entries with invalid dates
      if (!saleDate) {
        return false
      }
      
      const matchesMonth = saleDate.getMonth() === currentMonth.getMonth() && 
                          saleDate.getFullYear() === currentMonth.getFullYear()
      
      return matchesMonth
    }).sort((a, b) => {
      const dateA = parseDateString(a.date)
      const dateB = parseDateString(b.date)
      return dateB - dateA
    })
    
    setFilteredSales(filtered)
  }, [rawSalesData, currentMonth])

  const getVenueName = (sale) => {
    // For aggregated data, use the store field, fallback to venueId for backward compatibility
    return sale.store || sale.venueId || 'N/A'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-success-100 text-success-800'
      case 'Pending':
        return 'bg-warning-100 text-warning-800'
      case 'Closed':
        return 'bg-secondary-100 text-secondary-800'
      case 'Cancelled':
        return 'bg-danger-100 text-danger-800'
      default:
        return 'bg-secondary-100 text-secondary-800'
    }
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth))
  }

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth))
  }

  const handleDelete = async (saleId) => {
    if (window.confirm('Are you sure you want to delete this sale entry?')) {
      await onDeleteSale(saleId)
    }
  }

  const handleViewDetails = (sale) => {
    setSelectedSale(sale)
    setShowDetails(true)
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePreviousMonth}
            className="btn-outline"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous Month
          </button>
          
          <h2 className="text-xl font-semibold text-secondary-900">
            {getMonthName(currentMonth)} ({currentMonth.getFullYear()})
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="btn-outline"
          >
            Next Month
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentMonth(new Date(2024, 6, 1))} // July 2024
            className="btn-outline text-sm"
          >
            Go to July 2024
          </button>
          <button
            onClick={onAddSale}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sale
          </button>
        </div>
      </div>

      {/* Sales List */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Store</th>
                  <th className="table-header-cell">Gross Sales</th>
                  <th className="table-header-cell">Net Sales</th>
                  <th className="table-header-cell">Sales Tax</th>
                  <th className="table-header-cell">Entries</th>
                  <th className="table-header-cell">Details</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-cell text-center text-secondary-500 py-8">
                      No sales entries found for {getMonthName(currentMonth)}
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="table-row"
                      onDoubleClick={() => onEditSale(sale)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="table-cell font-medium">
                        {formatDate(sale.date)}
                      </td>
                      <td className="table-cell">
                        {getVenueName(sale)}
                      </td>
                      <td className="table-cell font-semibold">
                        {formatCurrency(sale.grossSales)}
                      </td>
                      <td className="table-cell">
                        {formatCurrency(sale.netSales)}
                      </td>
                      <td className="table-cell">
                        {formatCurrency(sale.salesTax)}
                      </td>
                      <td className="table-cell">
                        {sale.count || 1}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(sale)}
                            className="text-secondary-600 hover:text-secondary-900 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditSale(sale)}
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="text-danger-600 hover:text-danger-900 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Details Modal */}
      {showDetails && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Sale Details
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-secondary-600">Date</label>
                <p className="text-secondary-900">{formatDate(selectedSale.date)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Store</label>
                <p className="text-secondary-900">{getVenueName(selectedSale)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Gross Sales (Total)</label>
                <p className="text-secondary-900 font-semibold">{formatCurrency(selectedSale.grossSales)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Net Sales (Total)</label>
                <p className="text-secondary-900">{formatCurrency(selectedSale.netSales)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Sales Tax (Total)</label>
                <p className="text-secondary-900">{formatCurrency(selectedSale.salesTax)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Number of Entries</label>
                <p className="text-secondary-900">{selectedSale.count || 1}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="btn-outline"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetails(false)
                  onEditSale(selectedSale)
                }}
                className="btn-primary"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesList 