import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Venues from './pages/Venues'
import Staff from './pages/Staff'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import DailySales from './pages/DailySales'
import Messages from './pages/Messages'
import PayCalculator from './pages/PayCalculator'
import SalesAnalysis from './pages/SalesAnalysis'
import SalesUpload from './pages/SalesUpload'
import Scheduler from './pages/Scheduler'
import Bonuses from './pages/Bonuses'
import HolidayManager from './pages/HolidayManager'

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/daily-sales" element={<DailySales />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/pay-calculator" element={<PayCalculator />} />
              <Route path="/sales-analysis" element={<SalesAnalysis />} />
              <Route path="/sales-upload" element={<SalesUpload />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/bonuses" element={<Bonuses />} />
              <Route path="/holiday-manager" element={<HolidayManager />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  )
}

export default App 