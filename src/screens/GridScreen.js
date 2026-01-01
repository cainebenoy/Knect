import React, { useRef, useCallback, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Image, 
  Text, 
  TouchableOpacity 
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useKnect } from '../context/KnectContext';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

// Custom Dark Map Style to match Knect's UI
const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#121212" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#121212" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#333333" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#6C63FF" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1f1f1f" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const KnectMarker = ({ connection, navigation }) => {
  // Logic to stop "watching" the view once the image loads
  // This saves battery and improves map performance significantly
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Marker
      coordinate={{
        latitude: connection.location_lat,
        longitude: connection.location_long,
      }}
      tracksViewChanges={!imageLoaded} // Only track until image is ready
      anchor={{ x: 0.5, y: 1 }}
    >
      {/* Custom Chip Marker */}
      <View style={styles.markerContainer}>
        <View style={styles.markerEdge}>
          {connection.profiles?.avatar_url ? (
            <Image 
              source={{ uri: connection.profiles.avatar_url }} 
              style={styles.markerImage} 
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <View style={styles.markerPlaceholder}>
              <Text style={styles.markerInitial}>
                {connection.profiles?.full_name ? connection.profiles.full_name[0] : '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.markerPointer} />
      </View>

      {/* Popup Info when tapped */}
      <Callout 
        tooltip 
        onPress={() => navigation.navigate('ConnectionDetail', { connection: connection })}
      >
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutName}>{connection.profiles?.full_name}</Text>
          <Text style={styles.calloutDate}>
            Met here on {new Date(connection.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.calloutLink}>View Profile</Text>
        </View>
      </Callout>
    </Marker>
  );
};

export default function GridScreen({ navigation }) {
  const { connections, location, refreshAllData } = useKnect();
  const mapRef = useRef(null);

  // Refresh data whenever the user navigates back to this tab
  useFocusEffect(
    useCallback(() => {
      refreshAllData();
    }, [])
  );

  // Center map on user's current location
  const centerOnMe = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={mapStyle}
        initialRegion={location || INITIAL_REGION}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {connections.map((item) => {
          // Only show markers that have valid coordinates
          if (!item.location_lat || !item.location_long) return null;

          return (
            <KnectMarker 
              key={item.id} 
              connection={item} 
              navigation={navigation} 
            />
          );
        })}
      </MapView>

      {/* UI OVERLAYS */}
      <View style={styles.headerOverlay}>
        <Text style={styles.headerText}>SPATIAL RADAR</Text>
      </View>

      <TouchableOpacity style={styles.myLocationButton} onPress={centerOnMe}>
        <Ionicons name="navigate" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { width: width, height: height },
  
  headerOverlay: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  headerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },

  // Custom Marker Styling
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 60,
  },
  markerEdge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.surface,
    padding: 2,
    overflow: 'hidden',
  },
  markerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  markerPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInitial: { color: 'white', fontWeight: 'bold' },
  markerPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.secondary,
    marginTop: -1,
  },

  // Callout (Popup) Styling
  calloutContainer: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444',
    width: 200,
    alignItems: 'center',
  },
  calloutName: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  calloutDate: { color: COLORS.textDim, fontSize: 12, marginBottom: 8 },
  calloutLink: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },

  myLocationButton: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  }
});