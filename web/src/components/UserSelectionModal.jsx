import React, { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'

const UserSelectionModal = () => {
  const { staffData, currentUser, setCurrentUser, loading } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    // Only show modal if:
    // 1. Not currently loading
    // 2. Staff data is loaded
    // 3. No current user is selected
    // 4. Staff data has actual users (not empty)
    if (!loading && staffData.length > 0 && !currentUser) {
      setShowModal(true)
    }
  }, [staffData, currentUser, loading])

  const handleUserSelect = () => {
    if (selectedUserId) {
      const selectedUser = staffData.find(user => user.id === parseInt(selectedUserId))
      if (selectedUser) {
        setCurrentUser(selectedUser)
        setShowModal(false)
      }
    }
  }

  const handleSkip = () => {
    // Allow user to skip selection for now, but they'll need to select later for messaging
    setShowModal(false)
  }

  // Don't show modal if still loading or if staff data is empty
  if (loading || staffData.length === 0 || showModal === false) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Scrub Shop Road App
          </h2>
          <p className="text-gray-600 mb-6">
            Please select your name to get started. This will help personalize your experience.
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who are you?
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select your name</option>
              {staffData.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleUserSelect}
              disabled={!selectedUserId}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSelectionModal 