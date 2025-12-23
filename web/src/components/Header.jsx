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
  TrendingUp,
  Car,
  Settings,
  Clock,
  FileText,
  DollarSign,
  Tag
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { cn } from '../utils/cn'
import AuthStatus from './AuthStatus'
import { getFilteredNavigation } from '../utils/permissions'
import ScrubShopLogo from './ScrubShopLogo'
import { APP_VERSION } from '../config/version'

const Header = () => {
  const location = useLocation()
  const { currentSheet, setCurrentSheet, currentUser, setCurrentUser, staffData, user } = useApp()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showRoadMenu, setShowRoadMenu] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showDashboardMenu, setShowDashboardMenu] = useState(false)
  const userMenuRef = useRef(null)
  const roadMenuRef = useRef(null)
  const adminMenuRef = useRef(null)
  const dashboardMenuRef = useRef(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (roadMenuRef.current && !roadMenuRef.current.contains(event.target)) {
        setShowRoadMenu(false)
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setShowAdminMenu(false)
      }
      if (dashboardMenuRef.current && !dashboardMenuRef.current.contains(event.target)) {
        setShowDashboardMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Auto-select current user based on logged-in user
  useEffect(() => {
    if (staffData.length > 0 && !currentUser && user && user.email) {
      const matchingStaff = staffData.find(staff => 
        staff.email && staff.email.toLowerCase() === user.email.toLowerCase()
      )
      if (matchingStaff) {
        setCurrentUser(matchingStaff)
      }
    }
  }, [staffData, currentUser, user])

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

    setCurrentUser(selectedUser)
    setShowUserMenu(false)
  }

  const allMainNavigation = [
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Scheduler', href: '/scheduler', icon: Clock },
  ]

  const dashboardSubMenu = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Truist', href: '/expense-reports', icon: FileText },
    { name: 'Profit', href: '/profit', icon: TrendingUp },
    { name: 'Manage Categories', href: '/expense-categories/manage', icon: Tag },
    { name: 'Categorize Expenses', href: '/expense-categories/categorize', icon: Tag },
    { name: 'Category KPI Dashboard', href: '/expense-categories/kpi', icon: BarChart3 },
  ]

  const allRoadNavigation = [
    { name: 'Daily Sales', href: '/daily-sales', icon: BarChart3 },
    { name: 'Expenses', href: '/expenses', icon: DollarSign },
    { name: 'Venues', href: '/venues', icon: MapPin },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Bonuses', href: '/bonuses', icon: TrendingUp },
    { name: 'Documents', href: '/documents', icon: FileText }
  ]

  const allAdminNavigation = [
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Staff', href: '/staff', icon: Users },
    { name: 'Sales Upload', href: '/admin/sales-upload', icon: Upload },
    { name: 'Expense Upload', href: '/admin/expense-upload', icon: DollarSign }
  ]

  // Filter navigation based on user role
  const mainNavigation = getFilteredNavigation(allMainNavigation, currentUser)
  const roadNavigation = getFilteredNavigation(allRoadNavigation, currentUser)
  const adminNavigation = getFilteredNavigation(allAdminNavigation, currentUser)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-secondary-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <ScrubShopLogo size="small" className="text-primary-600" />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Dashboard Dropdown Menu */}
            <div 
              className="relative" 
              ref={dashboardMenuRef}
              onMouseEnter={() => setShowDashboardMenu(true)}
              onMouseLeave={() => {
                setTimeout(() => {
                  if (!dashboardMenuRef.current?.matches(':hover')) {
                    setShowDashboardMenu(false)
                  }
                }, 300)
              }}
            >
              <button
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    (isActive('/dashboard') || isActive('/expense-reports') || isActive('/profit') || isActive('/expense-categories'))
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                )}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              {showDashboardMenu && (
                <div 
                  className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  onMouseEnter={() => setShowDashboardMenu(true)}
                  onMouseLeave={() => {
                    setTimeout(() => {
                      if (!dashboardMenuRef.current?.matches(':hover')) {
                        setShowDashboardMenu(false)
                      }
                    }, 200)
                  }}
                >
                  {dashboardSubMenu.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors',
                          isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                        )}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {mainNavigation.map((item) => {
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

            {/* ROAD Dropdown Menu */}
            {roadNavigation.length > 0 && (
              <div 
                className="relative" 
                ref={roadMenuRef}
                onMouseEnter={() => setShowRoadMenu(true)}
                onMouseLeave={() => {
                  // Add delay before closing to allow moving to submenu
                  setTimeout(() => {
                    if (!roadMenuRef.current?.matches(':hover')) {
                      setShowRoadMenu(false)
                    }
                  }, 300)
                }}
              >
                <button
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    (isActive('/daily-sales') || isActive('/expenses') || isActive('/venues') || isActive('/calendar') || isActive('/bonuses') || isActive('/documents'))
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                  )}
                >
                  <Car className="w-4 h-4 mr-2" />
                  ROAD
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                
                {showRoadMenu && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    onMouseEnter={() => setShowRoadMenu(true)}
                    onMouseLeave={() => {
                      setTimeout(() => {
                        if (!roadMenuRef.current?.matches(':hover')) {
                          setShowRoadMenu(false)
                        }
                      }, 200)
                    }}
                  >
                    {roadNavigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors',
                            isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                          )}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ADMIN Dropdown Menu */}
            {adminNavigation.length > 0 && (
              <div 
                className="relative" 
                ref={adminMenuRef}
                onMouseEnter={() => setShowAdminMenu(true)}
                onMouseLeave={() => {
                  // Add delay before closing to allow moving to submenu
                  setTimeout(() => {
                    if (!adminMenuRef.current?.matches(':hover')) {
                      setShowAdminMenu(false)
                    }
                  }, 300)
                }}
              >
                <button
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    (isActive('/staff') || isActive('/admin/sales-upload') || isActive('/admin/expense-upload'))
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                  )}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  ADMIN
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                
                {showAdminMenu && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    onMouseEnter={() => setShowAdminMenu(true)}
                    onMouseLeave={() => {
                      setTimeout(() => {
                        if (!adminMenuRef.current?.matches(':hover')) {
                          setShowAdminMenu(false)
                        }
                      }, 200)
                    }}
                  >
                    {adminNavigation.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors',
                            isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                          )}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Sheet Toggle, User Selector, and Auth Status */}
          <div className="flex items-center space-x-4">
            {/* Version Display */}
            <div className="hidden md:flex items-center px-2 py-1 bg-gray-50 rounded text-xs text-gray-500 border border-gray-200" title={`App Version ${APP_VERSION}`}>
              <span className="font-mono">v{APP_VERSION}</span>
            </div>
            
            <AuthStatus />
            
            {/* Current User Role Indicator */}
            {currentUser && (
              <div className="hidden sm:flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                <span className="font-medium">{currentUser.role || 'No Role'}</span>
              </div>
            )}
            
            {/* User Selector */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {currentUser ? `${currentUser.name} (${currentUser.role || 'No Role'})` : 'Select User'}
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
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.role || 'No Role'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          {/* Mobile Version Display */}
          <div className="flex items-center justify-center py-1 border-b border-secondary-200">
            <span className="text-xs text-gray-500 font-mono">v{APP_VERSION}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-secondary-200">
            {/* Mobile Dashboard Menu */}
            <div className="flex flex-col items-center px-2 py-1 text-xs font-medium rounded transition-colors duration-200 text-secondary-600">
              <BarChart3 className="w-4 h-4 mb-1" />
              Dashboard
            </div>

            {mainNavigation.map((item) => {
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
            
            {/* Mobile ROAD Menu */}
            {roadNavigation.length > 0 && (
              <div className="flex flex-col items-center px-2 py-1 text-xs font-medium rounded transition-colors duration-200 text-secondary-600">
                <Car className="w-4 h-4 mb-1" />
                ROAD
              </div>
            )}

            {/* Mobile ADMIN Menu */}
            {adminNavigation.length > 0 && (
              <div className="flex flex-col items-center px-2 py-1 text-xs font-medium rounded transition-colors duration-200 text-secondary-600">
                <Settings className="w-4 h-4 mb-1" />
                ADMIN
              </div>
            )}
          </div>
          
          {/* Mobile Dashboard Submenu */}
          {dashboardSubMenu.length > 0 && (
            <div className="md:hidden border-t border-secondary-200 py-2">
              <div className="flex items-center justify-between">
                {dashboardSubMenu.map((item) => {
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
          )}

          {/* Mobile ROAD Submenu */}
          {roadNavigation.length > 0 && (
            <div className="md:hidden border-t border-secondary-200 py-2">
              <div className="flex items-center justify-between">
                {roadNavigation.map((item) => {
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
          )}

          {/* Mobile ADMIN Submenu */}
          {adminNavigation.length > 0 && (
            <div className="md:hidden border-t border-secondary-200 py-2">
              <div className="flex items-center justify-between">
                {adminNavigation.map((item) => {
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
          )}
        </div>
      </div>
    </header>
  )
}

export default Header 