import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'

// Import screens
import DashboardScreen from './src/screens/DashboardScreen'
import DailySalesScreen from './src/screens/DailySalesScreen'
import CalendarScreen from './src/screens/CalendarScreen'
import VenuesScreen from './src/screens/VenuesScreen'
import StaffScreen from './src/screens/StaffScreen'

// Import context
import { AppProvider } from './src/contexts/AppContext'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === 'Dashboard') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline'
          } else if (route.name === 'Daily Sales') {
            iconName = focused ? 'cash' : 'cash-outline'
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline'
          } else if (route.name === 'Venues') {
            iconName = focused ? 'location' : 'location-outline'
          } else if (route.name === 'Staff') {
            iconName = focused ? 'people' : 'people-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Daily Sales" component={DailySalesScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Venues" component={VenuesScreen} />
      <Tab.Screen name="Staff" component={StaffScreen} />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <TabNavigator />
      </NavigationContainer>
    </AppProvider>
  )
} 