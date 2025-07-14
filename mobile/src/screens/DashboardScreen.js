import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApp } from '../contexts/AppContext'

const DashboardScreen = () => {
  const { currentSheet, salesData, loading } = useApp()

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            {currentSheet === 'TRAILER_HISTORY' ? 'Trailer' : 'Camper'} Operations
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Sales</Text>
            <Text style={styles.cardValue}>
              {salesData.length}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Month</Text>
            <Text style={styles.cardValue}>
              {salesData.filter(sale => {
                const saleDate = new Date(sale.date)
                const now = new Date()
                return saleDate.getMonth() === now.getMonth() && 
                       saleDate.getFullYear() === now.getFullYear()
              }).length}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Add Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Sales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          {salesData.slice(0, 5).map((sale, index) => (
            <View key={index} style={styles.saleItem}>
              <Text style={styles.saleDate}>{sale.date}</Text>
              <Text style={styles.saleStatus}>{sale.status}</Text>
              <Text style={styles.saleAmount}>${sale.grossSales}</Text>
            </View>
          ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
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
  cardsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saleItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleDate: {
    fontSize: 14,
    color: '#64748b',
  },
  saleStatus: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
})

export default DashboardScreen 