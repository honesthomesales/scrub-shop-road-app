import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Mail, Phone, Calendar, FileText, CheckCircle, XCircle, DollarSign, MapPin, Target } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { STAFF_ROLE_OPTIONS, STAFF_STATUS_OPTIONS, STAFF_PAY_TYPE_OPTIONS, getDefaultStaffEntry } from '../utils/sheetMappings'
import { formatDate } from '../utils/dateUtils'
import { cn } from '../utils/cn'
import supabaseAPI from '../services/supabaseAPI'
import StaffBonusTiers from '../components/StaffBonusTiers'

const Staff = () => {
  const { staffData, addStaffEntry, updateStaffEntry, deleteStaffEntry, loading, error } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [formData, setFormData] = useState(getDefaultStaffEntry())
  const [stores, setStores] = useState([])
  const [showBonusTiersModal, setShowBonusTiersModal] = useState(false)
  const [selectedStaffForBonus, setSelectedStaffForBonus] = useState(null)

  const handleAddNew = () => {
    setEditingStaff(null)
    setFormData(getDefaultStaffEntry())
    setShowModal(true)
  }

  const handleEdit = (staff) => {
    setEditingStaff(staff)
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      role: staff.role || 'Worker',
      status: staff.status || 'Active',
      hireDate: staff.hireDate || '',
      notes: staff.notes || '',
      store_id: staff.store_id || null,
      // Pay structure fields
      payType: staff.payType || 'hourly',
      hourlyRate: staff.hourlyRate || 0,
      salaryAmount: staff.salaryAmount || 0,
      preferredHoursPerWeek: staff.preferredHoursPerWeek || 0,
      maxHoursPerWeek: staff.maxHoursPerWeek || 0
    })
    setShowModal(true)
  }

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      const result = await deleteStaffEntry(staffId)
      if (!result.success) {
        alert(`Error deleting staff: ${result.error}`)
      }
    }
  }

  const handleBonusTiers = (staff) => {
    setSelectedStaffForBonus(staff)
    setShowBonusTiersModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email) {
      alert('Name and email are required')
      return
    }

    const result = editingStaff 
      ? await updateStaffEntry(editingStaff.id, formData)
      : await addStaffEntry(formData)

    if (result.success) {
      setShowModal(false)
      setFormData(getDefaultStaffEntry())
    } else {
      alert(`Error ${editingStaff ? 'updating' : 'adding'} staff: ${result.error}`)
    }
  }

  // Fetch stores for store assignment
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const result = await supabaseAPI.getStores()
        if (result.success) {
          setStores(result.data)
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
      }
    }
    fetchStores()
  }, [])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100'
      case 'Inactive': return 'text-gray-600 bg-gray-100'
      case 'On Leave': return 'text-yellow-600 bg-yellow-100'
      case 'Terminated': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Manager': return 'text-blue-600 bg-blue-100'
      case 'Worker': return 'text-green-600 bg-green-100'
      case 'Driver': return 'text-purple-600 bg-purple-100'
      case 'Sales': return 'text-orange-600 bg-orange-100'
      case 'Support': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <XCircle className="w-5 h-5" />
        <span>Error loading staff data: {error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Staff Management</h1>
          <p className="mt-2 text-secondary-600">
            Manage your staff members and their roles
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Total Staff</p>
                <p className="text-2xl font-bold text-secondary-900">{staffData.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Active</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {staffData.filter(s => s.status === 'Active').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Workers</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {staffData.filter(s => s.role === 'Worker').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Managers</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {staffData.filter(s => s.role === 'Manager').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Store</th>
                  <th>Hire Date</th>
                  <th>Pay Structure</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-secondary-500">
                      <p className="text-gray-500 text-center">
                        No staff members found. Add your first staff member to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  staffData.map((staff) => (
                    <tr key={staff.id}>
                      <td>
                        <div>
                          <div className="font-medium text-secondary-900">{staff.name}</div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {staff.email && (
                            <div className="flex items-center text-sm text-secondary-600">
                              <Mail className="w-3 h-3 mr-1" />
                              {staff.email}
                            </div>
                          )}
                          {staff.phone && (
                            <div className="flex items-center text-sm text-secondary-600">
                              <Phone className="w-3 h-3 mr-1" />
                              {staff.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getRoleColor(staff.role)
                        )}>
                          {staff.role}
                        </span>
                      </td>
                      <td>
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getStatusColor(staff.status)
                        )}>
                          {staff.status}
                        </span>
                      </td>
                      <td>
                        {staff.store_id ? (
                          <div className="flex items-center text-sm text-secondary-600">
                            <MapPin className="w-3 h-3 mr-1 text-blue-600" />
                            <span>{stores.find(s => s.id === staff.store_id)?.name || 'Unknown Store'}</span>
                          </div>
                        ) : (
                          <span className="text-secondary-400 text-sm">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {staff.hireDate ? (
                          <div className="flex items-center text-sm text-secondary-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(staff.hireDate)}
                          </div>
                        ) : (
                          <span className="text-secondary-400">Not set</span>
                        )}
                      </td>
                      <td>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-secondary-600">
                            <DollarSign className="w-3 h-3 mr-1" />
                            <span className="font-medium">
                              {staff.payType === 'hourly' ? 'Hourly' : 
                               staff.payType === 'salary' ? 'Salary' : 
                               staff.payType === 'salary+bonus' ? 'Salary+Bonus' : staff.payType}
                            </span>
                          </div>
                          {staff.payType === 'hourly' && staff.hourlyRate > 0 && (
                            <div className="text-xs text-secondary-500">
                              ${staff.hourlyRate}/hr
                            </div>
                          )}
                          {(staff.payType === 'salary' || staff.payType === 'salary+bonus') && staff.salaryAmount > 0 && (
                            <div className="text-xs text-secondary-500">
                              ${staff.salaryAmount.toLocaleString()}/year
                            </div>
                          )}
                          {staff.preferredHoursPerWeek > 0 && (
                            <div className="text-xs text-secondary-500">
                              {staff.preferredHoursPerWeek}h preferred
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {staff.notes ? (
                          <div className="flex items-center text-sm text-secondary-600">
                            <FileText className="w-3 h-3 mr-1" />
                            <span className="truncate max-w-32" title={staff.notes}>
                              {staff.notes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-secondary-400">No notes</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(staff)}
                            className="btn-icon btn-sm"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBonusTiers(staff)}
                            className="btn-icon btn-sm text-green-600 hover:text-green-700"
                            title="Manage Bonus Tiers"
                          >
                            <Target className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(staff.id)}
                            className="btn-icon btn-sm text-red-600 hover:text-red-700"
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-secondary-400 hover:text-secondary-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input"
                  placeholder="Enter email address"
                  required
                />
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
                  placeholder="Enter phone number"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="input"
                >
                  {STAFF_ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="input"
                >
                  {STAFF_STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Hire Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Hire Date
                </label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  className="input"
                />
              </div>

              {/* Pay Structure Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-secondary-700 mb-3">Pay Structure</h4>
                
                {/* Pay Type */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Pay Type
                  </label>
                  <select
                    value={formData.payType}
                    onChange={(e) => handleInputChange('payType', e.target.value)}
                    className="input"
                  >
                    {STAFF_PAY_TYPE_OPTIONS.map(payType => (
                      <option key={payType} value={payType}>
                        {payType === 'hourly' ? 'Hourly' : 
                         payType === 'salary' ? 'Salary' : 
                         payType === 'salary+bonus' ? 'Salary + Bonus' : payType}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hourly Rate */}
                {formData.payType === 'hourly' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Salary Amount */}
                {(formData.payType === 'salary' || formData.payType === 'salary+bonus') && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Salary Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salaryAmount}
                      onChange={(e) => handleInputChange('salaryAmount', parseFloat(e.target.value) || 0)}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Preferred Hours Per Week */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Preferred Hours Per Week
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.preferredHoursPerWeek}
                    onChange={(e) => handleInputChange('preferredHoursPerWeek', parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="40"
                  />
                </div>

                {/* Max Hours Per Week */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Max Hours Per Week
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.maxHoursPerWeek}
                    onChange={(e) => handleInputChange('maxHoursPerWeek', parseFloat(e.target.value) || 0)}
                    className="input"
                    placeholder="40"
                  />
                </div>
              </div>

              {/* Store Assignment */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Assigned Store
                </label>
                <select
                  value={formData.store_id || ''}
                  onChange={(e) => handleInputChange('store_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="input"
                >
                  <option value="">No Store Assigned</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} (#{store.number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Additional notes about this staff member"
                />
              </div>
              
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
                  {editingStaff ? 'Update' : 'Add'} Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bonus Tiers Modal */}
      {showBonusTiersModal && selectedStaffForBonus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">
                Bonus Tiers Management - {selectedStaffForBonus.name}
              </h3>
              <button
                onClick={() => setShowBonusTiersModal(false)}
                className="text-secondary-400 hover:text-secondary-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <StaffBonusTiers
              staffId={selectedStaffForBonus.id}
              staffName={selectedStaffForBonus.name}
              onSave={() => {
                setShowBonusTiersModal(false)
                // Optionally refresh staff data or show success message
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Staff 