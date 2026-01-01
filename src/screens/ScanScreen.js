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
    setStatusText("Debug Mode Active...");

    // DEBUG 1: QR Read
    // Alert.alert("Debug 1", "QR Read: " + data); // Uncomment if needed

    if (!data.startsWith('knect://user/')) {
      Alert.alert("Error", "Invalid QR Format");
      setLoading(false);
      return;
    }

    const scannedUserId = data.replace('knect://user/', '');

    try {
      // DEBUG 2: Auth Check
      // Alert.alert("Debug 2", "Checking Auth...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User is not logged in!");
      }
      
      const myId = user.id;
      // Alert.alert("Debug 3", "My ID: " + myId);

      if (scannedUserId === myId) {
        Alert.alert("Stop", "You scanned yourself.");
        setLoading(false);
        return;
      }

      // DEBUG 4: Profile Fetch
      // Alert.alert("Debug 4", "Fetching Profile...");
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', scannedUserId)
        .single();

      if (profileError) {
        throw new Error("Profile Fetch Error: " + profileError.message);
      }
      
      // Alert.alert("Debug 5", "Found User: " + profile.full_name);

      // DEBUG 6: Location (The most common point of failure)
      setStatusText("Waiting for GPS...");
      // Alert.alert("Debug 6", "Requesting Location...");
      
      let lat = null;
      let long = null;
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Alert.alert("Debug 7", "GPS Permission Granted. Getting Coords...");
          
          // We use a simplified location call to see if this is the blocker
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, 
          });
          
          lat = loc.coords.latitude;
          long = loc.coords.longitude;
          // Alert.alert("Debug 8", "Got Location: " + lat);
        } else {
          // Alert.alert("Debug 7", "GPS Permission Denied");
        }
      } catch (locErr) {
        Alert.alert("Debug GPS Fail", "GPS Failed: " + locErr.message);
        // Continue anyway without location
      }

      // DEBUG 9: Database Insert
      setStatusText("Saving to Database...");
      // Alert.alert("Debug 9", "Preparing Database Insert...");

      const mutualConnections = [
        {
          connector_id: myId,            
          connected_to_id: scannedUserId, 
          location_lat: lat,
          location_long: long,
          created_at: new Date()
        },
        {
          connector_id: scannedUserId,   
          connected_to_id: myId,         
          location_lat: lat,
          location_long: long,
          created_at: new Date()
        }
      ];

      const { error } = await supabase
        .from('connections')
        .upsert(mutualConnections, { onConflict: 'connector_id, connected_to_id' });

      if (error) {
        // THIS IS THE GOLD MINE - The exact database error
        throw new Error("DB Error: " + error.message + " | Code: " + error.code);
      }

      // Success
      Alert.alert(
        "Success!",
        `Connected with ${profile.full_name}`,
        [{ text: "OK", onPress: () => resetScanner() }]
      );

    } catch (err) {
      // CATCH-ALL ERROR DISPLAY
      Alert.alert("CRITICAL ERROR", String(err.message), [
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