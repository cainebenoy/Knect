import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Dimensions, ActivityIndicator, 
  TouchableOpacity, TextInput, Alert, Image, ScrollView 
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker'; 
import { decode } from 'base64-arraybuffer';      
import { Ionicons, FontAwesome } from '@expo/vector-icons'; // Added FontAwesome
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';
import { useKnect } from '../context/KnectContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { profile, user, refreshAllData, loading } = useKnect();
  
  // Local state to show image instantly
  const [localAvatarUri, setLocalAvatarUri] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Consolidated Form Data State
  const [formData, setFormData] = useState({
    full_name: '',
    job_title: '',
    linkedin: '',
    github: '',
    twitter: '',
    instagram: ''
  });

  // Sync state with database profile when it loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        job_title: profile.job_title || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        twitter: profile.twitter || '',
        instagram: profile.instagram || ''
      });
    }
  }, [profile]);

  // --- 1. Pick Image (Your Stable Version) ---
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "We need access to your photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, 
      });

      if (!result.canceled) {
        setLocalAvatarUri(result.assets[0].uri);
        uploadAvatar(result.assets[0].base64);
      }
    } catch (error) {
      console.error("PICKER ERROR:", error);
      Alert.alert("Error Opening Gallery", error.message);
    }
  };

  // --- 2. Upload to Supabase (Your Stable Version) ---
  const uploadAvatar = async (base64File) => {
    try {
      setUploading(true);
      const filePath = `${user.id}/avatar.png`; 
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64File), {
          contentType: 'image/png',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      Alert.alert("Success", "Avatar updated!");
      refreshAllData();

    } catch (error) {
      console.log("UPLOAD ERROR:", error);
      Alert.alert("Upload Failed", error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 3. Update Text Details (Now includes Socials) ---
  async function updateProfile() {
    try {
      const updates = {
        id: user.id,
        full_name: formData.full_name,
        job_title: formData.job_title,
        linkedin: formData.linkedin,
        github: formData.github,
        twitter: formData.twitter,
        instagram: formData.instagram,
        updated_at: new Date(),
      };

      let { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      
      setIsEditing(false);
      Alert.alert("Success", "Profile updated!");
      refreshAllData();
      
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  if (loading && !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>KNECT PASS</Text>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {!isEditing ? (
            <>
              {/* VIEW MODE */}
              <View style={styles.avatarContainer}>
                {localAvatarUri || profile?.avatar_url ? (
                  <Image 
                    key={localAvatarUri || profile?.avatar_url} 
                    source={{ uri: localAvatarUri || profile?.avatar_url }} 
                    style={styles.avatarImage} 
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {profile?.full_name ? profile.full_name[0] : '?'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.qrContainer}>
                {user && (
                  <QRCode
                    value={`knect://user/${user.id}`} 
                    size={120}
                    color={COLORS.background}
                    backgroundColor="white"
                  />
                )}
              </View>

              <Text style={styles.name}>{profile?.full_name || 'Set Name'}</Text>
              <Text style={styles.role}>{profile?.job_title || 'Set Title'}</Text>
              
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.form}>
              {/* EDIT MODE */}
              <TouchableOpacity onPress={pickImage} style={styles.avatarEditWrapper}>
                 {uploading ? (
                   <ActivityIndicator color={COLORS.primary} />
                 ) : localAvatarUri || profile?.avatar_url ? (
                   <Image 
                      source={{ uri: localAvatarUri || profile?.avatar_url }} 
                      style={styles.avatarEditImage} 
                   />
                 ) : (
                   <View style={styles.avatarEditPlaceholder}>
                      <Ionicons name="camera" size={30} color={COLORS.textDim} />
                   </View>
                 )}
                 <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input}
                value={formData.full_name}
                onChangeText={(text) => setFormData({...formData, full_name: text})}
                placeholder="Enter your name"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>Job Title / Role</Text>
              <TextInput 
                style={styles.input}
                value={formData.job_title}
                onChangeText={(text) => setFormData({...formData, job_title: text})}
                placeholder="Enter title"
                placeholderTextColor="#666"
              />

              {/* SOCIAL LINKS SECTION */}
              <Text style={styles.sectionHeader}>SOCIAL LINKS (Usernames)</Text>
              
              <View style={styles.socialRow}>
                <FontAwesome name="linkedin-square" size={24} color="#0077B5" style={styles.socialIcon} />
                <TextInput 
                  style={styles.socialInput} 
                  value={formData.linkedin} 
                  onChangeText={(text) => setFormData({...formData, linkedin: text})} 
                  placeholder="linkedin_user" 
                  placeholderTextColor={COLORS.textDim} 
                  autoCapitalize="none" 
                />
              </View>

              <View style={styles.socialRow}>
                <FontAwesome name="github-square" size={24} color="white" style={styles.socialIcon} />
                <TextInput 
                  style={styles.socialInput} 
                  value={formData.github} 
                  onChangeText={(text) => setFormData({...formData, github: text})} 
                  placeholder="github_handle" 
                  placeholderTextColor={COLORS.textDim} 
                  autoCapitalize="none" 
                />
              </View>

              <View style={styles.socialRow}>
                <FontAwesome name="twitter-square" size={24} color="#1DA1F2" style={styles.socialIcon} />
                <TextInput 
                  style={styles.socialInput} 
                  value={formData.twitter} 
                  onChangeText={(text) => setFormData({...formData, twitter: text})} 
                  placeholder="twitter_handle" 
                  placeholderTextColor={COLORS.textDim} 
                  autoCapitalize="none" 
                />
              </View>

              <View style={styles.socialRow}>
                <FontAwesome name="instagram" size={24} color="#E1306C" style={styles.socialIcon} />
                <TextInput 
                  style={styles.socialInput} 
                  value={formData.instagram} 
                  onChangeText={(text) => setFormData({...formData, instagram: text})} 
                  placeholder="insta_handle" 
                  placeholderTextColor={COLORS.textDim} 
                  autoCapitalize="none" 
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={updateProfile}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 60, paddingHorizontal: 20 },
  header: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center', marginBottom: 30 },
  scrollContent: { alignItems: 'center', paddingBottom: 50 },
  
  card: { width: width * 0.9, backgroundColor: COLORS.surface, borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  
  avatarContainer: { marginBottom: 20, shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 10 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: COLORS.primary },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
  avatarInitials: { fontSize: 40, color: 'white', fontWeight: 'bold' },

  avatarEditWrapper: { alignItems: 'center', marginBottom: 20 },
  avatarEditImage: { width: 80, height: 80, borderRadius: 40, opacity: 0.7 },
  avatarEditPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  changePhotoText: { color: COLORS.primary, marginTop: 5, fontSize: 12 },

  qrContainer: { padding: 10, backgroundColor: 'white', borderRadius: 10, marginBottom: 15 },
  name: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  role: { color: COLORS.secondary, fontSize: 14, marginTop: 5, textAlign: 'center' },
  
  editButton: { marginTop: 20, padding: 10 },
  editButtonText: { color: COLORS.primary, fontWeight: 'bold' },
  form: { width: '100%' },
  
  label: { color: COLORS.secondary, fontSize: 12, marginBottom: 8, letterSpacing: 1, fontWeight: 'bold' },
  sectionHeader: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 15, letterSpacing: 1 },
  
  input: { backgroundColor: '#111', color: 'white', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  
  // Social Styles
  socialRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  socialIcon: { width: 30, marginRight: 10, textAlign: 'center' },
  socialInput: { flex: 1, backgroundColor: '#111', color: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333' },

  saveButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  cancelText: { color: COLORS.textDim, textAlign: 'center', marginTop: 15 },
  signOutButton: { marginTop: 40 },
  signOutText: { color: '#FF4444', fontSize: 14 }
});