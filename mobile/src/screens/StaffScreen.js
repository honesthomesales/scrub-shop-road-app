import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Users, Mail, Phone } from 'lucide-react-native'
import { useApp } from '../contexts/AppContext'

const StaffScreen = () => {
  const { staffData } = useApp()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Staff</Text>
          <Text style={styles.subtitle}>Team members and contacts</Text>
        </View>

        {/* Staff List */}
        <View style={styles.staffList}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          {staffData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No staff members added yet</Text>
              <Text style={styles.emptySubtext}>Staff data will appear here when available</Text>
            </View>
          ) : (
            staffData.map((staff, index) => (
              <View key={index} style={styles.staffItem}>
                <View style={styles.staffHeader}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  <Text style={styles.staffRole}>{staff.role || 'No Role'}</Text>
                </View>
                
                <View style={styles.staffDetails}>
                  {staff.email && (
                    <View style={styles.staffDetailRow}>
                      <Mail size={16} color="#64748b" />
                      <Text style={styles.staffDetailText}>{staff.email}</Text>
                    </View>
                  )}
                  
                  {staff.phone && (
                    <View style={styles.staffDetailRow}>
                      <Phone size={16} color="#64748b" />
                      <Text style={styles.staffDetailText}>{staff.phone}</Text>
                    </View>
                  )}
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
  staffList: {
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
  staffItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  staffRole: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  staffDetails: {
    gap: 8,
  },
  staffDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staffDetailText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
})

export default StaffScreen 