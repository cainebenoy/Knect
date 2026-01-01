import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

const KnectContext = createContext();

export const KnectProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [location, setLocation] = useState(null);
  
  // "loading" is ONLY for the initial app launch. 
  // We don't use it for tab switching anymore.
  const [loading, setLoading] = useState(true);
  
  const userIdRef = useRef(null);

  // 1. INITIAL BOOT
  useEffect(() => {
    const initSession = async () => {
      // Check active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        userIdRef.current = session.user.id;
        // Fetch data immediately
        await refreshAllData(session.user.id);
      }
      
      // Stop the global spinner once we've checked session
      setLoading(false);
    };

    initSession();

    // Listen for Auth Changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        userIdRef.current = session.user.id;
        await refreshAllData(session.user.id);
      } else {
        // Clear data on logout
        setUser(null);
        setProfile(null);
        setConnections([]);
        userIdRef.current = null;
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. REALTIME LISTENER
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('knect_global_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections' },
        (payload) => {
          // If the change involves ME, refresh the list
          if (userIdRef.current && payload.new && payload.new.connector_id === userIdRef.current) {
            console.log("⚡ Realtime Update");
            // Silent refresh (background)
            fetchConnections(userIdRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Re-run if user changes

  // 3. THE REFRESH LOGIC (Silent)
  const refreshAllData = async (manualUserId = null) => {
    // Determine which ID to use (Manual passed ID or current state ID)
    const targetId = manualUserId || user?.id;
    if (!targetId) return;

    // Run fetches in parallel
    // We do NOT set loading(true) here to prevent UI flickering
    await Promise.all([
      fetchProfile(targetId),
      fetchConnections(targetId),
      fetchLocation()
    ]);
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) setProfile(data);
    } catch (e) {
      console.log("Profile fetch error:", e);
    }
  };

  const fetchConnections = async (userId) => {
    try {
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
        `)
        .eq('connector_id', userId)
        .order('created_at', { ascending: false });
      
      if (data) setConnections(data);
    } catch (e) {
      console.log("Connections fetch error:", e);
    }
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
      loading, // Only true on app launch
      refreshAllData // Screens can call this to update data silently
    }}>
      {children}
    </KnectContext.Provider>
  );
};

export const useKnect = () => useContext(KnectContext);