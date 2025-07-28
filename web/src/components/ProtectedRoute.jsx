import React from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { hasPageAccess } from '../utils/permissions'

const ProtectedRoute = ({ children, path }) => {
  const { currentUser } = useApp()

  // Check if user has access to this page
  if (!hasPageAccess(currentUser, path)) {
    // Redirect to dashboard if no access
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute 