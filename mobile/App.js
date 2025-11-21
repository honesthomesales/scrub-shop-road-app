import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { AppProvider } from './src/contexts/AppContext'
import { 
  BarChart3, 
  Calendar, 
  MapPin, 
  Users, 
  MessageSquare, 
  CheckSquare,
  Car,
  Settings
} from 'lucide-react-native'

// Import screens
import DashboardScreen from './src/screens/DashboardScreen'
import DailySalesScreen from './src/screens/DailySalesScreen'
import VenuesScreen from './src/screens/VenuesScreen'
import CalendarScreen from './src/screens/CalendarScreen'
import StaffScreen from './src/screens/StaffScreen'
import TasksScreen from './src/screens/TasksScreen'
import MessagesScreen from './src/screens/MessagesScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent
          
          switch (route.name) {
            case 'Dashboard':
              IconComponent = BarChart3
              break
            case 'Daily Sales':
              IconComponent = Car
              break
            case 'Venues':
              IconComponent = MapPin
              break
            case 'Calendar':
              IconComponent = Calendar
              break
            case 'Staff':
              IconComponent = Users
              break
            case 'Tasks':
              IconComponent = CheckSquare
              break
            case 'Messages':
              IconComponent = MessageSquare
              break
            default:
              IconComponent = BarChart3
          }
          
          return <IconComponent size={size} color={color} />
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomColor: '#e5e7eb',
        },
        headerTitleStyle: {
          color: '#1f2937',
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Daily Sales" 
        component={DailySalesScreen}
        options={{ title: 'Daily Sales' }}
      />
      <Tab.Screen 
        name="Venues" 
        component={VenuesScreen}
        options={{ title: 'Venues' }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen 
        name="Staff" 
        component={StaffScreen}
        options={{ title: 'Staff' }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  )
}

 