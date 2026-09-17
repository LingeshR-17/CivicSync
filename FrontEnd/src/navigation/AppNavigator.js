import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// 📂 Import all your created layout screens
import HomeScreen from './src/screens/HomeScreen';
import MapExplorerScreen from './src/screens/MapExplorerScreen';
import FileGrievanceScreen from './src/screens/FileGrievanceScreen';
// Add Login/Register here later when you hook up the auth state layers!

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false, // Hides the default white header bar so your beautiful custom design fills the screen
        cardStyle: { backgroundColor: '#0f172a' }, // Keeps screen transitions dark and uniform
      }}
    >
      {/* 🧭 Define your application routing map */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MapExplorer" component={MapExplorerScreen} />
      <Stack.Screen name="FileGrievance" component={FileGrievanceScreen} />
    </Stack.Navigator>
  );
}