import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Trash2, DollarSign, Target, Save, Calculator } from 'lucide-react'
import supabaseAPI from '../services/supabaseAPI'

const StaffBonusTiers = ({ staffId, staffName, onSave }) => {
  const [bonusTiers, setBonusTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [keyCounter, setKeyCounter] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load bonus tiers for this staff member
  useEffect(() => {
    if (!staffId) {
      console.log('❌ No staffId provided')
      return
    }

    console.log('🔄 Loading bonus tiers for staff:', staffId)
    const loadBonusTiers = async () => {
      try {
        const result = await supabaseAPI.getStaffBonusTiers(staffId)
        console.log('📊 Load result:', result)

        if (result.success) {
          const convertedTiers = (result.data || []).map(tier => ({
            id: tier.id,
            staff_id: tier.staff_id,
            sales_target: tier.sales_target,
            bonus_amount: tier.bonus_amount,
            description: tier.description || tier.tier_name || `Bonus for $${tier.sales_target.toLocaleString()}+ sales`,
            is_active: tier.is_active
          }))
          console.log('✅ Converted tiers:', convertedTiers)
          setBonusTiers(convertedTiers)
        } else {
          console.error('❌ Load failed:', result.error)
          setError('Failed to load bonus tiers')
        }
      } catch (error) {
        console.error('❌ Exception during load:', error)
        setError('Failed to load bonus tiers')
      } finally {
        setLoading(false)
      }
    }

    loadBonusTiers()
  }, [staffId])

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(bonusTiers.some(tier => tier.id.toString().startsWith('temp_')))
  }, [bonusTiers])

  const addBonusTier = useCallback(() => {
    const newTier = {
      id: `temp_${Date.now()}_${keyCounter}`,
      staff_id: staffId,
      sales_target: 0,
      bonus_amount: 0,
      description: '',
      is_active: true
    }
    setBonusTiers(prev => [...prev, newTier])
    setKeyCounter(prev => prev + 1)
  }, [staffId, keyCounter])

  const removeBonusTier = useCallback((tierId) => {
    setBonusTiers(prev => prev.filter(tier => tier.id !== tierId))
  }, [])

  const updateBonusTier = useCallback((tierId, field, value) => {
    setBonusTiers(prev => prev.map(tier => 
      tier.id === tierId ? { ...tier, [field]: value } : tier
    ))
  }, [])

  const handleSave = useCallback(async () => {
    if (!hasUnsavedChanges) {
      console.log('ℹ️ No changes to save')
      return
    }

    console.log('💾 Saving bonus tiers:', bonusTiers)
    setSaving(true)
    setError(null)

    try {
      // Convert to the format expected by the database
      const convertedTiers = bonusTiers.map(tier => ({
        staff_id: tier.staff_id,
        tier_name: tier.description || `Bonus for $${tier.sales_target.toLocaleString()}+ sales`,
        sales_target: tier.sales_target,
        bonus_amount: tier.bonus_amount,
        description: tier.description,
        is_active: tier.is_active
      }))

      console.log('🔄 Converted tiers for database:', convertedTiers)

      // Sort by sales target
      const sortedTiers = [...convertedTiers].sort((a, b) => a.sales_target - b.sales_target)
      console.log('📊 Sorted tiers:', sortedTiers)

      const result = await supabaseAPI.saveStaffBonusTiers(staffId, sortedTiers)
      console.log('💾 Save result:', result)

      if (result.success) {
        console.log('✅ Save successful, reloading data...')

        // Reload data to get real IDs
        const reloadResult = await supabaseAPI.getStaffBonusTiers(staffId)
        console.log('🔄 Reload result:', reloadResult)

        if (reloadResult.success) {
          const convertedTiers = (reloadResult.data || []).map(tier => ({
            id: tier.id,
            staff_id: tier.staff_id,
            sales_target: tier.sales_target,
            bonus_amount: tier.bonus_amount,
            description: tier.description || tier.tier_name || `Bonus for $${tier.sales_target.toLocaleString()}+ sales`,
            is_active: tier.is_active
          }))

          console.log('✅ Final converted tiers from database:', convertedTiers)
          setBonusTiers(convertedTiers)
        }

        setHasUnsavedChanges(false)
        if (onSave) {
          await onSave(bonusTiers)
        }
      } else {
        setError('Failed to save bonus tiers')
        console.error('❌ Save failed:', result.error)
      }
    } catch (error) {
      setError('Failed to save bonus tiers')
      console.error('❌ Exception during save:', error)
    } finally {
      setSaving(false)
    }
  }, [bonusTiers, staffId, hasUnsavedChanges, onSave])

  const calculateBonus = useCallback((salesAmount) => {
    if (!bonusTiers || bonusTiers.length === 0) return 0

    // Sort by sales target descending to find the highest applicable tier
    const sortedTiers = [...bonusTiers]
      .filter(tier => tier.is_active)
      .sort((a, b) => b.sales_target - a.sales_target)

    for (const tier of sortedTiers) {
      if (salesAmount >= tier.sales_target) {
        return tier.bonus_amount
      }
    }
    return 0
  }, [bonusTiers])

  const sortedBonusTiers = useMemo(() => {
    return [...bonusTiers].sort((a, b) => a.sales_target - b.sales_target)
  }, [bonusTiers])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Personal Bonus Structure - {staffName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Set individual bonus tiers for this staff member
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-1 rounded">
              {error}
            </div>
          )}
          <button
            onClick={addBonusTier}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Tier
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              saving || !hasUnsavedChanges
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bonus Tiers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedBonusTiers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No bonus tiers set for this staff member</p>
                    <p className="text-sm">Click "Add Tier" to create the first bonus structure</p>
                  </td>
                </tr>
              ) : (
                sortedBonusTiers.map((tier, index) => (
                  <tr key={`${tier.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 text-blue-600 mr-2" />
                        <input
                          type="number"
                          value={tier.sales_target}
                          onChange={(e) => updateBonusTier(tier.id, 'sales_target', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0"
                          step="0.01"
                          min="0"
                        />
                        <span className="ml-1 text-sm text-gray-500">+</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                        <input
                          type="number"
                          value={tier.bonus_amount}
                          onChange={(e) => updateBonusTier(tier.id, 'bonus_amount', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={tier.description}
                        onChange={(e) => updateBonusTier(tier.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="e.g., High performer bonus"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={tier.is_active ? 'active' : 'inactive'}
                        onChange={(e) => updateBonusTier(tier.id, 'is_active', e.target.value === 'active')}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => removeBonusTier(tier.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Remove tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus Calculator */}
      {sortedBonusTiers.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            Bonus Calculator
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Sales Amount
              </label>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="number"
                  id="sales-calculator"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter sales amount"
                  step="0.01"
                  min="0"
                  onChange={(e) => {
                    const salesAmount = parseFloat(e.target.value) || 0
                    const bonus = calculateBonus(salesAmount)
                    document.getElementById('bonus-result').textContent = `$${bonus.toFixed(2)}`
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calculated Bonus
              </label>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                <span id="bonus-result" className="text-2xl font-bold text-green-600">
                  $0.00
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffBonusTiers 