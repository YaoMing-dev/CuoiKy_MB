import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Button, TextInput, Portal, Dialog } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyItineraries, createItinerary, deleteItinerary } from '../../services/itineraryService';
import useAuthStore from '../../stores/useAuthStore';
import { COLORS, SIZES } from '../../config/constants';

function fmtDate(v) {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function TripCard({ item, onPress, onDelete }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      <View style={s.cardLeft}>
        <View style={s.iconBox}>
          <Text style={{ fontSize: 26 }}>🗺️</Text>
        </View>
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
        {(item.startDate || item.endDate) && (
          <Text style={s.cardDate}>
            {fmtDate(item.startDate)}{item.endDate ? ' → ' + fmtDate(item.endDate) : ''}
          </Text>
        )}
        {item.destinations?.length > 0 && (
          <Text style={s.cardDest} numberOfLines={1}>📍 {item.destinations.join(' · ')}</Text>
        )}
        <Text style={s.cardPlaces}>{item.places?.length || 0} places added</Text>
      </View>
      <TouchableOpacity style={s.deleteBtn} onPress={onDelete}>
        <Text style={{ fontSize: 18 }}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function ItineraryListScreen({ navigation }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDest, setNewDest] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: itineraries = [], isLoading, refetch } = useQuery({
    queryKey: ['itineraries', user?.uid],
    queryFn: () => getMyItineraries(user.uid),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const parseDate = (str) => {
    if (!str) return null;
    const parts = str.includes('/') ? str.split('/').reverse() : str.split('-');
    const d = new Date(parts.join('-'));
    return isNaN(d.getTime()) ? null : d;
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await createItinerary({
        title: newTitle.trim(),
        userId: user.uid,
        destinations: newDest.trim() ? newDest.split(',').map((d) => d.trim()) : [],
        startDate: parseDate(startDate),
        endDate: parseDate(endDate),
      });
      queryClient.invalidateQueries({ queryKey: ['itineraries', user?.uid] });
      setShowCreate(false);
      setNewTitle(''); setNewDest(''); setStartDate(''); setEndDate('');
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteItinerary(id);
      queryClient.invalidateQueries({ queryKey: ['itineraries', user?.uid] });
    } catch (e) { console.error(e); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Portal>
        <Dialog visible={showCreate} onDismiss={() => setShowCreate(false)}>
          <Dialog.Title>New Travel Plan</Dialog.Title>
          <Dialog.Content style={{ gap: SIZES.sm }}>
            <TextInput label="Plan title *" value={newTitle} onChangeText={setNewTitle}
              mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} />
            <TextInput label="Destinations (e.g. Ha Noi, Da Nang)" value={newDest} onChangeText={setNewDest}
              mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} />
            <TextInput label="Start date (DD/MM/YYYY)" value={startDate} onChangeText={setStartDate}
              mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} />
            <TextInput label="End date (DD/MM/YYYY)" value={endDate} onChangeText={setEndDate}
              mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreate(false)}>Cancel</Button>
            <Button onPress={handleCreate} loading={creating} disabled={!newTitle.trim() || creating}
              textColor={COLORS.primary}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={s.header}>
        <Text style={s.title}>My Plans</Text>
        <TouchableOpacity style={s.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={s.createBtnText}>+ New Plan</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : itineraries.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 52 }}>✈️</Text>
          <Text style={s.emptyTitle}>No travel plans yet</Text>
          <Text style={s.emptyHint}>Create your first trip itinerary!</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => setShowCreate(true)}>
            <Text style={s.emptyBtnText}>Create Plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={itineraries}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TripCard
              item={item}
              onPress={() => navigation.navigate('ItineraryDetail', { itineraryId: item.id, title: item.title })}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={s.list}
          style={{ flex: 1 }}
          onRefresh={refetch}
          refreshing={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.md, paddingTop: SIZES.sm, paddingBottom: SIZES.sm },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: SIZES.md, gap: SIZES.sm, paddingBottom: SIZES.xxl },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: SIZES.md, flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardLeft: {},
  iconBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardDate: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  cardDest: { fontSize: 12, color: COLORS.textSecondary },
  cardPlaces: { fontSize: 11, color: COLORS.textSecondary },
  deleteBtn: { padding: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SIZES.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: 14, color: COLORS.textSecondary },
  emptyBtn: { marginTop: SIZES.sm, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.sm },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
