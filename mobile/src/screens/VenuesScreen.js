import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, MapPin, Phone, Mail, Clock } from 'lucide-react-native'
import { useApp } from '../contexts/AppContext'

const VenuesScreen = () => {
  const { venuesData, addVenueEntry } = useApp()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVenue, setNewVenue] = useState({
    name: '',
    address: '',
    city: '',
    contact: '',
    phone: '',
    email: '',
    times: '',
    showInfo: '',
    forecastWill: ''
  })

  const handleAddVenue = async () => {
    if (!newVenue.name || !newVenue.address) {
      Alert.alert('Error', 'Please fill in venue name and address')
      return
    }

    try {
      await addVenueEntry(newVenue)
      setNewVenue({
        name: '',
        address: '',
        city: '',
        contact: '',
        phone: '',
        email: '',
        times: '',
        showInfo: '',
        forecastWill: ''
      })
      setShowAddForm(false)
      Alert.alert('Success', 'Venue added successfully')
    } catch (error) {
      Alert.alert('Error', 'Failed to add venue')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Venues</Text>
          <Text style={styles.subtitle}>Manage venue locations and contacts</Text>
        </View>

        {/* Add Venue Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Venue</Text>
          </TouchableOpacity>
        </View>

        {/* Add Venue Form */}
        {showAddForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Add New Venue</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue Name *</Text>
              <TextInput
                style={styles.input}
                value={newVenue.name}
                onChangeText={(text) => setNewVenue({...newVenue, name: text})}
                placeholder="Enter venue name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={styles.input}
                value={newVenue.address}
                onChangeText={(text) => setNewVenue({...newVenue, address: text})}
                placeholder="Enter address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={newVenue.city}
                onChangeText={(text) => setNewVenue({...newVenue, city: text})}
                placeholder="Enter city"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Person</Text>
              <TextInput
                style={styles.input}
                value={newVenue.contact}
                onChangeText={(text) => setNewVenue({...newVenue, contact: text})}
                placeholder="Contact person name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={newVenue.phone}
                onChangeText={(text) => setNewVenue({...newVenue, phone: text})}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={newVenue.email}
                onChangeText={(text) => setNewVenue({...newVenue, email: text})}
                placeholder="Email address"
                keyboardType="email-address"
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
                onPress={handleAddVenue}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Venues List */}
        <View style={styles.venuesList}>
          <Text style={styles.sectionTitle}>All Venues</Text>
          {venuesData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No venues added yet</Text>
              <Text style={styles.emptySubtext}>Tap "Add Venue" to get started</Text>
            </View>
          ) : (
            venuesData.map((venue, index) => (
              <View key={index} style={styles.venueItem}>
                <View style={styles.venueHeader}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueStatus}>{venue.status || 'Active'}</Text>
                </View>
                
                <View style={styles.venueDetails}>
                  <View style={styles.venueDetailRow}>
                    <MapPin size={16} color="#64748b" />
                    <Text style={styles.venueDetailText}>
                      {venue.address}{venue.city ? `, ${venue.city}` : ''}
                    </Text>
                  </View>
                  
                  {venue.contact && (
                    <View style={styles.venueDetailRow}>
                      <Text style={styles.venueDetailText}>Contact: {venue.contact}</Text>
                    </View>
                  )}
                  
                  {venue.phone && (
                    <View style={styles.venueDetailRow}>
                      <Phone size={16} color="#64748b" />
                      <Text style={styles.venueDetailText}>{venue.phone}</Text>
                    </View>
                  )}
                  
                  {venue.email && (
                    <View style={styles.venueDetailRow}>
                      <Mail size={16} color="#64748b" />
                      <Text style={styles.venueDetailText}>{venue.email}</Text>
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
  venuesList: {
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
  venueItem: {
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
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  venueStatus: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  venueDetails: {
    gap: 8,
  },
  venueDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  venueDetailText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
})

export default VenuesScreen 