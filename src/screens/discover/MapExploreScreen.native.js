import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getAllPlaces } from '../../services/firestoreService';
import useLocation from '../../hooks/useLocation';
import { COLORS, SIZES } from '../../config/constants';

const DEFAULT_REGION = {
  latitude: 10.7769, longitude: 106.7009,
  latitudeDelta: 0.08, longitudeDelta: 0.08,
};

const CATEGORY_COLORS = {
  attractions: '#E53935', food: '#FB8C00', shopping: '#8E24AA',
  nature: '#43A047', culture: '#1E88E5', nightlife: '#6D4C41', activities: '#00ACC1',
};

export default function MapExploreScreen({ navigation }) {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);
  const { location, requestLocation } = useLocation();

  const { data: places = [], isLoading } = useQuery({
    queryKey: ['all-places'],
    queryFn: getAllPlaces,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => { requestLocation(); }, []);

  const goToMyLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({ ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500);
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.fill}>
      <MapView
        ref={mapRef}
        style={styles.fill}
        initialRegion={location ? { ...location, latitudeDelta: 0.08, longitudeDelta: 0.08 } : DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {places.map((place) =>
          place.location ? (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.location.latitude, longitude: place.location.longitude }}
              title={place.name}
              description={place.city}
              pinColor={CATEGORY_COLORS[place.category] || COLORS.primary}
              onPress={() => setSelectedPlace(place)}
            />
          ) : null
        )}
      </MapView>

      {/* My location button */}
      <SafeAreaView style={styles.controls} edges={['top']}>
        <TouchableOpacity style={styles.locationBtn} onPress={goToMyLocation}>
          <Text style={styles.locationBtnText}>📍</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Place preview */}
      {selectedPlace && (
        <View style={styles.preview}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPlace(null)}>
            <Text style={{ color: COLORS.textSecondary }}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.previewName}>{selectedPlace.name}</Text>
          <Text style={styles.previewSub}>{selectedPlace.city} · {selectedPlace.category}</Text>
          <View style={{ flexDirection: 'row', gap: SIZES.md, marginBottom: 12 }}>
            <Text style={{ color: COLORS.star, fontWeight: '700' }}>★ {(selectedPlace.averageRating || 0).toFixed(1)}</Text>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
              {selectedPlace.priceRange === 'free' ? 'Free' : selectedPlace.priceRange}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => { setSelectedPlace(null); navigation.navigate('PlaceDetail', { placeId: selectedPlace.id, placeName: selectedPlace.name }); }}
          >
            <Text style={styles.detailBtnText}>View Details →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { position: 'absolute', top: 0, right: 12 },
  locationBtn: {
    backgroundColor: '#fff', width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4, marginTop: SIZES.sm,
  },
  locationBtnText: { fontSize: 20 },
  preview: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: SIZES.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
  },
  closeBtn: { position: 'absolute', top: 12, right: 12, padding: 4 },
  previewName: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4, paddingRight: 20 },
  previewSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, textTransform: 'capitalize' },
  detailBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  detailBtnText: { color: '#fff', fontWeight: '700' },
});
