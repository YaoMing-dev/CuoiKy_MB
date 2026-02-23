import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Text, Searchbar, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getPlaces, calculateDistance } from '../../services/firestoreService';
import PlaceCard from '../../components/cards/PlaceCard';
import InfiniteList from '../../components/common/InfiniteList';
import useLocation from '../../hooks/useLocation';
import { COLORS, SIZES, CATEGORIES } from '../../config/constants';

const ALL_CATS = [{ id: 'all', label: 'All' }, ...CATEGORIES];

export default function DiscoverScreen({ navigation }) {
  const [selectedCat, setSelectedCat] = useState('all');
  const { location, requestLocation } = useLocation();

  useEffect(() => { requestLocation(); }, []);

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, isError, refetch, isRefetching,
  } = useInfiniteQuery({
    queryKey: ['places', selectedCat],
    queryFn: ({ pageParam }) => getPlaces(selectedCat === 'all' ? null : selectedCat, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
    initialPageParam: null,
    staleTime: 5 * 60 * 1000,
  });

  const places = data?.pages.flatMap((p) => p.places) ?? [];

  const getDistance = (place) => {
    if (!location || !place.location) return null;
    return calculateDistance(location.latitude, location.longitude, place.location.latitude, place.location.longitude);
  };

  const renderPlace = ({ item, index }) => (
    <View style={styles.cardWrap}>
      <PlaceCard
        place={item}
        distance={getDistance(item)}
        onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id, placeName: item.name })}
      />
    </View>
  );

  if (isError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.errorText}>Failed to load places.</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MapExplore')} style={styles.mapBtn}>
          <Text style={styles.mapBtnText}>🗺️ Map</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar (navigates to SearchScreen) */}
      <TouchableOpacity onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
        <View style={styles.searchBarWrap} pointerEvents="none">
          <Searchbar
            placeholder="Search places, food, attractions..."
            editable={false}
            style={styles.searchBar}
            inputStyle={{ color: COLORS.textSecondary }}
          />
        </View>
      </TouchableOpacity>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {ALL_CATS.map((cat) => (
          <Chip
            key={cat.id}
            selected={selectedCat === cat.id}
            onPress={() => setSelectedCat(cat.id)}
            style={[styles.chip, selectedCat === cat.id && styles.chipActive]}
            textStyle={[styles.chipText, selectedCat === cat.id && styles.chipTextActive]}
            showSelectedCheck={false}
          >
            {cat.label}
          </Chip>
        ))}
      </ScrollView>

      {/* Results count */}
      {!isLoading && (
        <Text style={styles.resultsCount}>{places.length} places found</Text>
      )}

      {/* Place grid */}
      <InfiniteList
        data={places}
        renderItem={renderPlace}
        keyExtractor={(item) => item.id}
        numColumns={2}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={refetch}
        emptyIcon="🏖️"
        emptyText="No places found. Seed data first!"
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    paddingBottom: 4,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  mapBtn: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  searchBarWrap: { marginHorizontal: SIZES.md, marginBottom: SIZES.sm },
  searchBar: { borderRadius: 12, elevation: 0, backgroundColor: '#fff', height: 44 },
  chipScroll: { maxHeight: 48 },
  chipRow: { paddingHorizontal: SIZES.md, gap: SIZES.sm, alignItems: 'center' },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 12 },
  chipTextActive: { color: '#fff' },
  resultsCount: {
    paddingHorizontal: SIZES.md,
    paddingVertical: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  grid: { paddingHorizontal: SIZES.sm },
  columnWrapper: { gap: SIZES.sm, marginBottom: SIZES.sm },
  cardWrap: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 12 },
  retryBtn: { padding: 12 },
});
