import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import Header from './components/Header'
import UserSelectionModal from './components/UserSelectionModal'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import DailySales from './pages/DailySales'
import Venues from './pages/Venues'
import Staff from './pages/Staff'
import Calendar from './pages/Calendar'
import Tasks from './pages/Tasks'
import Messages from './pages/Messages'
import SalesUpload from './pages/SalesUpload'
import SalesAnalysis from './pages/SalesAnalysis'

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <ProtectedRoute path="/dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/daily-sales" element={
                <ProtectedRoute path="/daily-sales">
                  <DailySales />
                </ProtectedRoute>
              } />
              <Route path="/venues" element={
                <ProtectedRoute path="/venues">
                  <Venues />
                </ProtectedRoute>
              } />
              <Route path="/staff" element={
                <ProtectedRoute path="/staff">
                  <Staff />
                </ProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ProtectedRoute path="/calendar">
                  <Calendar />
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute path="/tasks">
                  <Tasks />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute path="/messages">
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="/admin/sales-upload" element={
                <ProtectedRoute path="/admin/sales-upload">
                  <SalesUpload />
                </ProtectedRoute>
              } />
              <Route path="/sales-analysis" element={
                <ProtectedRoute path="/sales-analysis">
                  <SalesAnalysis />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <UserSelectionModal />
        </div>
      </Router>
    </AppProvider>
  )
}

export default App 