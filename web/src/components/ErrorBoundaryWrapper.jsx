import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

const ErrorFallback = ({ error, errorInfo, onReset }) => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    onReset()
    navigate('/')
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-6 md:p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-6">
            We're sorry, but something unexpected happened. Don't worry, your data is safe.
          </p>

          {/* Error Details (only in development) */}
          {(import.meta.env.DEV || import.meta.env.MODE === 'development') && error && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-sm font-semibold text-gray-900 mb-2">Error Details:</p>
              <p className="text-xs text-gray-700 font-mono break-all">
                {error.toString()}
              </p>
              {errorInfo && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onReset}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors min-h-[44px] font-medium"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] font-medium"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </button>
            <button
              onClick={handleReload}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] font-medium sm:hidden"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Reload Page
            </button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-sm text-gray-500">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}

// Export the ErrorBoundary component
export function ErrorBoundaryWrapper({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

export default ErrorBoundaryWrapper

