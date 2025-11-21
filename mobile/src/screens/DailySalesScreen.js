import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Calendar, DollarSign } from 'lucide-react-native'
import { useApp } from '../contexts/AppContext'

const DailySalesScreen = () => {
  const { salesData, addSalesEntry, currentSheet } = useApp()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSale, setNewSale] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'Completed',
    grossSales: '',
    venue: ''
  })

  const handleAddSale = async () => {
    if (!newSale.grossSales || !newSale.venue) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    try {
      await addSalesEntry(newSale)
      setNewSale({
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        grossSales: '',
        venue: ''
      })
      setShowAddForm(false)
      Alert.alert('Success', 'Sale added successfully')
    } catch (error) {
      Alert.alert('Error', 'Failed to add sale')
    }
  }

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Daily Sales</Text>
          <Text style={styles.subtitle}>
            {currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'} Sales
          </Text>
        </View>

        {/* Add Sale Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Sale</Text>
          </TouchableOpacity>
        </View>

        {/* Add Sale Form */}
        {showAddForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Add New Sale</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.input}
                value={newSale.date}
                onChangeText={(text) => setNewSale({...newSale, date: text})}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue</Text>
              <TextInput
                style={styles.input}
                value={newSale.venue}
                onChangeText={(text) => setNewSale({...newSale, venue: text})}
                placeholder="Enter venue name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gross Sales</Text>
              <TextInput
                style={styles.input}
                value={newSale.grossSales}
                onChangeText={(text) => setNewSale({...newSale, grossSales: text})}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddSale}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sales List */}
        <View style={styles.salesList}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          {salesData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sales recorded yet</Text>
              <Text style={styles.emptySubtext}>Tap "Add Sale" to get started</Text>
            </View>
          ) : (
            salesData.map((sale, index) => (
              <View key={index} style={styles.saleItem}>
                <View style={styles.saleInfo}>
                  <Text style={styles.saleDate}>{sale.date}</Text>
                  <Text style={styles.saleVenue}>{sale.venue || 'Unknown Venue'}</Text>
                </View>
                <View style={styles.saleDetails}>
                  <Text style={styles.saleStatus}>{sale.status}</Text>
                  <Text style={styles.saleAmount}>{formatCurrency(sale.grossSales)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  addButtonContainer: {
    padding: 20,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    margin: 20,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  salesList: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  saleItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  saleInfo: {
    flex: 1,
  },
  saleDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  saleVenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  saleDetails: {
    alignItems: 'flex-end',
  },
  saleStatus: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
})

export default DailySalesScreen 