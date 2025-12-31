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
import { SwipeListView } from 'react-native-swipe-list-view'; // <--- NEW LIBRARY
import { Ionicons } from '@expo/vector-icons';
import { useKnect } from '../context/KnectContext';
import { supabase } from '../lib/supabase'; // Need this to perform delete
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
    // 1. Close the row smoothly
    if (rowMap[id]) {
      rowMap[id].closeRow();
    }

    // 2. Ask for confirmation
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
              // 3. Delete from Database
              const { error } = await supabase
                .from('connections')
                .delete()
                .eq('id', id);

              if (error) throw error;

              // 4. Refresh List
              refreshAllData();
              
            } catch (error) {
              Alert.alert("Error", "Could not delete connection.");
            }
          }
        }
      ]
    );
  };

  // --- RENDER FRONT ROW (The Card) ---
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.connectionCard}
      activeOpacity={1} // Keep opacity 1 so it doesn't flash when swiping
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
        <Text style={styles.name}>{item.profiles?.full_name || 'Unknown'}</Text>
        <Text style={styles.role}>{item.profiles?.job_title || 'No Title'}</Text>
        <Text style={styles.date}>
          Met on {new Date(item.met_at).toLocaleDateString()}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
    </TouchableOpacity>
  );

  // --- RENDER HIDDEN ROW (The Red Button) ---
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
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textDim} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or role..."
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
        <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
      ) : (
        <SwipeListView
          data={filteredConnections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-85} // How far to slide left
          disableRightSwipe={true} // Disable swiping right
          contentContainerStyle={{ paddingBottom: 100 }}
          previewRowKey={'0'}
          previewOpenValue={-40}
          previewOpenDelay={3000}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery ? "No matching connections found." : "No connections yet. Go scan someone!"}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60, paddingHorizontal: 20 },
  header: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', letterSpacing: 4, marginBottom: 20 },
  
  // Search
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

  // Card Styles
  connectionCard: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.surface, 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    // Must add height to ensure swipe view works perfectly
    height: 80, 
  },
  avatarWrapper: { marginRight: 15 },
  avatarImage: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: COLORS.primary },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  infoContainer: { flex: 1 },
  name: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  role: { color: COLORS.secondary, fontSize: 12, marginBottom: 4 },
  date: { color: COLORS.textDim, fontSize: 10 },
  emptyText: { color: COLORS.textDim, textAlign: 'center', marginTop: 50, fontSize: 16 },

  // Swipe Hidden Styles
  rowBack: {
    alignItems: 'center',
    backgroundColor: COLORS.background, // Match bg so it looks transparent
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
    height: 80, // Match Card Height
  },
  deleteText: {
    color: 'white',
    fontSize: 10,
    marginTop: 5,
    fontWeight: 'bold'
  }
});