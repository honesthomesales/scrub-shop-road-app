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
  ChevronRight,
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
  const [showRoadMenu, setShowRoadMenu] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showDashboardMenu, setShowDashboardMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileDashboardOpen, setMobileDashboardOpen] = useState(false)
  const [mobileRoadOpen, setMobileRoadOpen] = useState(false)
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false)
  const roadMenuRef = useRef(null)
  const adminMenuRef = useRef(null)
  const dashboardMenuRef = useRef(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roadMenuRef.current && !roadMenuRef.current.contains(event.target)) {
        setShowRoadMenu(false)
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setShowAdminMenu(false)
      }
      if (dashboardMenuRef.current && !dashboardMenuRef.current.contains(event.target)) {
        setShowDashboardMenu(false)
      }
      // Close mobile menu when clicking outside (but not on the hamburger button)
      if (mobileMenuOpen && !event.target.closest('.mobile-menu-container') && !event.target.closest('button[aria-label="Toggle mobile menu"]')) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

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

          {/* Auth Status and Version */}
          <div className="flex items-center space-x-4">
            <AuthStatus />
            
            {/* Mobile Menu Button - Hamburger */}
            <button
              type="button"
              className="md:hidden p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            
            {/* Version Display - Far Right */}
            <div className="flex items-center px-3 py-1.5 bg-blue-50 rounded-md text-xs font-semibold text-blue-700 border border-blue-200 shadow-sm" title={`App Version ${APP_VERSION}`}>
              <span className="font-mono">v{APP_VERSION}</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Hamburger Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-secondary-200 bg-white mobile-menu-container">
            <div className="px-2 pt-2 pb-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Dashboard Section */}
              <div>
                <button
                  onClick={() => setMobileDashboardOpen(!mobileDashboardOpen)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-3 text-base font-medium rounded-md transition-colors min-h-[44px]',
                    (isActive('/dashboard') || isActive('/expense-reports') || isActive('/profit') || isActive('/expense-categories'))
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-3" />
                    Dashboard
                  </div>
                  <ChevronRight className={cn(
                    'h-5 w-5 transition-transform',
                    mobileDashboardOpen && 'transform rotate-90'
                  )} />
                </button>
                {mobileDashboardOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {dashboardSubMenu.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => {
                            setMobileMenuOpen(false)
                            setMobileDashboardOpen(false)
                          }}
                          className={cn(
                            'flex items-center px-3 py-3 text-sm rounded-md transition-colors min-h-[44px]',
                            isActive(item.href)
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          )}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Main Navigation Items */}
              {mainNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors min-h-[44px]',
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}

              {/* ROAD Section */}
              {roadNavigation.length > 0 && (
                <div>
                  <button
                    onClick={() => setMobileRoadOpen(!mobileRoadOpen)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-3 text-base font-medium rounded-md transition-colors min-h-[44px]',
                      (isActive('/daily-sales') || isActive('/expenses') || isActive('/venues') || isActive('/calendar') || isActive('/bonuses') || isActive('/documents'))
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center">
                      <Car className="h-5 w-5 mr-3" />
                      ROAD
                    </div>
                    <ChevronRight className={cn(
                      'h-5 w-5 transition-transform',
                      mobileRoadOpen && 'transform rotate-90'
                    )} />
                  </button>
                  {mobileRoadOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {roadNavigation.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => {
                              setMobileMenuOpen(false)
                              setMobileRoadOpen(false)
                            }}
                            className={cn(
                              'flex items-center px-3 py-3 text-sm rounded-md transition-colors min-h-[44px]',
                              isActive(item.href)
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            )}
                          >
                            <Icon className="h-5 w-5 mr-3" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN Section */}
              {adminNavigation.length > 0 && (
                <div>
                  <button
                    onClick={() => setMobileAdminOpen(!mobileAdminOpen)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-3 text-base font-medium rounded-md transition-colors min-h-[44px]',
                      (isActive('/staff') || isActive('/admin/sales-upload') || isActive('/admin/expense-upload') || isActive('/admin/users'))
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 mr-3" />
                      ADMIN
                    </div>
                    <ChevronRight className={cn(
                      'h-5 w-5 transition-transform',
                      mobileAdminOpen && 'transform rotate-90'
                    )} />
                  </button>
                  {mobileAdminOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {adminNavigation.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => {
                              setMobileMenuOpen(false)
                              setMobileAdminOpen(false)
                            }}
                            className={cn(
                              'flex items-center px-3 py-3 text-sm rounded-md transition-colors min-h-[44px]',
                              isActive(item.href)
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            )}
                          >
                            <Icon className="h-5 w-5 mr-3" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Version Display - More Prominent */}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-md text-center border border-blue-200">
                  <span className="font-mono">v{APP_VERSION}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 