import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Mail, Shield, X, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import supabaseAPI from '../services/supabaseAPI'

const UserManagement = () => {
  const { user } = useApp()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'user',
    is_active: true
  })
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers()
    }
  }, [user])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await supabaseAPI.getUsers()
      if (result.success) {
        setUsers(result.data || [])
      } else {
        setError(result.error || 'Failed to load users')
        setUsers([])
      }
    } catch (err) {
      setError('Failed to load users: ' + err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      name: '',
      role: 'user',
      is_active: true
    })
    setPassword('')
    setShowPassword(false)
    setShowModal(true)
  }

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit)
    setFormData({
      email: userToEdit.email || '',
      name: userToEdit.name || '',
      role: userToEdit.role || 'user',
      is_active: userToEdit.is_active !== false
    })
    setPassword('')
    setShowPassword(false)
    setShowModal(true)
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will prevent them from logging in.')) {
      return
    }

    try {
      const result = await supabaseAPI.deleteUser(userId)
      if (result.success) {
        await loadUsers()
      } else {
        alert(`Error deleting user: ${result.error}`)
      }
    } catch (err) {
      alert(`Error deleting user: ${err.message}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.name) {
      alert('Email and name are required')
      return
    }

    // If creating new user, password is required
    if (!editingUser && !password) {
      alert('Password is required when creating a new user')
      return
    }

    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          name: formData.name,
          role: formData.role,
          is_active: formData.is_active
        }
        
        // Only update password if provided
        if (password) {
          // Note: Password updates need to go through Supabase Auth API
          // For now, we'll just update the profile
          alert('Password changes must be done through the user\'s account settings or by resetting their password.')
        }

        const result = await supabaseAPI.updateUser(editingUser.id, updateData)
        if (result.success) {
          setShowModal(false)
          await loadUsers()
        } else {
          alert(`Error updating user: ${result.error}`)
        }
      } else {
        // Create new user - this requires creating auth account first
        alert('To create a new user, please use the "Add Staff Member" page and check "Create Login Account", or use the "Manage User Accounts" button on the Staff page.')
        setShowModal(false)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="alert alert-error">
        <Shield className="w-5 h-5" />
        <span>Access denied. Admin privileges required.</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
          <p className="mt-2 text-secondary-600">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn-primary"
          title="Note: New users should be created through the Staff page"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <X className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {error ? 'Error loading users' : 'No users found'}
                </td>
              </tr>
            ) : (
              users.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{userItem.name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{userItem.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(userItem.role)}`}>
                      {userItem.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      userItem.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {userItem.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(userItem)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(userItem.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
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

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Add User'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={!editingUser}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (user can log in)
                </label>
              </div>

              {!editingUser && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> To create a new user account, please use the "Add Staff Member" page and check "Create Login Account", or use the "Manage User Accounts" button on the Staff page. This form is for editing existing users only.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement

