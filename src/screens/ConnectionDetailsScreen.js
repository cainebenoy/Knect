import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function ConnectionDetailsScreen({ route, navigation }) {
  // 1. Get the data passed from the previous screen
  const { connection } = route.params;
  const profile = connection.profiles;

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE VIEW</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          
          {/* AVATAR */}
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {profile?.full_name ? profile.full_name[0] : '?'}
                </Text>
              </View>
            )}
          </View>

          {/* TEXT INFO */}
          <Text style={styles.name}>{profile?.full_name || 'Unknown'}</Text>
          <Text style={styles.role}>{profile?.job_title || 'No Title'}</Text>

          <View style={styles.divider} />

          {/* META DATA */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.infoText}>
              Met on {new Date(connection.met_at).toDateString()}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.infoText}>
              {new Date(connection.met_at).toLocaleTimeString()}
            </Text>
          </View>

          {/* THEIR QR CODE (Social Proxy) */}
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>THEIR KNECT PASS</Text>
            <View style={styles.qrBox}>
              <QRCode
                value={`knect://user/${connection.connected_to_id}`} // Scan THIS to connect with THEM
                size={150}
                color={COLORS.background}
                backgroundColor="white"
              />
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backButton: { padding: 10, backgroundColor: '#333', borderRadius: 10, marginRight: 15 },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  
  scrollContent: { alignItems: 'center', paddingBottom: 40 },
  
  card: { 
    width: width * 0.9, 
    backgroundColor: COLORS.surface, 
    borderRadius: 30, 
    padding: 30, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#333' 
  },
  
  avatarContainer: { marginBottom: 20, shadowColor: COLORS.secondary, shadowOpacity: 0.5, shadowRadius: 15 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: COLORS.secondary },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.secondary },
  avatarInitials: { fontSize: 50, color: 'white', fontWeight: 'bold' },
  
  name: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  role: { color: COLORS.secondary, fontSize: 18, textAlign: 'center', marginBottom: 20 },
  
  divider: { width: '100%', height: 1, backgroundColor: '#333', marginVertical: 20 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { color: COLORS.textDim, marginLeft: 10, fontSize: 16 },
  
  qrSection: { marginTop: 20, alignItems: 'center', width: '100%' },
  qrLabel: { color: COLORS.textDim, fontSize: 12, marginBottom: 15, letterSpacing: 2 },
  qrBox: { padding: 15, backgroundColor: 'white', borderRadius: 20 },
});