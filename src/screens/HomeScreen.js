import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // <--- NEW IMPORT
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';

export default function HomeScreen() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  // This runs EVERY time you switch to this tab
  useFocusEffect(
    useCallback(() => {
      fetchMyConnections();
    }, [])
  );

  async function fetchMyConnections() {
    // We don't want to show the spinner every time we switch tabs, 
    // only if the list is empty initially.
    // setLoading(true); <--- Optional: Comment this out for smoother feel

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select(`
        id,
        met_at,
        profiles:connected_to_id (full_name, job_title)
      `)
      .eq('connector_id', user.id)
      .order('met_at', { ascending: false });

    if (data) setConnections(data);
    setLoading(false);
  }

  const renderItem = ({ item }) => (
    <View style={styles.connectionCard}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {item.profiles?.full_name ? item.profiles.full_name[0] : '?'}
        </Text>
      </View>
      <View>
        <Text style={styles.name}>{item.profiles?.full_name || 'Unknown'}</Text>
        <Text style={styles.role}>{item.profiles?.job_title || 'No Title'}</Text>
        <Text style={styles.date}>{new Date(item.met_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>RECENT KNECTS</Text>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={connections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No connections yet. Go scan someone!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60, paddingHorizontal: 20 },
  header: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', letterSpacing: 4, marginBottom: 20 },
  connectionCard: { 
    flexDirection: 'row', backgroundColor: COLORS.surface, padding: 15, borderRadius: 15, marginBottom: 12, alignItems: 'center' 
  },
  avatarPlaceholder: { 
    width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  name: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  role: { color: COLORS.secondary, fontSize: 12 },
  date: { color: COLORS.textDim, fontSize: 10, marginTop: 4 },
  emptyText: { color: COLORS.textDim, textAlign: 'center', marginTop: 50 }
});