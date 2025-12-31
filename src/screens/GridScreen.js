import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, Image, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { useKnect } from '../context/KnectContext'; 
import { COLORS } from '../constants/theme';
import { DARK_MAP_STYLE } from '../constants/mapStyle';

const INITIAL_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

const KnectMarker = ({ connection }) => {
  // Logic to stop "watching" the view once the image loads
  // This saves battery and improves map performance
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Marker
      coordinate={{
        latitude: connection.location_lat,
        longitude: connection.location_long,
      }}
      title={connection.profiles?.full_name || 'Unknown'}
      description={connection.profiles?.job_title || 'No Title'}
      tracksViewChanges={!imageLoaded} // Only track until image is ready
      anchor={{ x: 0.5, y: 1 }} // Centers the pin bottom on the location
    >
      <View style={styles.chipContainer}>
        {/* THE SQUARE "DATA CHIP" */}
        <View style={styles.chipFrame}>
          {connection.profiles?.avatar_url ? (
            <Image 
              source={{ uri: connection.profiles.avatar_url }} 
              style={styles.chipImage}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => console.log("Image Load Error", e.nativeEvent.error)}
            />
          ) : (
            <View style={[styles.chipImage, styles.chipPlaceholder]}>
              <Text style={styles.chipInitials}>
                {connection.profiles?.full_name ? connection.profiles.full_name[0] : '?'}
              </Text>
            </View>
          )}
        </View>
        
        {/* THE POINTER TRIANGLE */}
        <View style={styles.arrow} />
      </View>
    </Marker>
  );
};

export default function GridScreen() {
  const { connections, location, refreshAllData } = useKnect();

  useFocusEffect(
    useCallback(() => {
      refreshAllData();
    }, [])
  );
  
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        customMapStyle={DARK_MAP_STYLE}
        region={location || INITIAL_REGION} 
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {connections.map((connection) => {
          if (!connection.location_lat) return null;
          return <KnectMarker key={connection.id} connection={connection} />;
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  
  chipContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5, // Space for the arrow
  },

  chipFrame: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.secondary, // Cyan Border
    padding: 2, // Thickness of the border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  chipImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },

  chipPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipInitials: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.secondary,
    marginTop: -1, // Connects perfectly to the square
  }
});