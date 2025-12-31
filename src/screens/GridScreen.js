import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { useKnect } from '../context/KnectContext'; 
import { COLORS } from '../constants/theme';
import { DARK_MAP_STYLE } from '../constants/mapStyle';

// Default view (if GPS is still thinking)
const INITIAL_REGION = {
  latitude: 20.5937, // Center of India (or anywhere)
  longitude: 78.9629,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

export default function GridScreen() {
  const { connections, location, refreshAllData } = useKnect();

  useFocusEffect(
    useCallback(() => {
      refreshAllData();
    }, [])
  );

  // LOGIC CHANGE: 
  // We removed the "if (loading) return <ActivityIndicator />" block.
  // Now we render the map ALWAYS. 
  
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        customMapStyle={DARK_MAP_STYLE}
        // If we have a location, use it. If not, use the fallback.
        region={location || INITIAL_REGION} 
        showsUserLocation={true}
        showsMyLocationButton={true}
        // This ensures markers don't flicker
        moveOnMarkerPress={false}
      >
        {connections.map((connection) => {
          if (!connection.location_lat) return null;
          
          return (
            <Marker
              key={connection.id}
              coordinate={{
                latitude: connection.location_lat,
                longitude: connection.location_long,
              }}
              title={connection.profiles?.full_name || 'Unknown'}
              description={connection.profiles?.job_title || 'No Title'}
              pinColor={COLORS.secondary}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
});