import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { KnectProvider } from './src/context/KnectContext';
import { COLORS } from './src/constants/theme';
import { supabase } from './src/lib/supabase';

// --- SCREENS (MATCHING YOUR FILE STRUCTURE) ---
import AuthScreen from './src/screens/AuthScreen'; // <--- CORRECT IMPORT
import HomeScreen from './src/screens/HomeScreen';
import ConnectionDetailsScreen from './src/screens/ConnectionDetailsScreen';
import ScanScreen from './src/screens/ScanScreen';
import GridScreen from './src/screens/GridScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. AUTH STACK
// Since you have a single AuthScreen, we just direct to that.
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
}

// 2. RADAR STACK (List -> Details)
function RadarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RadarList" component={HomeScreen} />
      <Stack.Screen name="ConnectionDetail" component={ConnectionDetailsScreen} />
    </Stack.Navigator>
  );
}

// 3. MAIN APP TABS
function AppTabs() {
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
      <Tab.Screen name="Radar" component={RadarStack} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Grid" component={GridScreen} />
      <Tab.Screen name="Pass" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (Login/SignOut)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KnectProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {/* If session exists, show App. If not, show Auth. */}
        {session && session.user ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </KnectProvider>
  );
}