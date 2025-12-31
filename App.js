import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Context Provider
import { KnectProvider } from './src/context/KnectContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import GridScreen from './src/screens/GridScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Theme
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: '#333',
          height: 90,
          paddingBottom: 30,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Radar') {
            iconName = focused ? 'radio' : 'radio-outline';
          } else if (route.name === 'Scan') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'Grid') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Pass') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Radar" component={HomeScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      
      {/* KEY CHANGE: lazy={false} 
         This forces the Map to load in the background 
         as soon as the app opens.
      */}
      <Tab.Screen 
        name="Grid" 
        component={GridScreen} 
        options={{ lazy: false }} 
      />
      
      <Tab.Screen name="Pass" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <KnectProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </KnectProvider>
  );
}