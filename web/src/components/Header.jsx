import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Calendar, 
  MapPin, 
  Users, 
  MessageSquare, 
  CheckSquare,
  Menu,
  X,
  ChevronDown,
  User,
  Upload,
  TrendingUp
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { cn } from '../utils/cn'
import AuthStatus from './AuthStatus'

const Header = () => {
  const location = useLocation()
  const { currentSheet, setCurrentSheet, currentUser, setCurrentUser, staffData } = useApp()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Debug logging
  useEffect(() => {
    console.log('Header - currentUser:', currentUser)
    console.log('Header - staffData length:', staffData.length)
  }, [currentUser, staffData])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const handleSheetToggle = () => {
    const newSheet = currentSheet === 'TRAILER_HISTORY' ? 'CAMPER_HISTORY' : 'TRAILER_HISTORY'
    setCurrentSheet(newSheet)
  }

  const handleUserSelect = (userId) => {
    const selectedUser = staffData.find(user => user.id === parseInt(userId))
    console.log('Header - handleUserSelect called with userId:', userId, 'selectedUser:', selectedUser)
    setCurrentUser(selectedUser)
    setShowUserMenu(false)
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Daily Sales', href: '/daily-sales', icon: BarChart3 },
    { name: 'Venues', href: '/venues', icon: MapPin },
    { name: 'Staff', href: '/staff', icon: Users },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Sales Upload', href: '/admin/sales-upload', icon: Upload },
    { name: 'Sales Analysis', href: '/sales-analysis', icon: TrendingUp }
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-secondary-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">
              Scrub Shop Road App
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Sheet Toggle, User Selector, and Auth Status */}
          <div className="flex items-center space-x-4">
            <AuthStatus />
            
            {/* User Selector */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {currentUser ? currentUser.name : 'Select User'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Select your name
                  </div>
                  {staffData.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors',
                        currentUser?.id === user.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      )}
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={handleSheetToggle}
                className="flex items-center px-3 py-2 text-sm font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50 rounded-md transition-colors duration-200"
              >
                <span className="hidden sm:inline mr-2">
                  {currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between py-2 border-t border-secondary-200">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center px-2 py-1 text-xs font-medium rounded transition-colors duration-200',
                    isActive(item.href)
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-secondary-600 hover:text-secondary-900'
                  )}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 