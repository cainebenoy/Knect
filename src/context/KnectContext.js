import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

const KnectContext = createContext();

export const KnectProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const userIdRef = useRef(null);

  // 1. DATA LIFECYCLE MANAGER
  useEffect(() => {
    let realtimeChannel;

    const manageSession = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      handleUserSession(session?.user);

      // Listen for changes (Sign In / Sign Out)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleUserSession(session?.user);
      });

      return () => subscription.unsubscribe();
    };

    manageSession();

    // Cleanup
    return () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // 2. Handle Login/Logout Logic
  const handleUserSession = async (currentUser) => {
    if (currentUser) {
      // LOGGED IN: Set user and fetch data
      setUser(currentUser);
      userIdRef.current = currentUser.id;
      
      await Promise.all([
        fetchProfile(currentUser.id),
        fetchConnections(currentUser.id),
        fetchLocation()
      ]);
      
      setupRealtime(currentUser.id);
    } else {
      // LOGGED OUT: Clear everything
      setUser(null);
      setProfile(null);
      setConnections([]);
      userIdRef.current = null;
      // Remove realtime subscription if exists
      supabase.removeAllChannels(); 
    }
    setLoading(false);
  };

  const setupRealtime = (uid) => {
    supabase
      .channel('knect_global_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections' },
        (payload) => {
          if (uid && payload.new && payload.new.connector_id === uid) {
            console.log("⚡ Realtime Update");
            fetchConnections(uid);
          }
        }
      )
      .subscribe();
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
    const { data, error } = await supabase
      .from('connections')
      .select(`
        id,
        created_at, 
        connected_to_id,  
        location_lat,
        location_long,
        profiles:connected_to_id (
          full_name, 
          job_title, 
          avatar_url,
          linkedin,
          github,
          twitter,
          instagram
        ) 
      `) // ^^^ ADDED connected_to_id HERE
      .eq('connector_id', userId)
      .order('created_at', { ascending: false });
    
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
      refreshAllData: () => handleUserSession(user) // Allow manual refresh
    }}>
      {children}
    </KnectContext.Provider>
  );
};

export const useKnect = () => useContext(KnectContext);