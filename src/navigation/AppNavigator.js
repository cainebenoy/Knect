import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Icons come with Expo
import { COLORS } from '../constants/theme';

// Import the screens we just made
import HomeScreen from '../screens/HomeScreen';
import GridScreen from '../screens/GridScreen';
import ScanScreen from '../screens/ScanScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // Hide default header
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textDim,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Radar') iconName = focused ? 'radio' : 'radio-outline';
            else if (route.name === 'Grid') iconName = focused ? 'map' : 'map-outline';
            else if (route.name === 'Scan') iconName = focused ? 'qr-code' : 'qr-code-outline';
            else if (route.name === 'Pass') iconName = focused ? 'person' : 'person-outline';

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Radar" component={HomeScreen} />
        <Tab.Screen name="Grid" component={GridScreen} />
        <Tab.Screen name="Scan" component={ScanScreen} />
        <Tab.Screen name="Pass" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}