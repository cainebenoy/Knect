import React, { useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics'; // Import Haptics
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("Position QR code inside the box");

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera access to Knect.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- ROBUST LOCATION HELPER ---
  // Prioritizes getting a location to ensure the map feature works.
  const getLocationSafe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Location Required", "Please enable location to tag where you met.");
        return { lat: null, long: null };
      }

      // 1. Get "Last Known" location immediately as a reliable backup
      // This ensures we have data even if the fresh GPS signal is weak indoors.
      let backupLocation = null;
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          backupLocation = { lat: lastKnown.coords.latitude, long: lastKnown.coords.longitude };
        }
      } catch (e) {
        console.log("Backup location fetch failed:", e);
      }

      // 2. Attempt to get "Fresh" precise location
      // We allow 5 seconds for this. If it takes longer, we use the backup.
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
      const locationRequest = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const result = await Promise.race([locationRequest, timeout]);
      
      if (result) {
        // Success: We got a fresh location
        return { lat: result.coords.latitude, long: result.coords.longitude };
      } else if (backupLocation) {
        // Timeout: But we have the backup, so we use that!
        console.log("GPS timed out, using last known location.");
        return backupLocation;
      }
      
      // Worst case: No fresh GPS and no backup available.
      return { lat: null, long: null };
    } catch (e) {
      console.log("GPS Critical Error:", e);
      return { lat: null, long: null };
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    
    // Vibrate instantly
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setScanned(true);
    setLoading(true);
    setStatusText("Verifying...");

    if (!data.startsWith('knect://user/')) {
      Alert.alert("Invalid QR", "This is not a Knect Pass.", [
        { text: "OK", onPress: () => resetScanner() }
      ]);
      setLoading(false);
      return;
    }

    const scannedUserId = data.replace('knect://user/', '');

    try {
      // 1. Auth Check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in again.");
      
      const myId = user.id;

      if (scannedUserId === myId) {
        Alert.alert("Hold up", "You can't connect with yourself.", [
          { text: "OK", onPress: () => resetScanner() }
        ]);
        setLoading(false);
        return;
      }

      // 2. Fetch Profile (Check if user exists)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', scannedUserId)
        .single();

      if (profileError || !profile) {
        throw new Error("User profile not found.");
      }

      // 3. Get Location (Robust Mode)
      setStatusText("Acquiring GPS Coordinates...");
      const loc = await getLocationSafe();

      // 4. Mutual Database Insert
      setStatusText("Knecting...");
      
      const mutualConnections = [
        {
          connector_id: myId,            
          connected_to_id: scannedUserId, 
          location_lat: loc.lat,
          location_long: loc.long,
          created_at: new Date()
        },
        {
          connector_id: scannedUserId,   
          connected_to_id: myId,         
          location_lat: loc.lat,
          location_long: loc.long,
          created_at: new Date()
        }
      ];

      const { error } = await supabase
        .from('connections')
        .upsert(mutualConnections, { onConflict: 'connector_id, connected_to_id' });

      if (error) {
        throw new Error("DB Error: " + error.message);
      }

      // 5. Success
      Alert.alert(
        "Mutually Connected!",
        `You are now linked with ${profile.full_name}.`,
        [{ text: "Awesome", onPress: () => resetScanner() }]
      );

    } catch (err) {
      Alert.alert("Connection Failed", String(err.message), [
        { text: "OK", onPress: () => resetScanner() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setStatusText("Position QR code inside the box");
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanWindow} />
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{statusText}</Text>
          </View>
        ) : (
          <Text style={styles.scanText}>{statusText}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center' },
  message: { color: 'white', textAlign: 'center', marginBottom: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  scanWindow: { width: 260, height: 260, borderWidth: 2, borderColor: COLORS.secondary, borderRadius: 20, backgroundColor: 'transparent' },
  scanText: { color: 'white', marginTop: 20, letterSpacing: 1, fontSize: 14, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 5, overflow: 'hidden' },
  button: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignSelf: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  loadingContainer: { marginTop: 20, alignItems: 'center' },
  loadingText: { color: COLORS.primary, fontWeight: 'bold', marginTop: 10, letterSpacing: 2 }
});