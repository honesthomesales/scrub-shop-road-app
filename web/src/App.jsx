import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Venues from './pages/Venues'
import Staff from './pages/Staff'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import DailySales from './pages/DailySales'
import Messages from './pages/Messages'
import PayCalculator from './pages/PayCalculator'
import SalesUpload from './pages/SalesUpload'
import Scheduler from './pages/Scheduler'
import Bonuses from './pages/Bonuses'
import HolidayManager from './pages/HolidayManager'

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <ProtectedRoute>
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Navigate to="/daily-sales" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/daily-sales" element={<DailySales />} />
                <Route path="/venues" element={<Venues />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/bonuses" element={<Bonuses />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/scheduler" element={<Scheduler />} />
                <Route path="/admin/sales-upload" element={<SalesUpload />} />
                <Route path="/pay-calculator" element={<PayCalculator />} />
                <Route path="/holiday-manager" element={<HolidayManager />} />
              </Routes>
            </main>
          </ProtectedRoute>
        </div>
      </Router>
    </AppProvider>
  )
}

export default App 