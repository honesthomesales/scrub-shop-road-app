import React, { useState, useEffect } from 'react'
import { X, Users, X as XIcon } from 'lucide-react'

const TaskForm = ({ task = null, users = [], onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: [], // Changed to array for multiple assignees
    priority: 'normal',
    status: 'pending',
    due_date: '',
    category: 'general'
  })

  const [selectedAssignees, setSelectedAssignees] = useState([])

  useEffect(() => {
    if (task) {
      // Handle both single assignee (string/number) and multiple assignees (array)
      let assignedTo = []
      if (task.assigned_to) {
        if (Array.isArray(task.assigned_to)) {
          assignedTo = task.assigned_to
        } else {
          assignedTo = [task.assigned_to]
        }
      }

      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigned_to: assignedTo,
        priority: task.priority || 'normal',
        status: task.status || 'pending',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        category: task.category || 'general'
      })
      setSelectedAssignees(assignedTo)
    }
  }, [task])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAssigneeChange = (e) => {
    const userId = parseInt(e.target.value)
    if (userId && !selectedAssignees.includes(userId)) {
      const newAssignees = [...selectedAssignees, userId]
      setSelectedAssignees(newAssignees)
      setFormData(prev => ({
        ...prev,
        assigned_to: newAssignees
      }))
    }
  }

  const removeAssignee = (userId) => {
    const newAssignees = selectedAssignees.filter(id => id !== userId)
    setSelectedAssignees(newAssignees)
    setFormData(prev => ({
      ...prev,
      assigned_to: newAssignees
    }))
  }

  const getSelectedUserNames = () => {
    return selectedAssignees.map(userId => {
      const user = users.find(u => u.id === userId)
      return user ? user.name : 'Unknown User'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            
            {/* Selected Assignees Display */}
            {selectedAssignees.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-2">
                  {getSelectedUserNames().map((name, index) => (
                    <div
                      key={selectedAssignees[index]}
                      className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => removeAssignee(selectedAssignees[index])}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignee Selector */}
            <div className="flex items-center space-x-2">
              <select
                value=""
                onChange={handleAssigneeChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Add assignee...</option>
                {users
                  .filter(user => !selectedAssignees.includes(user.id))
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))
                }
              </select>
              <div className="text-gray-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            
            {selectedAssignees.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Leave empty for unassigned task
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="general">General</option>
              <option value="sales">Sales</option>
              <option value="venue">Venue</option>
              <option value="admin">Admin</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm 