import React from 'react'
import { View, Text } from 'react-native'

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <Text style={{ fontSize: 20, color: 'black' }}>Hello World!</Text>
      <Text style={{ fontSize: 16, color: 'blue', marginTop: 10 }}>React Native is working!</Text>
    </View>
  )
} 