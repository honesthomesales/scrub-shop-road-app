import React from 'react'
import { useApp } from '../contexts/AppContext'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useApp()
  const [showRegister, setShowRegister] = React.useState(false)

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // If not authenticated, show login/register form
  if (!user) {
    return showRegister ? (
      <RegisterForm
        onSuccess={() => setShowRegister(false)}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <LoginForm
        onSuccess={() => {}} // Will be handled by context
        onSwitchToRegister={() => setShowRegister(true)}
      />
    )
  }

  // If authenticated, show the protected content
  return children
} 