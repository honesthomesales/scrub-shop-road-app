import React from 'react'
import { Mail, Phone, Circle } from 'lucide-react'
import { cn } from '../utils/cn'

const TeamMemberCard = ({ user, onSelect }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'worker':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-500'
      case 'busy':
        return 'text-orange-500'
      case 'away':
        return 'text-yellow-500'
      case 'offline':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect && onSelect(user)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.name}
            </h3>
            <div className="flex items-center space-x-2">
              <Circle 
                className={cn(
                  'w-3 h-3',
                  getStatusColor(user.availability_status || 'offline')
                )} 
              />
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                getRoleColor(user.role)
              )}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>

          {user.last_seen && (
            <div className="mt-2 text-xs text-gray-500">
              Last seen {new Date(user.last_seen).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamMemberCard 