import React, { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'

export default function UserStaffLinker() {
  const [unlinkedUsers, setUnlinkedUsers] = useState([])
  const [staffMembers, setStaffMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
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

  if (loading && unlinkedUsers.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Link Users to Staff Members
      </h3>

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
