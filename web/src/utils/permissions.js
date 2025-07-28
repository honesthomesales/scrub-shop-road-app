// Role-based access control utilities

// Define user roles
export const ROLES = {
  MANAGER: 'Manager',
  WORKER: 'Worker'
}

// Define page permissions
export const PAGE_PERMISSIONS = {
  // Main navigation
  '/dashboard': [ROLES.MANAGER, ROLES.WORKER],
  '/tasks': [ROLES.MANAGER, ROLES.WORKER],
  '/messages': [ROLES.MANAGER, ROLES.WORKER],
  '/sales-analysis': [ROLES.MANAGER],
  
  // ROAD navigation
  '/daily-sales': [ROLES.MANAGER],
  '/venues': [ROLES.MANAGER, ROLES.WORKER],
  '/calendar': [ROLES.MANAGER, ROLES.WORKER],
  
  // ADMIN navigation
  '/staff': [ROLES.MANAGER],
  '/admin/sales-upload': [ROLES.MANAGER]
}

// Check if user has access to a specific page
export const hasPageAccess = (user, pagePath) => {
  // If no user is selected, deny access
  if (!user) {
    return false
  }
  
  // If no role is set, deny access
  if (!user.role) {
    return false
  }
  
  // Get allowed roles for the page
  const allowedRoles = PAGE_PERMISSIONS[pagePath]
  
  // If page is not in permissions list, deny access
  if (!allowedRoles) {
    return false
  }
  
  // Check if user's role is in the allowed roles
  return allowedRoles.includes(user.role)
}

// Get navigation items filtered by user role
export const getFilteredNavigation = (navigationItems, user) => {
  if (!user) {
    return []
  }
  
  return navigationItems.filter(item => hasPageAccess(user, item.href))
}

// Check if user is a manager
export const isManager = (user) => {
  return user && user.role === ROLES.MANAGER
}

// Check if user is a worker
export const isWorker = (user) => {
  return user && user.role === ROLES.WORKER
} 