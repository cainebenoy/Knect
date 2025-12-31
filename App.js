import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // <--- NEW IMPORT
import { Ionicons } from '@expo/vector-icons';

import { KnectProvider } from './src/context/KnectContext';
import { COLORS } from './src/constants/theme';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ConnectionDetailsScreen from './src/screens/ConnectionDetailsScreen'; // <--- NEW IMPORT
import ScanScreen from './src/screens/ScanScreen';
import GridScreen from './src/screens/GridScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- NEW STACK NAVIGATOR ---
// This handles the navigation INSIDE the Radar tab (List -> Detail)
function RadarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RadarList" component={HomeScreen} />
      <Stack.Screen name="ConnectionDetail" component={ConnectionDetailsScreen} />
    </Stack.Navigator>
  );
}

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

          if (route.name === 'Radar') iconName = focused ? 'radio' : 'radio-outline';
          else if (route.name === 'Scan') iconName = focused ? 'scan' : 'scan-outline';
          else if (route.name === 'Grid') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Pass') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* CHANGED: We now point to RadarStack instead of HomeScreen */}
      <Tab.Screen name="Radar" component={RadarStack} /> 
      
      <Tab.Screen name="Scan" component={ScanScreen} />
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