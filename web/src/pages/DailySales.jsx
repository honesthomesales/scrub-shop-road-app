import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import SalesList from '../components/SalesList'
import { getDefaultSalesEntry, SALES_STATUS_OPTIONS } from '../utils/sheetMappings'
import { cn } from '../utils/cn'
import { parseDateString, formatDateInput } from '../utils/dateUtils'

const DailySales = () => {
  const { 
    currentSheet, 
    addSalesEntry, 
    updateSalesEntry, 
    deleteSalesEntry, 
    venuesData,
    loading 
  } = useApp()
  
  const [showModal, setShowModal] = useState(false)
  const [editingSale, setEditingSale] = useState(null)
  const [formData, setFormData] = useState(getDefaultSalesEntry(currentSheet))
  const [formErrors, setFormErrors] = useState({})

  const handleAddSale = () => {
    setEditingSale(null)
    setFormData(getDefaultSalesEntry(currentSheet))
    setFormErrors({})
    setShowModal(true)
  }

  const handleEditSale = (sale) => {
    console.log('DEBUG SALE:', sale);
    console.log('DEBUG DATE INPUT VALUE:', formatDateInput(sale.date));
    // Map venue name to venue id for select
    const venueIdFromName = venuesData.find(
      v => v.promo === sale.venueId || v.promo === sale.venue_id || v.promo === sale.venue
    )?.id || '';
    setEditingSale(sale)
    // Use local yyyy-MM-dd for input type="date"
    setFormData({
      date: formatDateInput(sale.date),
      status: sale.status || 'Confirmed',
      salesTax: sale.salesTax !== undefined && sale.salesTax !== null ? sale.salesTax : 0,
      netSales: sale.netSales !== undefined && sale.netSales !== null ? sale.netSales : 0,
      grossSales: sale.grossSales !== undefined && sale.grossSales !== null ? sale.grossSales : 0,
      venueId: venueIdFromName,
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDeleteSale = async (saleId) => {
    const result = await deleteSalesEntry(saleId)
    if (!result.success) {
      alert(`Error deleting sale: ${result.error}`)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.date) {
      errors.date = 'Date is required'
    }
    
    if (!formData.status) {
      errors.status = 'Status is required'
    }
    
    if (formData.grossSales < 0) {
      errors.grossSales = 'Gross sales cannot be negative'
    }
    
    if (formData.netSales < 0) {
      errors.netSales = 'Net sales cannot be negative'
    }
    
    if (formData.salesTax < 0) {
      errors.salesTax = 'Sales tax cannot be negative'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const sheetData = {
      date: formData.date,
      status: formData.status,
      sales_tax: formData.salesTax,
      net_sales: formData.netSales,
      gross_sales: formData.grossSales,
      venue_id: formData.venueId
    }
    
    let result
    if (editingSale) {
      result = await updateSalesEntry(editingSale.id, sheetData)
    } else {
      result = await addSalesEntry(sheetData)
    }
    
    if (result.success) {
      setShowModal(false)
      setEditingSale(null)
      setFormData(getDefaultSalesEntry(currentSheet))
    } else {
      alert(`Error ${editingSale ? 'updating' : 'adding'} sale: ${result.error}`)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading sales data...</p>
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
            Daily Sales
          </h1>
          <p className="mt-2 text-secondary-600">
            Manage sales entries for {currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'} operations
          </p>
        </div>

        {/* Sales List */}
        <SalesList
          onAddSale={handleAddSale}
          onEditSale={handleEditSale}
          onDeleteSale={handleDeleteSale}
        />

        {/* Add/Edit Sale Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">
                  {editingSale ? 'Edit Sale' : 'Add New Sale'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-secondary-400 hover:text-secondary-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={cn(
                      'input',
                      formErrors.date && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                    )}
                  />
                  {formErrors.date && (
                    <p className="mt-1 text-sm text-danger-600">{formErrors.date}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={cn(
                      'input',
                      formErrors.status && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                    )}
                  >
                    <option value="">Select Status</option>
                    {SALES_STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {formErrors.status && (
                    <p className="mt-1 text-sm text-danger-600">{formErrors.status}</p>
                  )}
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Venue
                  </label>
                  <select
                    value={formData.venueId}
                    onChange={(e) => handleInputChange('venueId', e.target.value)}
                    className="input"
                  >
                    <option value="">Select Venue</option>
                    {venuesData.map(venue => (
                      <option key={venue.id} value={venue.id}>
                        {venue.promo} - {venue.addressCity}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gross Sales */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Gross Sales
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.grossSales}
                    onChange={(e) => handleInputChange('grossSales', parseFloat(e.target.value) || 0)}
                    className={cn(
                      'input',
                      formErrors.grossSales && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                    )}
                    placeholder="0.00"
                  />
                  {formErrors.grossSales && (
                    <p className="mt-1 text-sm text-danger-600">{formErrors.grossSales}</p>
                  )}
                </div>

                {/* Net Sales */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Net Sales
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.netSales}
                    onChange={(e) => handleInputChange('netSales', parseFloat(e.target.value) || 0)}
                    className={cn(
                      'input',
                      formErrors.netSales && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                    )}
                    placeholder="0.00"
                  />
                  {formErrors.netSales && (
                    <p className="mt-1 text-sm text-danger-600">{formErrors.netSales}</p>
                  )}
                </div>

                {/* Sales Tax */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Sales Tax
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salesTax}
                    onChange={(e) => handleInputChange('salesTax', parseFloat(e.target.value) || 0)}
                    className={cn(
                      'input',
                      formErrors.salesTax && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                    )}
                    placeholder="0.00"
                  />
                  {formErrors.salesTax && (
                    <p className="mt-1 text-sm text-danger-600">{formErrors.salesTax}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingSale ? 'Update Sale' : 'Add Sale'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DailySales 