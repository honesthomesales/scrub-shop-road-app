// Role-based access control utilities

// Define user roles - normalized to handle both auth.users and staff roles
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'Manager',
  WORKER: 'Worker',
  DRIVER: 'Driver',
  SALES: 'Sales',
  SUPPORT: 'Support'
}

// Normalize role to handle case differences and variations
const normalizeRole = (role) => {
  if (!role) return null
  const roleLower = role.toLowerCase()
  
  // Map variations to standard roles
  if (roleLower === 'admin' || roleLower === 'administrator') {
    return ROLES.ADMIN
  }
  if (roleLower === 'manager') {
    return ROLES.MANAGER
  }
  if (roleLower === 'worker' || roleLower === 'driver' || roleLower === 'sales' || roleLower === 'support') {
    // Worker, Driver, Sales, Support all get Worker-level access
    return ROLES.WORKER
  }
  
  // Return original if no match (for backwards compatibility)
  return role
}

// Define page permissions
export const PAGE_PERMISSIONS = {
  // Main navigation
  '/dashboard': [ROLES.MANAGER, ROLES.WORKER],
  '/tasks': [ROLES.MANAGER, ROLES.WORKER],
  '/messages': [ROLES.MANAGER, ROLES.WORKER],
  '/sales-analysis': [ROLES.MANAGER],
  '/scheduler': [ROLES.MANAGER, ROLES.WORKER],
  
  // ROAD navigation
  '/daily-sales': [ROLES.MANAGER],
  '/expenses': [ROLES.MANAGER],
  '/expense-reports': [ROLES.MANAGER],
  '/venues': [ROLES.MANAGER, ROLES.WORKER],
  '/calendar': [ROLES.MANAGER, ROLES.WORKER],
  '/bonuses': [ROLES.MANAGER],
  '/documents': [ROLES.MANAGER, ROLES.WORKER],
  
  // ADMIN navigation
  '/staff': [ROLES.MANAGER],
  '/admin/users': [ROLES.MANAGER],
  '/admin/sales-upload': [ROLES.MANAGER],
  '/admin/expense-upload': [ROLES.MANAGER],
  
  // Expense categories (Manager only)
  '/expense-categories/manage': [ROLES.MANAGER],
  '/expense-categories/categorize': [ROLES.MANAGER],
  '/expense-categories/kpi': [ROLES.MANAGER],
  
  // Other pages
  '/profit': [ROLES.MANAGER]
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
  
  // Normalize user's role
  const userRole = normalizeRole(user.role)
  
  // Admin has full access to everything
  if (userRole === ROLES.ADMIN) {
    return true
  }
  
  // Get allowed roles for the page
  const allowedRoles = PAGE_PERMISSIONS[pagePath]
  
  // If page is not in permissions list, deny access (unless admin)
  if (!allowedRoles) {
    return false
  }
  
  // Check if user's normalized role is in the allowed roles
  // Also check original role for backwards compatibility
  return allowedRoles.includes(userRole) || allowedRoles.includes(user.role)
}

// Get navigation items filtered by user role
export const getFilteredNavigation = (navigationItems, user) => {
  if (!user) {
    return []
  }
  
  return navigationItems.filter(item => hasPageAccess(user, item.href))
}

// Check if user is an admin
export const isAdmin = (user) => {
  if (!user || !user.role) return false
  const normalized = normalizeRole(user.role)
  return normalized === ROLES.ADMIN
}

// Check if user is a manager
export const isManager = (user) => {
  if (!user || !user.role) return false
  const normalized = normalizeRole(user.role)
  return normalized === ROLES.MANAGER || normalized === ROLES.ADMIN
}

// Check if user is a worker (or any worker-level role)
export const isWorker = (user) => {
  if (!user || !user.role) return false
  const normalized = normalizeRole(user.role)
  return normalized === ROLES.WORKER || normalized === ROLES.MANAGER || normalized === ROLES.ADMIN
} 