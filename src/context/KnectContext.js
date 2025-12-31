import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
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
  
  // Use a ref to keep track of the user ID inside the subscription callback
  // (This prevents stale closure issues where the listener fetches data for 'null')
  const userIdRef = useRef(null);

  // This runs ONCE when the app starts
  useEffect(() => {
    refreshAllData();

    // SETUP REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('knect_global_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'connections',
        },
        (payload) => {
          // Optimization: Only refresh if the change involves ME
          // We check if the new row's 'connector_id' matches my ID
          if (userIdRef.current && payload.new && payload.new.connector_id === userIdRef.current) {
            console.log("⚡ Realtime Update: Refreshing List...");
            fetchConnections(userIdRef.current);
          }
        }
      )
      .subscribe();

    // Clean up when app closes
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshAllData = async () => {
    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUser(user);
    userIdRef.current = user.id; // Update Ref for the listener

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
    // Note: 'met_at' was renamed to 'created_at' in previous steps?
    // Check your database columns. If you are using 'created_at', change 'met_at' below.
    // I will use 'created_at' as per standard Supabase defaults, change back to 'met_at' if you customized it.
    
    const { data } = await supabase
      .from('connections')
      .select(`
        id,
        created_at, 
        location_lat,
        location_long,
        profiles:connected_to_id (full_name, job_title, avatar_url) 
      `)
      .eq('connector_id', userId)
      .order('created_at', { ascending: false }); // Sort by newest first
    
    if (data) setConnections(data);
  };

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
      refreshAllData // We expose this so screens can ask for a refresh manually too
    }}>
      {children}
    </KnectContext.Provider>
  );
};

// Custom hook to make using it easier
export const useKnect = () => useContext(KnectContext);