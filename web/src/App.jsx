import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import Header from './components/Header'
import UserSelectionModal from './components/UserSelectionModal'
import Dashboard from './pages/Dashboard'
import DailySales from './pages/DailySales'
import Venues from './pages/Venues'
import Staff from './pages/Staff'
import Calendar from './pages/Calendar'
import Tasks from './pages/Tasks'
import Messages from './pages/Messages'
import SalesUpload from './pages/SalesUpload'

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/daily-sales" element={<DailySales />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/admin/sales-upload" element={<SalesUpload />} />
            </Routes>
          </main>
          <UserSelectionModal />
        </div>
      </Router>
    </AppProvider>
  )
}

export default App 