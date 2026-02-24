// Web fallback - react-native-maps is not supported on web
// On native, MapExploreScreen.native.js is used automatically
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getAllPlaces } from '../../services/firestoreService';
import { COLORS, SIZES } from '../../config/constants';

const CATEGORY_COLORS = {
  attractions: '#E53935',
  food: '#FB8C00',
  shopping: '#8E24AA',
  nature: '#43A047',
  culture: '#1E88E5',
  nightlife: '#6D4C41',
  activities: '#00ACC1',
};

const CATEGORY_ICONS = {
  attractions: '🏛️',
  food: '🍜',
  shopping: '🛍️',
  nature: '🌿',
  culture: '🎨',
  nightlife: '🌙',
  activities: '🧗',
};

const CITIES = ['All Cities', 'Ho Chi Minh City', 'Da Nang', 'Ha Noi'];

export default function MapExploreScreen({ navigation }) {
  const [selectedCity, setSelectedCity] = useState('All Cities');

  const { data: allPlaces = [], isLoading } = useQuery({
    queryKey: ['all-places'],
    queryFn: getAllPlaces,
    staleTime: 10 * 60 * 1000,
  });

  const places = selectedCity === 'All Cities'
    ? allPlaces
    : allPlaces.filter((p) => p.city === selectedCity);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore Places</Text>
        <Text style={styles.subtitle}>{places.length} locations found</Text>
      </View>

      {/* City filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cityRow}
        style={styles.cityScroll}
      >
        {CITIES.map((city) => {
          const active = selectedCity === city;
          return (
            <TouchableOpacity
              key={city}
              onPress={() => setSelectedCity(city)}
              style={[styles.cityChip, active && styles.cityChipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                {city}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Place list */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading places...</Text>
        ) : places.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyText}>No places found</Text>
          </View>
        ) : (
          places.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.item}
              onPress={() => navigation.navigate('PlaceDetail', { placeId: p.id, placeName: p.name })}
              activeOpacity={0.8}
            >
              <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[p.category] || COLORS.primary }]}>
                <Text style={styles.categoryIcon}>{CATEGORY_ICONS[p.category] || '📍'}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.itemSub}>{p.city} · {p.category}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>⭐</Text>
                  <Text style={styles.rating}>{p.averageRating?.toFixed(1) || '—'}</Text>
                  <Text style={styles.reviewCount}>({p.reviewCount || 0})</Text>
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.xs,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  cityScroll: {
    flexShrink: 0,
    flexGrow: 0,
    height: 50,
  },
  cityRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    alignItems: 'center',
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8EAED',
    marginRight: SIZES.sm,
    flexShrink: 0,
  },
  cityChipActive: {
    backgroundColor: COLORS.primary,
  },
  cityChipText: { fontSize: 13, fontWeight: '500', color: '#444' },
  cityChipTextActive: { color: '#fff', fontWeight: '700' },

  listContainer: { paddingHorizontal: SIZES.md, paddingBottom: SIZES.xl },
  loadingText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SIZES.xl },

  emptyState: { alignItems: 'center', paddingTop: SIZES.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SIZES.md },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    backgroundColor: '#fff',
    marginBottom: SIZES.sm,
    borderRadius: 14,
    padding: SIZES.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  itemSub: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize', marginTop: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  star: { fontSize: 11 },
  rating: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  reviewCount: { fontSize: 11, color: COLORS.textSecondary },
  arrow: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
});
