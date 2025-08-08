import React, { useState, useEffect } from 'react'
import { Calculator, DollarSign, TrendingUp, Users, Clock, Save, X } from 'lucide-react'

const PayCalculator = ({ 
  storeId, 
  storeName, 
  staffData, 
  schedules, 
  commissionTiers, 
  salesData, 
  onSave, 
  onCancel 
}) => {
  const [payroll, setPayroll] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)

  // Calculate payroll for the selected period
  const calculatePayroll = () => {
    const payrollData = staffData.map(staff => {
      const staffSchedules = schedules.filter(s => 
        s.staff_id === staff.id && 
        s.date >= selectedPeriod.startDate && 
        s.date <= selectedPeriod.endDate
      )

      const totalHours = calculateTotalHours(staffSchedules)
      const basePay = calculateBasePay(staff, totalHours)
      const commission = calculateCommission(staff, totalHours)
      const totalPay = basePay + commission

      return {
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        totalHours,
        basePay,
        commission,
        totalPay,
        schedules: staffSchedules
      }
    })

    setPayroll(payrollData)
  }

  // Calculate total hours worked
  const calculateTotalHours = (schedules) => {
    return schedules.reduce((total, schedule) => {
      const startTime = new Date(`2000-01-01T${schedule.start_time}`)
      const endTime = new Date(`2000-01-01T${schedule.end_time}`)
      const hours = (endTime - startTime) / (1000 * 60 * 60)
      return total + hours
    }, 0)
  }

  // Calculate base pay
  const calculateBasePay = (staff, hours) => {
    if (staff.payType === 'hourly') {
      return hours * (staff.hourlyRate || 0)
    } else if (staff.payType === 'salary' || staff.payType === 'salary+bonus') {
      // Salary is yearly, calculate portion for this period
      const yearlySalary = staff.salaryAmount || 0
      
      // Calculate the number of days in the selected period
      const startDate = new Date(selectedPeriod.startDate)
      const endDate = new Date(selectedPeriod.endDate)
      const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      
      // Calculate daily rate (yearly salary / 365 days)
      const dailyRate = yearlySalary / 365
      
      // Calculate base pay for this period
      return dailyRate * daysInPeriod
    }
    return 0
  }

  // Calculate commission based on flat rate bonus system
  const calculateCommission = (staff, hours) => {
    // Get sales data for the period
    const periodSales = getSalesForPeriod(selectedPeriod.startDate, selectedPeriod.endDate)
    
    // Calculate bonus based on flat rate bonus system
    const applicableTier = commissionTiers
      .sort((a, b) => b.sales_target - a.sales_target)
      .find(tier => periodSales >= tier.sales_target)

    if (!applicableTier) return 0

    // Return flat rate bonus amount
    return applicableTier.bonus_amount
  }

  // Get sales data for a period (mock data for now)
  const getSalesForPeriod = (startDate, endDate) => {
    // This would normally query the sales data
    // For now, return a mock value
    return 15000 // Mock sales amount
  }

  // Handle save
  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(payroll)
    } catch (error) {
      console.error('Error saving payroll:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    return payroll.reduce((totals, pay) => ({
      totalHours: totals.totalHours + pay.totalHours,
      totalBasePay: totals.totalBasePay + pay.basePay,
      totalCommission: totals.totalCommission + pay.commission,
      totalPay: totals.totalPay + pay.totalPay
    }), {
      totalHours: 0,
      totalBasePay: 0,
      totalCommission: 0,
      totalPay: 0
    })
  }

  const totals = calculateTotals()

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pay Calculator - {storeName}
          </h3>
          <p className="text-sm text-gray-600">
            Calculate pay based on hours worked and sales performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="btn-outline btn-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || payroll.length === 0}
            className="btn-primary btn-sm"
          >
            <Save className="w-4 h-4 mr-1" />
            {loading ? 'Saving...' : 'Save Payroll'}
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Pay Period</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={selectedPeriod.startDate}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={selectedPeriod.endDate}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={calculatePayroll}
              className="w-full btn-primary btn-sm"
            >
              <Calculator className="w-4 h-4 mr-1" />
              Calculate Payroll
            </button>
          </div>
        </div>
      </div>

      {/* Payroll Summary */}
      {payroll.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Payroll Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Total Hours:</span>
              <span className="ml-2 font-medium text-blue-900">{totals.totalHours.toFixed(1)}h</span>
            </div>
            <div>
              <span className="text-blue-600">Base Pay:</span>
              <span className="ml-2 font-medium text-blue-900">${totals.totalBasePay.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-blue-600">Commission:</span>
              <span className="ml-2 font-medium text-blue-900">${totals.totalCommission.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-blue-600">Total Pay:</span>
              <span className="ml-2 font-medium text-blue-900">${totals.totalPay.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Individual Payroll Details */}
      {payroll.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Staff Payroll Details</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pay
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payroll.map((pay) => (
                  <tr key={pay.staffId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {pay.staffName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pay.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {pay.totalHours.toFixed(1)}h
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          ${pay.basePay.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-sm text-green-600">
                          ${pay.commission.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        ${pay.totalPay.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commission Tiers Summary */}
      {commissionTiers.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 mb-3">Commission Tiers</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {commissionTiers.map((tier) => (
              <div key={tier.id} className="text-sm">
                <div className="font-medium text-green-900">{tier.tier_name}</div>
                <div className="text-green-700">
                  Target: ${tier.sales_target.toLocaleString()}
                </div>
                <div className="text-green-600">
                  Rate: {tier.commission_rate}% + ${tier.bonus_amount} bonus
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PayCalculator 