import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Tag, RefreshCw } from 'lucide-react'
import supabaseAPI from '../services/supabaseAPI'

const CategoryManagement = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    description: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await supabaseAPI.readTable('categories', {
        orderBy: { column: 'name', ascending: true }
      })
      
      if (result.success) {
        setCategories(result.data || [])
      } else {
        setError('Failed to load categories: ' + result.error)
      }
    } catch (err) {
      setError('Error loading categories: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const parseKeywords = (keywordsString) => {
    if (!keywordsString) return []
    // Split by comma and clean up
    return keywordsString
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
  }

  const formatKeywords = (keywordsArray) => {
    if (!keywordsArray || !Array.isArray(keywordsArray)) return ''
    return keywordsArray.join(', ')
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      const keywordsArray = parseKeywords(formData.keywords)
      
      const result = await supabaseAPI.addRow('categories', {
        name: formData.name.trim(),
        keywords: keywordsArray,
        description: formData.description.trim() || null
      })

      if (result.success) {
        setSuccess('Category added successfully')
        setFormData({ name: '', keywords: '', description: '' })
        setShowAddForm(false)
        loadCategories()
      } else {
        setError('Failed to add category: ' + result.error)
      }
    } catch (err) {
      setError('Error adding category: ' + err.message)
    }
  }

  const handleEdit = (category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      keywords: formatKeywords(category.keywords),
      description: category.description || ''
    })
    setShowAddForm(false)
  }

  const handleUpdate = async (id) => {
    setError(null)
    setSuccess(null)

    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      const keywordsArray = parseKeywords(formData.keywords)
      
      const result = await supabaseAPI.updateRow('categories', id, {
        name: formData.name.trim(),
        keywords: keywordsArray,
        description: formData.description.trim() || null
      })

      if (result.success) {
        setSuccess('Category updated successfully')
        setEditingId(null)
        setFormData({ name: '', keywords: '', description: '' })
        loadCategories()
      } else {
        setError('Failed to update category: ' + result.error)
      }
    } catch (err) {
      setError('Error updating category: ' + err.message)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the category "${name}"? This will not remove the category from existing expenses, but new expenses won't be auto-categorized with this category.`)) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const result = await supabaseAPI.deleteRow('categories', id)

      if (result.success) {
        setSuccess('Category deleted successfully')
        loadCategories()
      } else {
        setError('Failed to delete category: ' + result.error)
      }
    } catch (err) {
      setError('Error deleting category: ' + err.message)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({ name: '', keywords: '', description: '' })
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
            <p className="mt-2 text-gray-600">Manage expense categories and their keywords for auto-categorization</p>
          </div>
          <button
            onClick={loadCategories}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Refresh categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Add Category Button */}
        {!showAddForm && !editingId && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleAdd}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Office Supplies, Travel, Utilities"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <textarea
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y min-h-[2.5rem]"
                    placeholder="e.g., office, supplies, paper, pens"
                    rows={2}
                    style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter keywords separated by commas. Expenses with descriptions containing these keywords will be auto-categorized.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Brief description of this category"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingId ? 'Update' : 'Add'} Category</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Categories Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keywords
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <Tag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No categories found. Add your first category to get started.</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {category.keywords && category.keywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {category.keywords.map((keyword, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No keywords</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {category.description || <span className="text-gray-400">No description</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded"
                            title="Edit category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.name)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryManagement

