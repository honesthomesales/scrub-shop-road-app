import React, { useState, useEffect } from 'react'
import { Users, Circle } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import TeamMemberCard from '../components/TeamMemberCard'

const Team = () => {
  const { 
    loading, 
    usersData, 
    tasksData,
    loadTeamData 
  } = useApp()

  const [selectedUser, setSelectedUser] = useState(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadTeamData()
  }, [loadTeamData])

  const getStatusCount = (status) => {
    return usersData.filter(user => user.availability_status === status).length
  }

  const getRoleCount = (role) => {
    return usersData.filter(user => user.role === role).length
  }

  const getTasksForUser = (userId) => {
    return tasksData.filter(task => task.assigned_to === userId)
  }

  const filteredUsers = usersData.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.availability_status === statusFilter
    return matchesRole && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading team...</p>
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
            Team Overview
          </h1>
          <p className="mt-2 text-secondary-600">
            View team members, their status, and manage team communication
          </p>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{usersData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Circle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-2xl font-bold text-gray-900">{getStatusCount('online')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-gray-900">{getRoleCount('manager')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Workers</p>
                <p className="text-2xl font-bold text-gray-900">{getRoleCount('worker')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filters:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="worker">Worker</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="busy">Busy</option>
              <option value="away">Away</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No team members found.</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <TeamMemberCard
                key={user.id}
                user={user}
                onSelect={setSelectedUser}
              />
            ))
          )}
        </div>

        {/* Selected User Details */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedUser.name}
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Role:</span>
                    <p className="text-gray-900 capitalize">{selectedUser.role}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <p className="text-gray-900 capitalize">{selectedUser.availability_status || 'offline'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned Tasks:</span>
                    <p className="text-gray-900">{getTasksForUser(selectedUser.id).length}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Team 