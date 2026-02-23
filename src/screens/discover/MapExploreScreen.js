// Web fallback - react-native-maps is not supported on web
// On native, MapExploreScreen.native.js is used automatically
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getAllPlaces } from '../../services/firestoreService';
import { COLORS, SIZES } from '../../config/constants';

const CATEGORY_COLORS = {
  attractions: '#E53935', food: '#FB8C00', shopping: '#8E24AA',
  nature: '#43A047', culture: '#1E88E5', nightlife: '#6D4C41', activities: '#00ACC1',
};

export default function MapExploreScreen({ navigation }) {
  const { data: places = [] } = useQuery({
    queryKey: ['all-places'],
    queryFn: getAllPlaces,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>🗺️ Map view is available on Expo Go (mobile only)</Text>
      </View>
      <Text style={styles.listTitle}>{places.length} Places</Text>
      {places.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={styles.item}
          onPress={() => navigation.navigate('PlaceDetail', { placeId: p.id, placeName: p.name })}
        >
          <View style={[styles.dot, { backgroundColor: CATEGORY_COLORS[p.category] || COLORS.primary }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{p.name}</Text>
            <Text style={styles.itemSub}>{p.city} · {p.category}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  banner: { backgroundColor: '#FFF3CD', padding: SIZES.md, margin: SIZES.md, borderRadius: 10 },
  bannerText: { color: '#856404', fontSize: 13, textAlign: 'center' },
  listTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, paddingHorizontal: SIZES.md, marginBottom: SIZES.sm },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    backgroundColor: '#fff', marginHorizontal: SIZES.md, marginBottom: SIZES.sm,
    borderRadius: 10, padding: SIZES.sm, elevation: 1,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  itemSub: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  arrow: { fontSize: 20, color: COLORS.primary },
});
