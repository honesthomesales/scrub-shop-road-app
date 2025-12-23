import React, { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { Plus, Eye, EyeOff } from 'lucide-react'

export default function UserStaffLinker() {
  const [unlinkedUsers, setUnlinkedUsers] = useState([])
  const [staffMembers, setStaffMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user'
  })
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const { supabaseAPI } = useApp()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersResult, staffResult] = await Promise.all([
        supabaseAPI.getUnlinkedUsers(),
        supabaseAPI.readTable('staff')
      ])

      if (usersResult.success) {
        setUnlinkedUsers(usersResult.data)
      }

      if (staffResult.success) {
        setStaffMembers(staffResult.data)
      }
    } catch (error) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkUser = async (userId, staffId) => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await supabaseAPI.linkUserToStaff(userId, staffId)
      if (result.success) {
        setMessage('User successfully linked to staff member!')
        // Reload the data
        await loadData()
      } else {
        setError(result.error || 'Failed to link user')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAndLinkUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.name || !selectedStaffId) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await supabaseAPI.createUserForStaff(
        newUserData.email,
        newUserData.password,
        newUserData.name,
        newUserData.role,
        parseInt(selectedStaffId)
      )

      if (result.success) {
        setMessage('User account created and linked to staff member successfully!')
        setShowCreateForm(false)
        setShowPassword(false)
        setNewUserData({ email: '', password: '', name: '', role: 'user' })
        setSelectedStaffId('')
        await loadData()
      } else {
        setError(result.error || 'Failed to create user account')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading && unlinkedUsers.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          User Account Management
        </h3>
        <p className="text-sm text-gray-600">
          Create new user accounts or link existing users to staff members. Users can sign in with their email and password.
        </p>
      </div>

      {message && (
        <div className="rounded-md bg-green-50 p-4 mb-4">
          <div className="text-sm text-green-700">{message}</div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Create New User Section */}
      <div className="mb-6 pb-6 border-b">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Create New User Account</h4>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm)
              setError('')
              setMessage('')
            }}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            {showCreateForm ? 'Cancel' : 'Create New User'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Link to Staff Member *</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select staff member...</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.email})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateAndLinkUser}
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Creating...' : 'Create User Account'}
            </button>
          </div>
        )}
      </div>

      {/* Link Existing Users Section */}
      {unlinkedUsers.length === 0 ? (
        <p className="text-gray-500">All users are already linked to staff members.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Link unlinked users to existing staff members to give them access to the system.
          </p>
          
          <div className="space-y-3">
            {unlinkedUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name || user.email}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">Role: {user.role}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleLinkUser(user.id, parseInt(e.target.value))
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Select staff member...</option>
                      {staffMembers.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={loadData}
          disabled={loading}
          className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}
