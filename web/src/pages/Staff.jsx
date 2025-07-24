import React, { useState } from 'react'
import { Plus, Edit, Trash2, Users, Mail, Phone, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { STAFF_ROLE_OPTIONS, STAFF_STATUS_OPTIONS, getDefaultStaffEntry } from '../utils/sheetMappings'
import { formatDate } from '../utils/dateUtils'
import { cn } from '../utils/cn'

const Staff = () => {
  const { staffData, addStaffEntry, updateStaffEntry, deleteStaffEntry, loading, error } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [formData, setFormData] = useState(getDefaultStaffEntry())

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
      notes: staff.notes || ''
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
                  <th>Hire Date</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-secondary-500">
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
    </div>
  )
}

export default Staff 