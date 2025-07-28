import React from 'react'
import { Calendar, User, Flag, Edit, Trash2, Clock, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../utils/cn'

const TaskCard = ({ task, staffData = [], onEdit, onDelete, onViewComments }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const getAssignedUsers = (assignedTo) => {
    if (!assignedTo) return []
    
    // Handle both single assignee (string/number) and multiple assignees (array)
    let assigneeIds = []
    if (Array.isArray(assignedTo)) {
      assigneeIds = assignedTo
    } else {
      assigneeIds = [assignedTo]
    }
    
    return assigneeIds.map(id => {
      const user = staffData.find(user => user.id === id)
      return user ? user.name : 'Unknown User'
    })
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <Flag className="w-3 h-3 text-red-600" />
      case 'high':
        return <Flag className="w-3 h-3 text-orange-600" />
      case 'normal':
        return <Flag className="w-3 h-3 text-blue-600" />
      case 'low':
        return <Flag className="w-3 h-3 text-gray-600" />
      default:
        return <Flag className="w-3 h-3 text-gray-600" />
    }
  }

  const assignedUsers = getAssignedUsers(task.assigned_to)
  const isUnassigned = assignedUsers.length === 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header: Assignee - Title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {isUnassigned ? (
              <>
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-500">Unassigned</span>
              </>
            ) : assignedUsers.length === 1 ? (
              <>
                <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {assignedUsers[0]}
                </span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {assignedUsers.length} assignees
                </span>
              </>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {task.title}
          </h3>
        </div>
        <div className="flex items-center space-x-2 ml-3">
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full border',
            getPriorityColor(task.priority)
          )}>
            {task.priority}
          </span>
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            getStatusColor(task.status)
          )}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {task.description}
        </p>
      )}

      {/* Multiple Assignees Display */}
      {assignedUsers.length > 1 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {assignedUsers.map((name, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Priority, Time til due, Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            {getPriorityIcon(task.priority)}
            <span className="capitalize">{task.priority}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(task.due_date)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Edit task"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard 