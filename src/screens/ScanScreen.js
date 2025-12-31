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

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);
    setStatusText("Establishing Mutual Link...");

    // 1. Validate QR Format
    if (!data.startsWith('knect://user/')) {
      Alert.alert("Invalid QR", "This is not a Knect Pass.", [
        { text: "OK", onPress: () => resetScanner() }
      ]);
      setLoading(false);
      return;
    }

    const scannedUserId = data.replace('knect://user/', '');

    try {
      // 2. Get My User ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No session found");

      const myId = user.id;

      // 3. Prevent Self-Scan
      if (scannedId === myId) {
        Alert.alert("Glitch in the Matrix", "You can't knect with yourself.", [
          { text: "OK", onPress: () => resetScanner() }
        ]);
        setLoading(false);
        return;
      }

      // 4. Fetch Profile (to show name in success message)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', scannedId)
        .single();

      if (!profile) {
        Alert.alert("User Not Found", "This profile doesn't exist.", [
          { text: "OK", onPress: () => resetScanner() }
        ]);
        setLoading(false);
        return;
      }

      // 5. Get Location (For the meeting point)
      let lat = null;
      let long = null;
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        long = loc.coords.longitude;
      }

      // 6. THE MUTUAL CONNECTION MAGIC
      // We create an array of TWO connections to insert at once.
      const mutualConnections = [
        {
          connector_id: myId,            // Me
          connected_to_id: scannedUserId, // You
          location_lat: lat,
          location_long: long,
          created_at: new Date()
        },
        {
          connector_id: scannedUserId,   // You
          connected_to_id: myId,         // Me (The Mirror)
          location_lat: lat,
          location_long: long,
          created_at: new Date()
        }
      ];

      // 7. Perform the Insert (Upsert prevents duplicates)
      const { error } = await supabase
        .from('connections')
        .upsert(mutualConnections, { onConflict: 'connector_id, connected_to_id' });

      if (error) throw error;

      // 8. Success!
      Alert.alert(
        "Mutually Connected!",
        `You and ${profile.full_name} are now linked.`,
        [{ text: "Awesome", onPress: () => resetScanner() }]
      );

    } catch (err) {
      console.log(err);
      Alert.alert("Connection Failed", "Could not save the connection. Check internet.", [
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
            <Text style={styles.loadingText}>SYNCING...</Text>
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