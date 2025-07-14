import React from 'react'
import { useApp } from '../contexts/AppContext'

const AuthStatus = () => {
  const { isAuthenticated, setIsAuthenticated } = useApp()

  const handleLogout = () => {
    // Clear stored tokens (if any)
    setIsAuthenticated(false)
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Connected to Supabase</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm text-gray-600">Not connected to Supabase</span>
      </div>
      <button
        onClick={() => setIsAuthenticated(true)}
        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Connect
      </button>
    </div>
  )
}

export default AuthStatus 