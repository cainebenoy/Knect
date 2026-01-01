import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function ConnectionDetailsScreen({ route, navigation }) {
  const { connection } = route.params;
  
  // 1. Fetch Profile Data safely
  const profile = connection.profiles || {};

  // 2. Helper to open links safely
  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this link: " + url);
      }
    } catch (err) {
      console.error("An error occurred", err);
    }
  };

  return (
    <View style={styles.container}>
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
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {profile.full_name ? profile.full_name[0] : '?'}
                </Text>
              </View>
            )}
          </View>

          {/* NAME & TITLE */}
          <Text style={styles.name}>{profile.full_name || 'Unknown'}</Text>
          <Text style={styles.role}>{profile.job_title || 'No Title'}</Text>

          {/* --- SOCIAL LINKS ROW --- */}
          <View style={styles.socialContainer}>
            {profile.linkedin ? (
              <TouchableOpacity onPress={() => openLink(`https://linkedin.com/in/${profile.linkedin}`)}>
                <FontAwesome name="linkedin-square" size={32} color="#0077B5" style={styles.socialIcon} />
              </TouchableOpacity>
            ) : null}

            {profile.github ? (
              <TouchableOpacity onPress={() => openLink(`https://github.com/${profile.github}`)}>
                <FontAwesome name="github-square" size={32} color="white" style={styles.socialIcon} />
              </TouchableOpacity>
            ) : null}

            {profile.twitter ? (
              <TouchableOpacity onPress={() => openLink(`https://twitter.com/${profile.twitter}`)}>
                <FontAwesome name="twitter-square" size={32} color="#1DA1F2" style={styles.socialIcon} />
              </TouchableOpacity>
            ) : null}

            {profile.instagram ? (
              <TouchableOpacity onPress={() => openLink(`https://instagram.com/${profile.instagram}`)}>
                <FontAwesome name="instagram" size={32} color="#E1306C" style={styles.socialIcon} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.divider} />

          {/* CONNECTION METADATA */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.infoText}>
              Met on {new Date(connection.created_at || connection.met_at).toDateString()}
            </Text>
          </View>
          
          {connection.location_lat && (
             <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.secondary} />
              <Text style={styles.infoText}>
                Lat: {connection.location_lat.toFixed(4)}, Long: {connection.location_long.toFixed(4)}
              </Text>
            </View>
          )}

          {/* THEIR QR (Social Proxy) */}
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>SHARE CONTACT</Text>
            <View style={styles.qrBox}>
              <QRCode
                value={`knect://user/${connection.connected_to_id}`}
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
  
  card: { width: width * 0.9, backgroundColor: COLORS.surface, borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  
  avatarContainer: { marginBottom: 20, shadowColor: COLORS.secondary, shadowOpacity: 0.5, shadowRadius: 15 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: COLORS.secondary },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.secondary },
  avatarInitials: { fontSize: 50, color: 'white', fontWeight: 'bold' },
  
  name: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  role: { color: COLORS.secondary, fontSize: 18, textAlign: 'center', marginBottom: 10 },
  
  // New Social Styles
  socialContainer: { flexDirection: 'row', gap: 25, marginTop: 15, marginBottom: 5 },
  socialIcon: { opacity: 0.9 },

  divider: { width: '100%', height: 1, backgroundColor: '#333', marginVertical: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, width: '100%' },
  infoText: { color: COLORS.textDim, marginLeft: 10, fontSize: 14 },
  
  qrSection: { marginTop: 20, alignItems: 'center', width: '100%' },
  qrLabel: { color: COLORS.textDim, fontSize: 12, marginBottom: 15, letterSpacing: 2 },
  qrBox: { padding: 15, backgroundColor: 'white', borderRadius: 20 },
});