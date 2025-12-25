import React from 'react'

const LoadingSpinner = ({ message = 'Loading...', size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const spinner = (
    <div className="text-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 mx-auto ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-4 text-secondary-600">{message}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner

