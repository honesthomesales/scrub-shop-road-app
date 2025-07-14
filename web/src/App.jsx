import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './contexts/AppContext'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import DailySales from './pages/DailySales'
import Calendar from './pages/Calendar'
import Venues from './pages/Venues'
import Staff from './pages/Staff'
import AuthCallback from './components/AuthCallback'

function AppContent() {
  const { error, clearError } = useApp()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 right-4 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center justify-between">
            <p className="text-sm">{error}</p>
            <button
              onClick={clearError}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/daily-sales" element={<DailySales />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  )
}

export default App 