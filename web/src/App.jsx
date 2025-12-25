import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import PWARegistration from './components/PWARegistration'
import PWADiagnostics from './components/PWADiagnostics'
import { ErrorBoundaryWrapper } from './components/ErrorBoundaryWrapper'
import Dashboard from './pages/Dashboard'
import Venues from './pages/Venues'
import Staff from './pages/Staff'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import DailySales from './pages/DailySales'
import Messages from './pages/Messages'
import PayCalculator from './pages/PayCalculator'
import SalesUpload from './pages/SalesUpload'
import ExpenseUpload from './pages/ExpenseUpload'
import ExpensesDashboard from './pages/ExpensesDashboard'
import ExpenseReports from './pages/ExpenseReports'
import Profit from './pages/Profit'
import Scheduler from './pages/Scheduler'
import Bonuses from './pages/Bonuses'
import HolidayManager from './pages/HolidayManager'
import Documents from './pages/Documents'
import CategoryManagement from './pages/CategoryManagement'
import ExpenseCategorization from './pages/ExpenseCategorization'
import ExpenseCategoryKPI from './pages/ExpenseCategoryKPI'
import UserManagement from './pages/UserManagement'

function App() {
  return (
    <ErrorBoundaryWrapper>
      <AppProvider>
        <Router basename="/scrub-shop-road-app">
          <div className="min-h-screen bg-gray-50">
            <ProtectedRoute>
              <ErrorBoundaryWrapper>
                <Header />
                <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
                  <ErrorBoundaryWrapper>
                    <Routes>
                      <Route path="/" element={<Navigate to="/daily-sales" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/daily-sales" element={<DailySales />} />
                      <Route path="/venues" element={<Venues />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/bonuses" element={<Bonuses />} />
                      <Route path="/expenses" element={<ExpensesDashboard />} />
                      <Route path="/expense-reports" element={<ExpenseReports />} />
                      <Route path="/profit" element={<Profit />} />
                      <Route path="/staff" element={<Staff />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/scheduler" element={<Scheduler />} />
                      <Route path="/admin/sales-upload" element={<SalesUpload />} />
                      <Route path="/admin/expense-upload" element={<ExpenseUpload />} />
                      <Route path="/pay-calculator" element={<PayCalculator />} />
                      <Route path="/holiday-manager" element={<HolidayManager />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/expense-categories/manage" element={<CategoryManagement />} />
                      <Route path="/expense-categories/categorize" element={<ExpenseCategorization />} />
                      <Route path="/expense-categories/kpi" element={<ExpenseCategoryKPI />} />
                      <Route path="/admin/users" element={<UserManagement />} />
                    </Routes>
                  </ErrorBoundaryWrapper>
                </main>
                <PWARegistration />
                <PWADiagnostics />
              </ErrorBoundaryWrapper>
            </ProtectedRoute>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundaryWrapper>
  )
}

export default App 