import React, { useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../stores/useAuthStore';
import { getAllPlaces, calculateDistance } from '../../services/firestoreService';
import {
  getRecommendedPlaces, getPopularPlaces, getNearbyFromAll,
} from '../../services/recommendationService';
import PlaceCard from '../../components/cards/PlaceCard';
import useLocation from '../../hooks/useLocation';
import { COLORS, SIZES, CATEGORIES } from '../../config/constants';

const CARD_WIDTH = 200;

const CAT_ICONS = {
  attractions: '🏛️', food: '🍜', activities: '🧗', shopping: '🛍️',
  nature: '🌿', culture: '🎨', nightlife: '🌙',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SectionHeader({ title, onSeeAll }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function HPlaceList({ places, onPress, location }) {
  if (!places.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.hList}
    >
      {places.map((place) => {
        const dist =
          location && place.location
            ? calculateDistance(
                location.latitude, location.longitude,
                place.location.latitude, place.location.longitude
              )
            : null;
        return (
          <PlaceCard
            key={place.id}
            place={place}
            distance={dist}
            onPress={() => onPress(place)}
            style={styles.hCard}
          />
        );
      })}
    </ScrollView>
  );
}

export default function HomeScreen({ navigation }) {
  const { userProfile } = useAuthStore();
  const { location, requestLocation } = useLocation();

  useEffect(() => { requestLocation(); }, []);

  const { data: allPlaces = [] } = useQuery({
    queryKey: ['all-places'],
    queryFn: getAllPlaces,
    staleTime: 5 * 60 * 1000,
  });

  const recommended = getRecommendedPlaces(allPlaces, userProfile?.interests || []);
  const popular = getPopularPlaces(allPlaces);
  const nearby = getNearbyFromAll(allPlaces, location);

  const goToPlace = (place) =>
    navigation.navigate('PlaceDetail', { placeId: place.id, placeName: place.name });
  const goToDiscover = () => navigation.navigate('Discover');

  const firstName = userProfile?.displayName?.split(' ')[0] || 'Explorer';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SIZES.xxl }}>

        {/* ── Hero ── */}
        <LinearGradient colors={['#1565C0', '#4A90D9', '#64B5F6']} style={styles.hero}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{firstName} 👋</Text>
          <Text style={styles.heroSub}>Where do you want to go today?</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.9}
            style={styles.searchBox}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search places, food, attractions...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Category quick links ── */}
        <View style={styles.catRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.catItem} onPress={goToDiscover}>
              <View style={styles.catIcon}>
                <Text style={{ fontSize: 22 }}>{CAT_ICONS[cat.id] || '📍'}</Text>
              </View>
              <Text style={styles.catLabel} numberOfLines={1}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── For You ── */}
        {recommended.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="✨ For You" onSeeAll={goToDiscover} />
            <HPlaceList places={recommended} onPress={goToPlace} location={location} />
          </View>
        )}

        {/* ── Nearby ── */}
        {nearby.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="📍 Nearby" onSeeAll={goToDiscover} />
            <HPlaceList places={nearby} onPress={goToPlace} location={location} />
          </View>
        )}

        {/* ── Popular ── */}
        {popular.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="🔥 Popular" onSeeAll={goToDiscover} />
            <HPlaceList places={popular} onPress={goToPlace} location={location} />
          </View>
        )}

        {/* ── Empty state (no data yet) ── */}
        {!allPlaces.length && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>🌏</Text>
            <Text style={styles.emptyText}>No places yet.</Text>
            <Text style={styles.emptyHint}>Go to Admin Dashboard to seed sample data.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  hero: { padding: SIZES.lg, paddingTop: SIZES.md, paddingBottom: SIZES.xl },
  greeting: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  userName: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: SIZES.xs },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: SIZES.md },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 12, gap: SIZES.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { color: COLORS.textSecondary, fontSize: 14, flex: 1 },

  catRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: SIZES.sm, paddingVertical: SIZES.md,
    backgroundColor: '#fff', marginBottom: SIZES.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  catItem: { alignItems: 'center', gap: 4, flex: 1 },
  catIcon: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: '#EBF4FF',
    justifyContent: 'center', alignItems: 'center',
  },
  catLabel: { fontSize: 10, color: COLORS.text, fontWeight: '600', textAlign: 'center' },

  section: { marginBottom: SIZES.xs },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  hList: { paddingHorizontal: SIZES.md, paddingBottom: SIZES.sm, gap: SIZES.sm },
  hCard: { width: CARD_WIDTH, flexShrink: 0 },

  emptyState: { alignItems: 'center', paddingTop: SIZES.xxl, gap: SIZES.sm },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SIZES.xl },
});
