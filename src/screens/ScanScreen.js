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

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [statusText, setStatusText] = useState("Position QR code inside the box");

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- BACKGROUND TASK: Get Location & Update DB ---
  const enrichConnectionWithLocation = async (connectionId) => {
    try {
      // 1. Ask for permission (usually already granted)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // 2. Get Location (Balanced Accuracy)
      // We don't care if this takes 2-3 seconds now, the user is already happy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 3. Update the specific connection row with coordinates
      const { error } = await supabase
        .from('connections')
        .update({
          location_lat: location.coords.latitude,
          location_long: location.coords.longitude
        })
        .eq('id', connectionId); // Find the row we just made

      if (error) console.log("Background Update Error:", error);
      else console.log("Background Location Update Success!");

    } catch (error) {
      console.log("Background Location Failed:", error);
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned) return;
    
    setScanned(true);
    setStatusText("Knecting...");

    if (data.startsWith('knect://user/')) {
      const scannedId = data.replace('knect://user/', '');
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (scannedId === user.id) {
          Alert.alert("That's you!", "You can't knect with yourself.", [
            { text: "OK", onPress: () => resetScanner() }
          ]);
          return;
        }

        // 1. FETCH PROFILE (Fast)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, job_title')
          .eq('id', scannedId)
          .single();

        if (profile) {
          // 2. INSERT IMMEDIATELY (No Location yet)
          // We use .select() to get the ID of the new row back
          const { data: newConnection, error } = await supabase
            .from('connections')
            .insert({
              connector_id: user.id,
              connected_to_id: scannedId,
              location_lat: null, // Placeholder
              location_long: null // Placeholder
            })
            .select()
            .single();

          if (error) {
            if (error.code === '23505') {
              Alert.alert("Already Connected", `You have already knected with ${profile.full_name}.`, [
                { text: "OK", onPress: () => resetScanner() }
              ]);
            } else {
              Alert.alert("Error", error.message, [{ text: "OK", onPress: () => resetScanner() }]);
            }
          } else {
            // 3. SUCCESS! Show UI immediately
            Alert.alert(
              "New Knect Saved!",
              `You are now connected with ${profile.full_name}.`,
              [{ text: "Awesome", onPress: () => resetScanner() }]
            );

            // 4. TRIGGER BACKGROUND PROCESS (Fire & Forget)
            // We pass the new connection ID to the background function
            if (newConnection) {
                enrichConnectionWithLocation(newConnection.id);
            }
          }
        } else {
          Alert.alert("User Not Found", "Could not find this profile.", [{ text: "OK", onPress: () => resetScanner() }]);
        }

      } catch (err) {
        Alert.alert("Error", "Something went wrong.", [{ text: "OK", onPress: () => resetScanner() }]);
      }
    } else {
      Alert.alert("Invalid QR", "This is not a Knect Pass.", [{ text: "OK", onPress: () => resetScanner() }]);
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
        <Text style={styles.scanText}>
          {statusText}
        </Text>
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
  buttonText: { color: 'white', fontWeight: 'bold' }
});