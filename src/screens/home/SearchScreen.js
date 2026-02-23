import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Keyboard } from 'react-native';
import { Text, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { getAllPlaces } from '../../services/firestoreService';
import { buildSearchIndex, searchPlaces } from '../../services/searchService';
import PlaceCard from '../../components/cards/PlaceCard';
import { COLORS, SIZES, CATEGORIES } from '../../config/constants';

const RECENT_KEY = 'exploreease_recent_searches';
const MAX_RECENT = 8;

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Load all places for Fuse.js index
  const { data: allPlaces, isLoading } = useQuery({
    queryKey: ['all-places'],
    queryFn: getAllPlaces,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (allPlaces) buildSearchIndex(allPlaces);
  }, [allPlaces]);

  // Load recent searches on mount
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((raw) => {
      if (raw) setRecentSearches(JSON.parse(raw));
    });
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  const saveRecentSearch = async (term) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const clearRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  };

  // Debounced search
  const handleQueryChange = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const res = searchPlaces(text);
      const filtered = selectedCat ? res.filter((p) => p.category === selectedCat) : res;
      setResults(filtered);
    }, 300);
  };

  const handleSubmit = () => {
    if (query.trim().length >= 2) saveRecentSearch(query.trim());
    Keyboard.dismiss();
  };

  const handleRecentTap = (term) => {
    setQuery(term);
    const res = searchPlaces(term);
    setResults(res);
  };

  const handleCatFilter = (catId) => {
    const next = selectedCat === catId ? null : catId;
    setSelectedCat(next);
    const res = searchPlaces(query);
    setResults(next ? res.filter((p) => p.category === next) : res);
  };

  const renderItem = ({ item }) => (
    <View style={styles.listCard}>
      <PlaceCard
        place={item}
        horizontal
        onPress={() => {
          saveRecentSearch(item.name);
          navigation.navigate('PlaceDetail', { placeId: item.id, placeName: item.name });
        }}
      />
    </View>
  );

  const showRecent = query.length === 0 && recentSearches.length > 0;
  const showResults = query.length >= 2;
  const showEmpty = query.length >= 2 && results.length === 0 && !isLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search bar */}
      <View style={styles.header}>
        <Searchbar
          ref={inputRef}
          placeholder="Search places, food, cities..."
          value={query}
          onChangeText={handleQueryChange}
          onSubmitEditing={handleSubmit}
          onIconPress={() => navigation.goBack()}
          icon="arrow-left"
          style={styles.searchBar}
          autoFocus
        />
      </View>

      {/* Category filter chips */}
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.id}
            selected={selectedCat === cat.id}
            onPress={() => handleCatFilter(cat.id)}
            style={[styles.chip, selectedCat === cat.id && styles.chipActive]}
            textStyle={[styles.chipText, selectedCat === cat.id && styles.chipTextActive]}
            showSelectedCheck={false}
            compact
          >
            {cat.label}
          </Chip>
        ))}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading search index...</Text>
        </View>
      )}

      {/* Recent searches */}
      {showRecent && !isLoading && (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecent}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentChips}>
            {recentSearches.map((term) => (
              <TouchableOpacity key={term} style={styles.recentChip} onPress={() => handleRecentTap(term)}>
                <Text style={styles.recentChipText}>🕐 {term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Empty prompt */}
      {query.length === 0 && recentSearches.length === 0 && !isLoading && (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={styles.promptText}>Search for places, food, or attractions</Text>
        </View>
      )}

      {/* Results count */}
      {showResults && !isLoading && (
        <Text style={styles.resultsCount}>
          {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </Text>
      )}

      {/* Empty state */}
      {showEmpty && (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>😕</Text>
          <Text style={styles.promptText}>No results for "{query}"</Text>
          <Text style={styles.hintText}>Try different keywords or check the spelling</Text>
        </View>
      )}

      {/* Results list */}
      {showResults && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: SIZES.xl }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm },
  searchBar: { borderRadius: 12, elevation: 0, backgroundColor: '#fff' },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: SIZES.md, paddingBottom: SIZES.sm,
  },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, height: 30 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 11 },
  chipTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.xl },
  loadingText: { marginTop: SIZES.sm, color: COLORS.textSecondary },
  recentContainer: { paddingHorizontal: SIZES.md, paddingTop: SIZES.sm },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  clearText: { fontSize: 13, color: COLORS.primary },
  recentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  recentChip: {
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  recentChipText: { color: COLORS.text, fontSize: 13 },
  resultsCount: { paddingHorizontal: SIZES.md, paddingVertical: 6, fontSize: 12, color: COLORS.textSecondary },
  promptText: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.sm },
  hintText: { fontSize: 13, color: COLORS.border, textAlign: 'center', marginTop: 6 },
  listCard: { marginHorizontal: SIZES.md, marginBottom: SIZES.sm },
});
