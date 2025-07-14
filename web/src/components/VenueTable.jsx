import React, { useState, useEffect } from 'react'
import { Edit, Trash2, Plus, Search, MapPin } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { cn } from '../utils/cn'

const VenueTable = ({ onAddVenue, onEditVenue, onDeleteVenue }) => {
  const { venuesData } = useApp()
  const [filteredVenues, setFilteredVenues] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // Get unique cities for filter
  const cities = [...new Set(venuesData.map(venue => venue.addressCity).filter(Boolean))]

  // Filter venues based on search and city
  useEffect(() => {
    let filtered = venuesData

    if (searchTerm) {
      filtered = filtered.filter(venue =>
        venue.promo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.addressCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.contact.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCity) {
      filtered = filtered.filter(venue => venue.addressCity === selectedCity)
    }

    setFilteredVenues(filtered)
  }, [venuesData, searchTerm, selectedCity])

  const handleDelete = async (venueId) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      await onDeleteVenue(venueId)
    }
  }

  const handleViewDetails = (venue) => {
    setSelectedVenue(venue)
    setShowDetails(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCity('')
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchTerm || selectedCity) && (
            <button
              onClick={clearFilters}
              className="text-secondary-600 hover:text-secondary-900 text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>

        <button
          onClick={onAddVenue}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Venue
        </button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-secondary-600">
        Showing {filteredVenues.length} of {venuesData.length} venues
      </div>

      {/* Venues Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Venue Name</th>
                  <th className="table-header-cell">City</th>
                  <th className="table-header-cell">Contact</th>
                  <th className="table-header-cell">Phone</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Times</th>
                  <th className="table-header-cell sticky right-0 bg-white z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredVenues.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-cell text-center text-secondary-500 py-8">
                      {searchTerm || selectedCity ? 'No venues match your search criteria' : 'No venues found'}
                    </td>
                  </tr>
                ) : (
                  filteredVenues.map((venue) => (
                    <tr key={venue.id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-secondary-900">{venue.promo}</div>
                          {venue.promoSend && (
                            <div className="text-xs text-secondary-500">
                              Promo: {venue.promoSend}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-secondary-400" />
                          {venue.addressCity}
                        </div>
                      </td>
                      <td className="table-cell">{venue.contact}</td>
                      <td className="table-cell">{venue.phone}</td>
                      <td className="table-cell">
                        <a 
                          href={`mailto:${venue.email}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {venue.email}
                        </a>
                      </td>
                      <td className="table-cell">{venue.times}</td>
                      <td className="table-cell sticky right-0 bg-white z-10">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(venue)}
                            className="text-primary-600 hover:text-primary-900 font-semibold text-xs px-2 py-1 rounded border border-primary-200 bg-primary-50 hover:bg-primary-100 transition"
                            title="Show Details"
                          >
                            Show Details
                          </button>
                          <button
                            onClick={() => onEditVenue(venue)}
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(venue.id)}
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

      {/* Venue Details Modal */}
      {showDetails && selectedVenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Venue Details
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary-600">Venue Name</label>
                <p className="text-secondary-900 font-medium">{selectedVenue.promo}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Promo to Send</label>
                <p className="text-secondary-900">{selectedVenue.promoSend || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Address/City</label>
                <p className="text-secondary-900">{selectedVenue.addressCity}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Contact</label>
                <p className="text-secondary-900">{selectedVenue.contact}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Phone</label>
                <p className="text-secondary-900">{selectedVenue.phone}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Email</label>
                <p className="text-secondary-900">
                  <a 
                    href={`mailto:${selectedVenue.email}`}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    {selectedVenue.email}
                  </a>
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Times</label>
                <p className="text-secondary-900">{selectedVenue.times || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Show Info</label>
                <p className="text-secondary-900">{selectedVenue.showInfo || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-600">Forecast Will</label>
                <p className="text-secondary-900">{selectedVenue.forecastWill || 'N/A'}</p>
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
                  onEditVenue(selectedVenue)
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

export default VenueTable 