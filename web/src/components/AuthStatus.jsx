import React from 'react'
import { useApp } from '../contexts/AppContext'

export default function AuthStatus() {
  const { user, signOut } = useApp()

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="text-sm text-gray-700">
        <span className="font-medium">{user.name || user.email}</span>
        {user.role && (
          <span className="ml-2 text-gray-500">({user.role})</span>
        )}
      </div>
      <button
        onClick={signOut}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Sign out
      </button>
    </div>
  )
} 