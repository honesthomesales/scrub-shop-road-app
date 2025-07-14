import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import VenueTable from '../components/VenueTable'
import { getDefaultVenueEntry } from '../utils/sheetMappings'
import { cn } from '../utils/cn'

const Venues = () => {
  const { addVenueEntry, updateVenueEntry, deleteVenueEntry, loading } = useApp()
  
  const [showModal, setShowModal] = useState(false)
  const [editingVenue, setEditingVenue] = useState(null)
  const [formData, setFormData] = useState(getDefaultVenueEntry())
  const [formErrors, setFormErrors] = useState({})

  const handleAddVenue = () => {
    setEditingVenue(null)
    setFormData(getDefaultVenueEntry())
    setFormErrors({})
    setShowModal(true)
  }

  const handleEditVenue = (venue) => {
    setEditingVenue(venue)
    setFormData({
      promo: venue.promo,
      promoSend: venue.promoSend,
      addressCity: venue.addressCity,
      contact: venue.contact,
      phone: venue.phone,
      email: venue.email,
      times: venue.times,
      showInfo: venue.showInfo,
      forecastWill: venue.forecastWill
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDeleteVenue = async (venueId) => {
    const result = await deleteVenueEntry(venueId)
    if (!result.success) {
      alert(`Error deleting venue: ${result.error}`)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.promo) {
      errors.promo = 'Venue name is required'
    }
    
    if (!formData.addressCity) {
      errors.addressCity = 'Address/City is required'
    }
    
    if (!formData.contact) {
      errors.contact = 'Contact is required'
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
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
      promo: formData.promo,
      promo_send: formData.promoSend,
      address_city: formData.addressCity,
      contact: formData.contact,
      phone: formData.phone,
      email: formData.email,
      times: formData.times,
      show_info: formData.showInfo,
      forecast_will: formData.forecastWill
    }
    
    let result
    if (editingVenue) {
      result = await updateVenueEntry(editingVenue.id, sheetData)
    } else {
      result = await addVenueEntry(sheetData)
    }
    
    if (result.success) {
      setShowModal(false)
      setEditingVenue(null)
      setFormData(getDefaultVenueEntry())
    } else {
      alert(`Error ${editingVenue ? 'updating' : 'adding'} venue: ${result.error}`)
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
          <p className="mt-4 text-secondary-600">Loading venues...</p>
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
            Venues
          </h1>
          <p className="mt-2 text-secondary-600">
            Manage venue information, contacts, and event details
          </p>
        </div>

        {/* Venues Table */}
        <VenueTable
          onAddVenue={handleAddVenue}
          onEditVenue={handleEditVenue}
          onDeleteVenue={handleDeleteVenue}
        />

        {/* Add/Edit Venue Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">
                  {editingVenue ? 'Edit Venue' : 'Add New Venue'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-secondary-400 hover:text-secondary-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Venue Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      value={formData.promo}
                      onChange={(e) => handleInputChange('promo', e.target.value)}
                      className={cn(
                        'input',
                        formErrors.promo && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                      )}
                      placeholder="Enter venue name"
                    />
                    {formErrors.promo && (
                      <p className="mt-1 text-sm text-danger-600">{formErrors.promo}</p>
                    )}
                  </div>

                  {/* Promo to Send */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Promo to Send
                    </label>
                    <input
                      type="text"
                      value={formData.promoSend}
                      onChange={(e) => handleInputChange('promoSend', e.target.value)}
                      className="input"
                      placeholder="Enter promo information"
                    />
                  </div>

                  {/* Address/City */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Address/City *
                    </label>
                    <input
                      type="text"
                      value={formData.addressCity}
                      onChange={(e) => handleInputChange('addressCity', e.target.value)}
                      className={cn(
                        'input',
                        formErrors.addressCity && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                      )}
                      placeholder="Enter address and city"
                    />
                    {formErrors.addressCity && (
                      <p className="mt-1 text-sm text-danger-600">{formErrors.addressCity}</p>
                    )}
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Contact *
                    </label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) => handleInputChange('contact', e.target.value)}
                      className={cn(
                        'input',
                        formErrors.contact && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                      )}
                      placeholder="Contact person name"
                    />
                    {formErrors.contact && (
                      <p className="mt-1 text-sm text-danger-600">{formErrors.contact}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="input"
                      placeholder="Phone number"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={cn(
                        'input',
                        formErrors.email && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                      )}
                      placeholder="Email address"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-danger-600">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Times */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Times
                    </label>
                    <input
                      type="text"
                      value={formData.times}
                      onChange={(e) => handleInputChange('times', e.target.value)}
                      className="input"
                      placeholder="e.g., 9 AM - 5 PM"
                    />
                  </div>

                  {/* Show Info */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Show Info
                    </label>
                    <textarea
                      value={formData.showInfo}
                      onChange={(e) => handleInputChange('showInfo', e.target.value)}
                      className="input"
                      rows="3"
                      placeholder="Additional show information"
                    />
                  </div>

                  {/* Forecast Will */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Forecast Will
                    </label>
                    <input
                      type="text"
                      value={formData.forecastWill}
                      onChange={(e) => handleInputChange('forecastWill', e.target.value)}
                      className="input"
                      placeholder="Forecast information"
                    />
                  </div>
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
                    {editingVenue ? 'Update Venue' : 'Add Venue'}
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

export default Venues 