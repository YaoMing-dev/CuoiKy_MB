import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Text, ActivityIndicator, Divider, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getItineraryById, addPlaceToItinerary, removePlaceFromItinerary, updateItinerary } from '../../services/itineraryService';
import { getAllPlaces } from '../../services/firestoreService';
import { COLORS, SIZES } from '../../config/constants';

function fmtDate(v) {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ItineraryDetailScreen({ route, navigation }) {
  const { itineraryId } = route.params;
  const queryClient = useQueryClient();

  const [showAddPlace, setShowAddPlace] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: itinerary, isLoading } = useQuery({
    queryKey: ['itinerary', itineraryId],
    queryFn: () => getItineraryById(itineraryId),
    staleTime: 60 * 1000,
  });

  const { data: allPlaces = [] } = useQuery({
    queryKey: ['all-places'],
    queryFn: getAllPlaces,
    staleTime: 5 * 60 * 1000,
    enabled: showAddPlace,
  });

  const filteredPlaces = searchText.trim()
    ? allPlaces.filter((p) =>
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.city.toLowerCase().includes(searchText.toLowerCase())
      )
    : allPlaces.slice(0, 20);

  const addedIds = new Set((itinerary?.places || []).map((p) => p.placeId));

  const handleAddPlace = async (place) => {
    if (addedIds.has(place.id)) return;
    setAdding(true);
    try {
      await addPlaceToItinerary(itineraryId, {
        placeId: place.id,
        placeName: place.name,
        city: place.city,
        category: place.category,
        photo: place.photos?.[0] || null,
        notes: '',
        addedAt: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['itinerary', itineraryId] });
    } catch (e) { console.error(e); }
    finally { setAdding(false); }
  };

  const handleRemovePlace = async (placeData) => {
    try {
      await removePlaceFromItinerary(itineraryId, placeData);
      queryClient.invalidateQueries({ queryKey: ['itinerary', itineraryId] });
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!itinerary) return <View style={s.center}><Text>Plan not found.</Text></View>;

  const places = itinerary.places || [];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Add Place Dialog */}
      <Portal>
        <Dialog visible={showAddPlace} onDismiss={() => setShowAddPlace(false)} style={s.dialog}>
          <Dialog.Title>Add a Place</Dialog.Title>
          <Dialog.Content>
            <TextInput
              placeholder="Search places..."
              value={searchText}
              onChangeText={setSearchText}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              style={{ backgroundColor: '#fff', marginBottom: SIZES.sm }}
            />
            <View style={s.placePickerList}>
              {filteredPlaces.map((p) => {
                const added = addedIds.has(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[s.placePickerItem, added && s.placePickerItemAdded]}
                    onPress={() => !added && handleAddPlace(p)}
                    disabled={added || adding}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.placePickerName} numberOfLines={1}>{p.name}</Text>
                      <Text style={s.placePickerSub}>{p.city} · {p.category}</Text>
                    </View>
                    <Text style={{ fontSize: 16 }}>{added ? '✓' : '+'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddPlace(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>{itinerary.title}</Text>
          {(itinerary.startDate || itinerary.endDate) && (
            <Text style={s.dates}>
              {fmtDate(itinerary.startDate)}{itinerary.endDate ? ' → ' + fmtDate(itinerary.endDate) : ''}
            </Text>
          )}
          {itinerary.destinations?.length > 0 && (
            <Text style={s.destinations}>📍 {itinerary.destinations.join(' · ')}</Text>
          )}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddPlace(true)}>
          <Text style={s.addBtnText}>+ Add Place</Text>
        </TouchableOpacity>
      </View>

      <Divider />

      {/* Stats bar */}
      <View style={s.statsBar}>
        <Text style={s.statItem}>🏛️ {places.length} places</Text>
        {itinerary.destinations?.length > 0 && (
          <Text style={s.statItem}>🌆 {itinerary.destinations.length} cities</Text>
        )}
      </View>

      {/* Place list */}
      {places.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={s.emptyTitle}>No places yet</Text>
          <Text style={s.emptyHint}>Tap "+ Add Place" to build your itinerary</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => setShowAddPlace(true)}>
            <Text style={s.emptyBtnText}>+ Add Place</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item, idx) => item.placeId + idx}
          style={{ flex: 1 }}
          contentContainerStyle={s.list}
          renderItem={({ item, index }) => (
            <View style={s.placeItem}>
              <View style={s.placeNum}>
                <Text style={s.placeNumText}>{index + 1}</Text>
              </View>
              <TouchableOpacity
                style={s.placeInfo}
                onPress={() => navigation.navigate('PlaceDetail', { placeId: item.placeId, placeName: item.placeName })}
              >
                <Text style={s.placeName} numberOfLines={1}>{item.placeName}</Text>
                <Text style={s.placeMeta}>{item.city} · {item.category}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.removeBtn} onPress={() => handleRemovePlace(item)}>
                <Text style={s.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: COLORS.border, marginLeft: 60 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SIZES.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: SIZES.md, gap: SIZES.sm },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  dates: { fontSize: 13, color: COLORS.primary, fontWeight: '500', marginTop: 2 },
  destinations: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexShrink: 0 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsBar: { flexDirection: 'row', gap: SIZES.lg, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, backgroundColor: COLORS.background },
  statItem: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  list: { paddingBottom: SIZES.xxl },
  placeItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, gap: SIZES.sm },
  placeNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  placeNumText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  placeMeta: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize', marginTop: 2 },
  removeBtn: { padding: 8 },
  removeBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SIZES.xl },
  emptyBtn: { marginTop: SIZES.sm, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.sm },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dialog: { maxHeight: '80%' },
  placePickerList: { maxHeight: 300 },
  placePickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  placePickerItemAdded: { opacity: 0.4 },
  placePickerName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  placePickerSub: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
});
