import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getEvents, seedEvents } from '../../services/eventService';
import { COLORS, SIZES } from '../../config/constants';

const CATS = [
  { id: 'all', label: 'All' },
  { id: 'food', label: '🍜 Food' },
  { id: 'culture', label: '🎨 Culture' },
  { id: 'outdoor', label: '🧗 Outdoor' },
  { id: 'music', label: '🎵 Music' },
  { id: 'sports', label: '⚽ Sports' },
];

const PRICE_COLOR = { free: '#4CAF50', $: COLORS.primary, $$: COLORS.warning };

function fmtDate(v) {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function EventCard({ event, onPress }) {
  const count = event.attendees?.length ?? 0;
  const isFull = event.maxAttendees && count >= event.maxAttendees;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      <Image
        source={{ uri: event.coverImage || `https://picsum.photos/seed/${event.id}/600/300` }}
        style={s.img} resizeMode="cover"
      />
      <View style={[s.priceBadge, { backgroundColor: PRICE_COLOR[event.price] || COLORS.primary }]}>
        <Text style={s.badgeText}>{event.price === 'free' ? 'Free' : event.price}</Text>
      </View>
      {isFull && <View style={s.fullBadge}><Text style={s.badgeText}>FULL</Text></View>}
      <View style={s.body}>
        <View style={s.metaRow}>
          <View style={s.catBadge}><Text style={s.catText}>{event.category}</Text></View>
          <Text style={s.city}>📍 {event.city}</Text>
        </View>
        <Text style={s.cardTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={s.dateText}>📅 {fmtDate(event.date)}</Text>
        <View style={s.footer}>
          <Text style={s.attendees}>👥 {count}{event.maxAttendees ? ' / ' + event.maxAttendees : ''} going</Text>
          <Text style={s.more}>Details →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventListScreen({ navigation }) {
  const [cat, setCat] = useState('all');
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['events', cat],
      queryFn: ({ pageParam }) => getEvents(cat === 'all' ? null : cat, pageParam),
      getNextPageParam: (last) => (last.hasMore ? last.lastDoc : undefined),
      initialPageParam: null,
      staleTime: 2 * 60 * 1000,
    });

  const events = data?.pages.flatMap((p) => p.events) ?? [];

  const handleSeed = async () => {
    setSeeding(true); setSeedMsg('');
    try {
      const n = await seedEvents();
      setSeedMsg('✅ Seeded ' + n + ' events!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (e) { setSeedMsg('❌ ' + e.message); }
    finally { setSeeding(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Events</Text>
        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('CreateEvent')}>
          <Text style={s.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {!isLoading && events.length === 0 && (
        <View style={s.seedRow}>
          <TouchableOpacity style={s.seedBtn} onPress={handleSeed} disabled={seeding}>
            <Text style={s.seedBtnText}>{seeding ? 'Seeding...' : '🌱 Seed Sample Events'}</Text>
          </TouchableOpacity>
          {seedMsg ? <Text style={s.seedMsg}>{seedMsg}</Text> : null}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow} style={s.chipScroll}>
        {CATS.map((c) => {
          const active = cat === c.id;
          return (
            <TouchableOpacity key={c.id} style={[s.chip, active && s.chipActive]}
              onPress={() => setCat(c.id)} activeOpacity={0.75}>
              <Text style={[s.chipText, active && s.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : isError ? (
        <View style={s.center}>
          <Text style={s.emptyText}>Failed to load events.</Text>
          <TouchableOpacity onPress={refetch} style={{ padding: 12 }}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : events.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>📅</Text>
          <Text style={s.emptyText}>No events yet</Text>
          <Text style={s.emptyHint}>Seed sample events or create your own!</Text>
        </View>
      ) : (
        <FlatList
          data={events} keyExtractor={(e) => e.id} style={{ flex: 1 }}
          renderItem={({ item }) => (
            <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })} />
          )}
          contentContainerStyle={s.list}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isFetchingNextPage
            ? <ActivityIndicator color={COLORS.primary} style={{ padding: 16 }} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.md, paddingTop: SIZES.sm, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  seedRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.md, paddingBottom: 4, gap: SIZES.sm, flexWrap: 'wrap' },
  seedBtn: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  seedBtnText: { color: '#2E7D32', fontWeight: '600', fontSize: 12 },
  seedMsg: { fontSize: 12, color: COLORS.textSecondary },
  chipScroll: { flexShrink: 0, flexGrow: 0, height: 50 },
  chipRow: { flexDirection: 'row', paddingHorizontal: SIZES.md, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E8EAED', marginRight: SIZES.sm, flexShrink: 0 },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: SIZES.md, gap: SIZES.md, paddingBottom: SIZES.xxl },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  img: { width: '100%', height: 180 },
  priceBadge: { position: 'absolute', top: 12, right: 12, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  fullBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: COLORS.error, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  body: { padding: SIZES.md },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catBadge: { backgroundColor: '#EBF4FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { color: COLORS.primary, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  city: { fontSize: 12, color: COLORS.textSecondary },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8, lineHeight: 22 },
  dateText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendees: { fontSize: 12, color: COLORS.textSecondary },
  more: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SIZES.sm },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SIZES.xl },
});
