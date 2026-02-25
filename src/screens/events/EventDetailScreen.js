import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEventById, joinEvent, leaveEvent } from '../../services/eventService';
import useAuthStore from '../../stores/useAuthStore';
import { COLORS, SIZES } from '../../config/constants';

function fmtDate(v) {
  if (!v) return 'TBD';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PRICE_COLOR = { free: '#4CAF50', $: COLORS.primary, $$: COLORS.warning };

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [joining, setJoining] = useState(false);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEventById(eventId),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (isError || !event) return <View style={s.center}><Text>Failed to load event.</Text></View>;

  const isJoined = event.attendees?.includes(user?.uid);
  const isFull = event.maxAttendees && (event.attendees?.length ?? 0) >= event.maxAttendees;
  const attendeeCount = event.attendees?.length ?? 0;

  const handleToggleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      if (isJoined) await leaveEvent(eventId, user.uid);
      else await joinEvent(eventId, user.uid);
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (e) { console.error(e); }
    finally { setJoining(false); }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <Image
          source={{ uri: event.coverImage || `https://picsum.photos/seed/${eventId}/600/350` }}
          style={s.cover} resizeMode="cover"
        />

        <View style={s.content}>
          {/* Category + Price */}
          <View style={s.badgeRow}>
            <View style={s.catBadge}>
              <Text style={s.catText}>{event.category}</Text>
            </View>
            <View style={[s.priceBadge, { backgroundColor: PRICE_COLOR[event.price] || COLORS.primary }]}>
              <Text style={s.priceText}>{event.price === 'free' ? 'Free Entry' : event.price}</Text>
            </View>
          </View>

          <Text style={s.title}>{event.title}</Text>
          <Text style={s.organizer}>by {event.organizerName}</Text>

          <Divider style={s.divider} />

          {/* Info rows */}
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>📅</Text>
              <View>
                <Text style={s.infoLabel}>Start</Text>
                <Text style={s.infoValue}>{fmtDate(event.date)}</Text>
              </View>
            </View>
            {event.endDate && (
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>🏁</Text>
                <View>
                  <Text style={s.infoLabel}>End</Text>
                  <Text style={s.infoValue}>{fmtDate(event.endDate)}</Text>
                </View>
              </View>
            )}
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Location</Text>
                <Text style={s.infoValue}>{event.address}</Text>
                <Text style={s.infoSub}>{event.city}</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>👥</Text>
              <View>
                <Text style={s.infoLabel}>Attendees</Text>
                <Text style={s.infoValue}>
                  {attendeeCount}{event.maxAttendees ? ` / ${event.maxAttendees} spots` : ' going'}
                </Text>
              </View>
            </View>
          </View>

          <Divider style={s.divider} />

          {/* Description */}
          <Text style={s.sectionTitle}>About this event</Text>
          <Text style={s.description}>{event.description}</Text>

          <Divider style={s.divider} />

          {/* RSVP button */}
          {isJoined ? (
            <TouchableOpacity style={s.leaveBtn} onPress={handleToggleJoin} disabled={joining}>
              <Text style={s.leaveBtnText}>{joining ? 'Leaving...' : '✓ You\'re going · Cancel RSVP'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.joinBtn, (isFull || joining) && s.btnDisabled]}
              onPress={handleToggleJoin}
              disabled={isFull || joining}
            >
              <Text style={s.joinBtnText}>
                {joining ? 'Joining...' : isFull ? 'Event Full' : '🎟️  RSVP — I\'m going!'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: SIZES.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cover: { width: '100%', height: 240 },
  content: { padding: SIZES.md },
  badgeRow: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.sm },
  catBadge: { backgroundColor: '#EBF4FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  catText: { color: COLORS.primary, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  priceBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  priceText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, lineHeight: 28, marginBottom: 4 },
  organizer: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SIZES.sm },
  divider: { marginVertical: SIZES.md },
  infoCard: { backgroundColor: COLORS.background, borderRadius: 14, padding: SIZES.md, gap: SIZES.sm },
  infoRow: { flexDirection: 'row', gap: SIZES.sm, alignItems: 'flex-start' },
  infoIcon: { fontSize: 20, width: 28 },
  infoLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  infoSub: { fontSize: 12, color: COLORS.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.sm },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  joinBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  leaveBtn: {
    borderWidth: 2, borderColor: COLORS.success, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', backgroundColor: '#F1FFF3',
  },
  leaveBtnText: { color: COLORS.success, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
