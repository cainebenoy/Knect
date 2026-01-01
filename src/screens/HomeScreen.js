import React, { useCallback, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity,
  TextInput,
  Alert 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Ionicons } from '@expo/vector-icons';
import { useKnect } from '../context/KnectContext';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const { connections, refreshAllData, loading } = useKnect();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConnections, setFilteredConnections] = useState([]);

  useFocusEffect(
    useCallback(() => {
      refreshAllData();
    }, [])
  );

  // Filter Logic
  useEffect(() => {
    if (!connections) return;
    if (searchQuery === '') {
      setFilteredConnections(connections);
    } else {
      const lowerText = searchQuery.toLowerCase();
      const filtered = connections.filter((item) => {
        const name = item.profiles?.full_name?.toLowerCase() || '';
        const title = item.profiles?.job_title?.toLowerCase() || '';
        return name.includes(lowerText) || title.includes(lowerText);
      });
      setFilteredConnections(filtered);
    }
  }, [searchQuery, connections]);

  // --- DELETE FUNCTION ---
  const deleteConnection = async (rowMap, id) => {
    if (rowMap[id]) {
      rowMap[id].closeRow();
    }

    Alert.alert(
      "Remove Connection",
      "Are you sure you want to delete this person?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('connections')
                .delete()
                .eq('id', id);

              if (error) throw error;
              refreshAllData();
              
            } catch (error) {
              Alert.alert("Error", "Could not delete connection.");
            }
          }
        }
      ]
    );
  };

  // --- RENDER FRONT ROW ---
  const renderItem = ({ item }) => {
    // Robust Date Handling
    const rawDate = item.created_at || item.met_at;
    const formattedDate = rawDate 
      ? new Date(rawDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : "Recently";

    return (
      <TouchableOpacity 
        style={styles.connectionCard}
        activeOpacity={1}
        onPress={() => navigation.navigate('ConnectionDetail', { connection: item })}
      >
        <View style={styles.avatarWrapper}>
          {item.profiles?.avatar_url ? (
            <Image 
              source={{ uri: item.profiles.avatar_url }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.profiles?.full_name ? item.profiles.full_name[0] : '?'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {item.profiles?.full_name || 'Unknown User'}
          </Text>
          <Text style={styles.role} numberOfLines={1}>
            {item.profiles?.job_title || 'No Title Provided'}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={10} color={COLORS.textDim} />
            <Text style={styles.date}> Met on {formattedDate}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
      </TouchableOpacity>
    );
  };

  // --- RENDER HIDDEN ROW ---
  const renderHiddenItem = (data, rowMap) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.backRightBtn}
        onPress={() => deleteConnection(rowMap, data.item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>RECENT KNECTS</Text>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textDim} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search connections..."
          placeholderTextColor={COLORS.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textDim} />
          </TouchableOpacity>
        )}
      </View>

      {loading && connections.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Syncing Radar...</Text>
        </View>
      ) : (
        <SwipeListView
          data={filteredConnections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-85}
          disableRightSwipe={true}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="#333" />
              <Text style={styles.emptyText}>
                {searchQuery ? "No matches found." : "Your radar is empty.\nScan someone to get started!"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60, paddingHorizontal: 20 },
  header: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', letterSpacing: 4, marginBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.primary, marginTop: 10, letterSpacing: 1, fontSize: 12 },
  
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: 'white', fontSize: 16 },

  connectionCard: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.surface, 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    height: 90, 
  },
  avatarWrapper: { marginRight: 15 },
  avatarImage: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 1, borderColor: COLORS.primary },
  avatarPlaceholder: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  infoContainer: { flex: 1 },
  name: { color: 'white', fontWeight: 'bold', fontSize: 17, marginBottom: 2 },
  role: { color: COLORS.secondary, fontSize: 13, marginBottom: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  date: { color: COLORS.textDim, fontSize: 11 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: COLORS.textDim, textAlign: 'center', marginTop: 20, fontSize: 16, lineHeight: 24 },

  rowBack: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    borderRadius: 15,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
    backgroundColor: '#FF4444',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    height: 90, 
  },
  deleteText: {
    color: 'white',
    fontSize: 10,
    marginTop: 5,
    fontWeight: 'bold'
  }
});