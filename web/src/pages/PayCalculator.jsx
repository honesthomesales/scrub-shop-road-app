import React, { useState, useEffect } from 'react'
import { Calculator, DollarSign, Users, MapPin, Calendar, TrendingUp } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import supabaseAPI from '../services/supabaseAPI'

const PayCalculator = () => {
  const { staffData } = useApp()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState(null)
  const [payrollData, setPayrollData] = useState({})
  const [commissionTiers, setCommissionTiers] = useState({})

  // Fetch stores and their data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storesResult = await supabaseAPI.getStores()
        if (storesResult.success) {
          setStores(storesResult.data)
          
          // Fetch commission tiers for each store
          const tiersData = {}
          for (const store of storesResult.data) {
            const tiersResult = await supabaseAPI.getCommissionTiers(store.id)
            if (tiersResult.success) {
              tiersData[store.id] = tiersResult.data || []
            }
          }
          setCommissionTiers(tiersData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const calculatePayroll = (storeId, staffId, hours, sales) => {
    const staff = staffData.find(s => s.id === staffId)
    const store = stores.find(s => s.id === storeId)
    const tiers = commissionTiers[storeId] || []
    
    if (!staff || !store) return { basePay: 0, bonus: 0, total: 0 }

    // Calculate base pay (assuming hourly rate)
    const hourlyRate = 15 // This would come from staff data
    const basePay = hours * hourlyRate

    // Calculate bonus based on sales tiers
    let bonus = 0
    for (const tier of tiers) {
      if (sales >= tier.sales_target) {
        bonus = tier.bonus_amount
        break
      }
    }

    return {
      basePay,
      bonus,
      total: basePay + bonus,
      staffName: staff.name,
      storeName: store.name
    }
  }

  const handleSavePayroll = async (storeId, payrollData) => {
    try {
      // This would save payroll data to a payroll table
      console.log('Saving payroll data for store:', storeId, payrollData)
      alert('Payroll data saved successfully!')
    } catch (error) {
      alert(`Error saving payroll: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pay Calculator</h1>
          <p className="mt-2 text-gray-600">Loading stores and staff data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded mr-4"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center">
          <Calculator className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pay Calculator</h1>
            <p className="mt-2 text-gray-600">
              Calculate payroll for all stores and staff members
            </p>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {stores.map((store) => {
          const storeStaff = staffData.filter(staff => staff.store_id === store.id)
          
          return (
            <div key={store.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Store Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{store.name}</h3>
                      <p className="text-gray-600">Store #{store.number}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    {storeStaff.length} staff
                  </div>
                </div>
              </div>

              {/* Staff Payroll Section */}
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Staff Payroll
                </h4>
                
                {storeStaff.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No staff assigned to this store</p>
                ) : (
                  <div className="space-y-4">
                    {storeStaff.map((staff) => {
                      const payroll = calculatePayroll(store.id, staff.id, 40, 50000) // Example values
                      
                      return (
                        <div key={staff.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900">{staff.name}</h5>
                              <p className="text-sm text-gray-600">{staff.role || 'Staff Member'}</p>
                            </div>
                            <button
                              onClick={() => setSelectedStore(store.id === selectedStore ? null : store.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              {selectedStore === store.id ? 'Hide Details' : 'Show Details'}
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Base Pay</p>
                              <p className="font-medium">${payroll.basePay.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Bonus</p>
                              <p className="font-medium text-green-600">${payroll.bonus.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Total</p>
                              <p className="font-medium text-blue-600">${payroll.total.toFixed(2)}</p>
                            </div>
                          </div>

                          {selectedStore === store.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hours Worked
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="40"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sales Amount
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="50000"
                                    min="0"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleSavePayroll(store.id, { staffId: staff.id, payroll })}
                                className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Save Payroll
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Section */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-green-900">Payroll Summary</h3>
            <p className="text-green-700">
              Calculate and manage payroll for all stores and staff members. 
              Each store shows its assigned staff with individual pay calculations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PayCalculator 