import React, { useState, useEffect } from 'react'
import { Plus, Filter, User, AlertCircle, Grid, List } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import TaskCard from '../components/TaskCard'
import TaskList from '../components/TaskList'
import TaskForm from '../components/TaskForm'
import { isManager } from '../utils/permissions'

const Tasks = () => {
  const { 
    loading, 
    tasksData, 
    staffData, 
    currentUser,
    loadTasks, 
    addTask, 
    updateTask, 
    deleteTask,
    setCurrentUser 
  } = useApp()

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [viewMode, setViewMode] = useState('card') // 'card' or 'list'

  useEffect(() => {
    // Set default current user (first staff member) if none selected
    if (staffData.length > 0 && !currentUser) {
      setCurrentUser(staffData[0])
    }

    // Load tasks
    loadTasks()
  }, [staffData, currentUser, setCurrentUser, loadTasks])

  const handleCreateTask = async (taskData) => {
    if (!currentUser) return

    const newTaskData = {
      ...taskData,
      assigned_by: currentUser.id,
      assigned_to: taskData.assigned_to === '' ? null : taskData.assigned_to
    }

    const result = await addTask(newTaskData)
    if (result.success) {
      setShowTaskForm(false)
    }
  }

  const handleUpdateTask = async (taskData) => {
    // Convert empty string to null for assigned_to
    const processedTaskData = {
      ...taskData,
      assigned_to: taskData.assigned_to === '' ? null : taskData.assigned_to
    }
    
    const result = await updateTask(editingTask.id, processedTaskData)
    if (result.success) {
      setShowTaskForm(false)
      setEditingTask(null)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId)
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleViewComments = (taskId) => {
    // TODO: Implement task comments view

  }

  // Filter tasks based on user role and current filters
  const getFilteredTasks = () => {
    let accessibleTasks = tasksData

    // Role-based filtering
    if (!isManager(currentUser)) {
      // Workers only see tasks assigned to them
      accessibleTasks = tasksData.filter(task => task.assigned_to === currentUser?.id)
    }
    // Managers see all tasks

    // Apply status and priority filters
    return accessibleTasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      return matchesStatus && matchesPriority
    })
  }

  const filteredTasks = getFilteredTasks()

  // Separate tasks into lists
  const unassignedTasks = filteredTasks.filter(task => !task.assigned_to)
  const assignedTasks = filteredTasks.filter(task => task.assigned_to)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">
                Task Management
              </h1>
              <p className="mt-2 text-secondary-600">
                Create, assign, and track tasks for your staff
              </p>
            </div>
            <button
              onClick={() => setShowTaskForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </button>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'card' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Card view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tasks Lists */}
        <div className="space-y-8">
          {/* Unassigned Tasks */}
          {isManager(currentUser) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Unassigned Tasks</h2>
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                    {unassignedTasks.length}
                  </span>
                </div>
              </div>
              <div className="p-6">
                {unassignedTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No unassigned tasks</p>
                  </div>
                ) : viewMode === 'card' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unassignedTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        staffData={staffData}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onViewComments={handleViewComments}
                      />
                    ))}
                  </div>
                ) : (
                  <TaskList
                    tasks={unassignedTasks}
                    staffData={staffData}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onViewComments={handleViewComments}
                  />
                )}
              </div>
            </div>
          )}

          {/* Assigned Tasks */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isManager(currentUser) ? 'All Assigned Tasks' : 'My Tasks'}
                </h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {assignedTasks.length}
                </span>
              </div>
            </div>
            <div className="p-6">
              {assignedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {isManager(currentUser) ? 'No assigned tasks found' : 'No tasks assigned to you'}
                  </p>
                </div>
              ) : viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      staffData={staffData}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onViewComments={handleViewComments}
                    />
                  ))}
                </div>
              ) : (
                <TaskList
                  tasks={assignedTasks}
                  staffData={staffData}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onViewComments={handleViewComments}
                />
              )}
            </div>
          </div>

          {/* No Tasks Message */}
          {filteredTasks.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-gray-500">
                {isManager(currentUser) 
                  ? 'No tasks found. Create your first task!' 
                  : 'No tasks assigned to you. Contact your manager for new assignments.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Task Form Modal */}
        {showTaskForm && (
          <TaskForm
            task={editingTask}
            users={staffData}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={() => {
              setShowTaskForm(false)
              setEditingTask(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Tasks 