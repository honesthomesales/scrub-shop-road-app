import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider } from './src/contexts/AppContext'

// Import screens
import DashboardScreen from './src/screens/DashboardScreen'
import DailySalesScreen from './src/screens/DailySalesScreen'
import VenuesScreen from './src/screens/VenuesScreen'
import StaffScreen from './src/screens/StaffScreen' // Updated import
import CalendarScreen from './src/screens/CalendarScreen'
import TasksScreen from './src/screens/TasksScreen'
import MessagesScreen from './src/screens/MessagesScreen'

// Import icons
import { BarChart3, Calendar, MapPin, Users, MessageSquare, CheckSquare } from 'lucide-react-native'

const Tab = createBottomTabNavigator()

function AppContent() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === 'Dashboard') {
            iconName = BarChart3
          } else if (route.name === 'Daily Sales') {
            iconName = BarChart3
          } else if (route.name === 'Venues') {
            iconName = MapPin
          } else if (route.name === 'Staff') {
            iconName = Users
          } else if (route.name === 'Calendar') {
            iconName = Calendar
          } else if (route.name === 'Tasks') {
            iconName = CheckSquare
          } else if (route.name === 'Messages') {
            iconName = MessageSquare
          }

          return <iconName size={size} color={color} />
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Daily Sales" component={DailySalesScreen} />
      <Tab.Screen name="Venues" component={VenuesScreen} />
      <Tab.Screen name="Staff" component={StaffScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </NavigationContainer>
    </AppProvider>
  )
} 