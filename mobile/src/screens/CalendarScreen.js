import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Calendar } from 'react-native-calendars'

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = React.useState('')

  const onDayPress = (day) => {
    setSelectedDate(day.dateString)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Schedule and events</Text>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: '#3b82f6',
              },
            }}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#64748b',
              selectedDayBackgroundColor: '#3b82f6',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#3b82f6',
              dayTextColor: '#1e293b',
              textDisabledColor: '#d1d5db',
              dotColor: '#3b82f6',
              selectedDotColor: '#ffffff',
              arrowColor: '#3b82f6',
              disabledArrowColor: '#d1d5db',
              monthTextColor: '#1e293b',
              indicatorColor: '#3b82f6',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>

        {/* Selected Date Info */}
        {selectedDate && (
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateTitle}>Selected Date</Text>
            <Text style={styles.selectedDateText}>{selectedDate}</Text>
          </View>
        )}

        {/* Events Section */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events scheduled</Text>
            <Text style={styles.emptySubtext}>Events will appear here when added</Text>
          </View>
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
  calendarContainer: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedDateContainer: {
    margin: 20,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectedDateText: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  eventsSection: {
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
})

export default CalendarScreen 