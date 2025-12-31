import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

// Create the memory space
const KnectContext = createContext();

export const KnectProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // This runs ONCE when the app starts
  useEffect(() => {
    refreshAllData();
  }, []);

  const refreshAllData = async () => {
    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUser(user);

    // 2. Start these three tasks IN PARALLEL (Fastest)
    await Promise.all([
      fetchProfile(user.id),
      fetchConnections(user.id),
      fetchLocation()
    ]);

    setLoading(false);
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile({ ...data, id: userId });
  };

  const fetchConnections = async (userId) => {
    const { data } = await supabase
      .from('connections')
      .select(`
        id,
        met_at,
        location_lat,
        location_long,
        profiles:connected_to_id (full_name, job_title, avatar_url) 
      `) // <--- ADDED 'avatar_url' HERE
      .eq('connector_id', userId)
      .order('met_at', { ascending: false });
    
    if (data) setConnections(data);
  };;

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (e) {
      console.log("GPS Init failed", e);
    }
  };

  return (
    <KnectContext.Provider value={{
      user,
      profile,
      connections,
      location,
      loading,
      refreshAllData // We expose this so screens can ask for a refresh
    }}>
      {children}
    </KnectContext.Provider>
  );
};

// Custom hook to make using it easier
export const useKnect = () => useContext(KnectContext);