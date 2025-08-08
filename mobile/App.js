import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scrub Shop Road App</Text>
        <Text style={styles.subtitle}>Mobile Testing</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>✅ App Loaded Successfully</Text>
          <Text style={styles.statusText}>✅ No API Calls</Text>
          <Text style={styles.statusText}>✅ React Native Working</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>This is a minimal test version</Text>
          <Text style={styles.infoText}>No external dependencies</Text>
          <Text style={styles.infoText}>Should not cause 500 errors</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#28a745',
    marginBottom: 8,
    fontWeight: '500',
  },
  infoContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
    textAlign: 'center',
  },
}) 