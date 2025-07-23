import React from 'react'
import { Calendar, User, Flag, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../utils/cn'

const TaskCard = ({ task, onEdit, onDelete, onViewComments }) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {task.title}
        </h3>
        <div className="flex items-center space-x-2">
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

      {task.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(task.due_date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>{task.assigned_to_user?.name || 'Unassigned'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <MessageSquare className="w-4 h-4" />
          <span>{task.comment_count || 0}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewComments(task.id)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Comments
          </button>
          <button
            onClick={() => onEdit(task)}
            className="text-sm text-gray-600 hover:text-gray-700"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard 