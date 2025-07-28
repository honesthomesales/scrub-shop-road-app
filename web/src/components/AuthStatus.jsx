import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'

const AuthStatus = () => {
  const { isAuthenticated, toggleSupabaseConnection, loading } = useApp()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleToggleConnection = async () => {
    setIsConnecting(true)
    try {
      if (isAuthenticated) {
        // Disconnect from Supabase
        await toggleSupabaseConnection(false)
      } else {
        // Connect to Supabase
        await toggleSupabaseConnection(true)
      }
    } catch (error) {
      // Connection toggle error handled silently
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="flex items-center">
      <button
        onClick={handleToggleConnection}
        disabled={isConnecting || loading}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title={isAuthenticated ? "Click to disconnect from Supabase" : "Click to connect to Supabase"}
      >
        <div 
          className={`w-3 h-3 rounded-full transition-colors duration-200 ${
            isConnecting 
              ? 'bg-yellow-500 animate-pulse' 
              : isAuthenticated 
                ? 'bg-green-500' 
                : 'bg-red-500'
          }`}
        />
      </button>
    </div>
  )
}

export default AuthStatus 