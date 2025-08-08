import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { DollarSign, Plus, Trash2, Save, X, TrendingUp, Calendar, Calculator } from 'lucide-react'
import supabaseAPI from '../services/supabaseAPI'

const CommissionTiersEditor = ({ storeId, storeName, onSave, onCancel }) => {
  const [bonusRates, setBonusRates] = useState([])
  const [newBonusRate, setNewBonusRate] = useState({
    salesTarget: '',
    bonusAmount: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [error, setError] = useState(null)
  const [keyCounter, setKeyCounter] = useState(0)

  console.log('🔍 CommissionTiersEditor render:', { storeId, storeName, bonusRates: bonusRates.length })

  // Load bonus rates from database
  useEffect(() => {
    const loadBonusRates = async () => {
      if (!storeId) {
        console.log('❌ No storeId provided')
        return
      }
      
      console.log('🔄 Loading bonus rates for store:', storeId)
      setLoadingData(true)
      setError(null)
      
      try {
        const result = await supabaseAPI.getCommissionTiers(storeId)
        console.log('📊 Database result:', result)
        
        if (result.success) {
          const convertedRates = (result.data || []).map(tier => ({
            id: tier.id,
            store_id: tier.store_id,
            sales_target: tier.sales_target,
            bonus_amount: tier.bonus_amount,
            description: tier.tier_name || `Bonus for $${tier.sales_target.toLocaleString()}+ sales`
          }))
          
          console.log('✅ Converted rates:', convertedRates)
          setBonusRates(convertedRates)
          setHasUnsavedChanges(false)
        } else {
          setError('Failed to load bonus rates')
          console.error('❌ Error loading bonus rates:', result.error)
        }
      } catch (error) {
        setError('Failed to load bonus rates')
        console.error('❌ Exception loading bonus rates:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadBonusRates()
  }, [storeId])

  const addBonusRate = useCallback(() => {
    console.log('➕ Adding bonus rate:', newBonusRate)
    
    if (!newBonusRate.salesTarget || parseFloat(newBonusRate.salesTarget) <= 0) {
      alert('Please enter a valid sales target')
      return
    }

    if (!newBonusRate.bonusAmount || parseFloat(newBonusRate.bonusAmount) <= 0) {
      alert('Please enter a valid bonus amount')
      return
    }

    const bonusRate = {
      id: `temp_${Date.now()}_${keyCounter}`,
      store_id: storeId,
      sales_target: parseFloat(newBonusRate.salesTarget),
      bonus_amount: parseFloat(newBonusRate.bonusAmount),
      description: newBonusRate.description.trim() || `Bonus for $${parseFloat(newBonusRate.salesTarget).toLocaleString()}+ sales`
    }

    console.log('🎯 New bonus rate object:', bonusRate)

    setBonusRates(prev => {
      const newRates = [...prev, bonusRate]
      console.log('📋 New bonusRates after adding:', newRates)
      return newRates
    })
    
    setNewBonusRate({ salesTarget: '', bonusAmount: '', description: '' })
    setHasUnsavedChanges(true)
    setError(null)
    setKeyCounter(prev => prev + 1)
    
    console.log('✅ Add operation completed')
  }, [newBonusRate, storeId, keyCounter])

  const removeBonusRate = useCallback((rateId) => {
    console.log('🗑️ Removing bonus rate with ID:', rateId)
    
    setBonusRates(prev => {
      const filteredRates = prev.filter(r => r.id !== rateId)
      console.log('📋 Filtered rates after removal:', filteredRates)
      return filteredRates
    })
    
    setHasUnsavedChanges(true)
    setError(null)
    
    console.log('✅ Remove operation completed')
  }, [])

  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges) {
      console.log('ℹ️ No changes to save')
      return
    }
    
    console.log('💾 Saving bonus rates:', bonusRates)
    setLoading(true)
    setError(null)
    
    try {
      // Convert to the format expected by the database
      const convertedTiers = bonusRates.map(rate => ({
        store_id: rate.store_id,
        tier_name: rate.description || `Bonus for $${rate.sales_target.toLocaleString()}+ sales`,
        sales_target: rate.sales_target,
        commission_rate: 0,
        bonus_amount: rate.bonus_amount
      }))
      
      console.log('🔄 Converted tiers for database:', convertedTiers)
      
      // Sort by sales target
      const sortedTiers = [...convertedTiers].sort((a, b) => a.sales_target - b.sales_target)
      console.log('📊 Sorted tiers:', sortedTiers)
      
      const result = await supabaseAPI.saveCommissionTiers(storeId, sortedTiers)
      console.log('💾 Save result:', result)
      
      if (result.success) {
        console.log('✅ Save successful, reloading data...')
        
        // Reload data to get real IDs
        const reloadResult = await supabaseAPI.getCommissionTiers(storeId)
        console.log('🔄 Reload result:', reloadResult)
        
        if (reloadResult.success) {
          const convertedRates = (reloadResult.data || []).map(tier => ({
            id: tier.id,
            store_id: tier.store_id,
            sales_target: tier.sales_target,
            bonus_amount: tier.bonus_amount,
            description: tier.tier_name || `Bonus for $${tier.sales_target.toLocaleString()}+ sales`
          }))
          
          console.log('✅ Final converted rates from database:', convertedRates)
          setBonusRates(convertedRates)
        }
        
        setHasUnsavedChanges(false)
        if (onSave) {
          await onSave(bonusRates)
        }
      } else {
        setError('Failed to save bonus rates')
        console.error('❌ Save failed:', result.error)
      }
    } catch (error) {
      setError('Failed to save bonus rates')
      console.error('❌ Exception during save:', error)
    } finally {
      setLoading(false)
    }
  }, [bonusRates, storeId, hasUnsavedChanges, onSave])

  const calculateBonus = useCallback((monthlySales) => {
    const applicableRate = bonusRates
      .sort((a, b) => b.sales_target - a.sales_target)
      .find(rate => monthlySales >= rate.sales_target)
    
    if (!applicableRate) return { bonus: 0, rate: null }
    
    return {
      bonus: applicableRate.bonus_amount,
      rate: applicableRate
    }
  }, [bonusRates])

  // Memoize the sorted bonus rates to prevent unnecessary re-renders
  const sortedBonusRates = useMemo(() => {
    return [...bonusRates].sort((a, b) => a.sales_target - b.sales_target)
  }, [bonusRates])

  console.log('🎨 Rendering with bonusRates:', bonusRates)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Monthly Sales Bonus Structure - {storeName}
          </h3>
          <p className="text-sm text-gray-600">
            Set up flat rate bonuses based on monthly store sales performance
          </p>
          {hasUnsavedChanges && (
            <p className="text-xs text-orange-600 mt-1">
              • You have unsaved changes
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-1">
              • {error}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            • Debug: {bonusRates.length} entries loaded
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !hasUnsavedChanges}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Add New Bonus Rate */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add New Monthly Sales Bonus
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Sales Target ($)
            </label>
            <input
              type="text"
              placeholder="50000"
              value={newBonusRate.salesTarget}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '')
                setNewBonusRate(prev => ({ ...prev, salesTarget: value }))
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus Amount ($)
            </label>
            <input
              type="text"
              placeholder="500"
              value={newBonusRate.bonusAmount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '')
                setNewBonusRate(prev => ({ ...prev, bonusAmount: value }))
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Bronze Level, Silver Level"
              value={newBonusRate.description}
              onChange={(e) => setNewBonusRate(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addBonusRate}
              className="w-full inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Bonus
            </button>
          </div>
        </div>
      </div>

      {/* Bonus Rates Table */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <DollarSign className="w-4 h-4 mr-2" />
          Monthly Sales Bonus Structure ({bonusRates.length})
        </h4>
        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading bonus structure...</p>
          </div>
        ) : bonusRates.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bonus structure set</p>
            <p className="text-sm text-gray-400 mt-1">Add monthly sales targets and bonus amounts above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Sales Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bonus Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Example (at $75,000 monthly sales)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedBonusRates.map((rate, index) => {
                  const example = calculateBonus(75000)
                  const isApplicable = example.rate?.id === rate.id
                  
                  return (
                    <tr key={`${rate.id}-${index}`} className={isApplicable ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{rate.description}</span>
                          <span className="ml-2 text-xs text-gray-500">(ID: {rate.id})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">${rate.sales_target.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-green-600 font-semibold">${rate.bonus_amount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isApplicable ? (
                          <div className="text-sm">
                            <div className="text-green-600 font-medium">
                              ${example.bonus.toLocaleString()} Bonus
                            </div>
                            <div className="text-gray-500">
                              Qualifies for this tier
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => removeBonusRate(rate.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bonus Calculator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Calculator className="w-4 h-4 mr-2" />
          Monthly Sales Bonus Calculator
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Store Sales ($)
            </label>
            <input
              type="text"
              placeholder="75000"
              defaultValue="75000"
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '')
                const amount = parseFloat(value) || 0
                const result = calculateBonus(amount)
                // You could display this result in a more sophisticated way
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Test different monthly sales amounts to see which bonus tier applies
            </div>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <DollarSign className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Flat Rate Bonus System
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>This system awards flat rate bonuses based on monthly store sales performance:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Staff receive bonuses when the store hits monthly sales targets</li>
                <li>Bonuses are flat amounts, not percentage-based</li>
                <li>Higher sales targets = higher bonus amounts</li>
                <li>Only the highest qualifying tier bonus is awarded</li>
                <li>Click "Save Changes" to persist your changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommissionTiersEditor 