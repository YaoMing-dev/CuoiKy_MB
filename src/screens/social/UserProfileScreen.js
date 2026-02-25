import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar, Button, Divider, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, isFollowing, followUser, unfollowUser, getUserReviews, getUserEvents } from '../../services/socialService';
import useAuthStore from '../../stores/useAuthStore';
import { COLORS, SIZES } from '../../config/constants';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserProfile(userId),
    staleTime: 2 * 60 * 1000,
  });

  const { data: isFollowingUser } = useQuery({
    queryKey: ['isFollowing', currentUser?.uid, userId],
    queryFn: () => isFollowing(currentUser.uid, userId),
    enabled: !!currentUser && currentUser.uid !== userId,
    initialData: false,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['userReviews', userId],
    queryFn: () => getUserReviews(userId),
    staleTime: 2 * 60 * 1000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['userEvents', userId],
    queryFn: () => getUserEvents(userId),
    staleTime: 2 * 60 * 1000,
  });

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      if (isFollowingUser) {
        await unfollowUser(currentUser.uid, userId);
      } else {
        await followUser(currentUser.uid, userId);
      }
      queryClient.invalidateQueries({ queryKey: ['isFollowing', currentUser.uid, userId] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.center}>
        <Text>User not found</Text>
      </View>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView>
        {/* Header */}
        <View style={s.header}>
          <Avatar.Text
            size={80}
            label={profile.displayName?.charAt(0).toUpperCase() || 'U'}
            style={{ backgroundColor: COLORS.primary }}
          />
          <Text style={s.name}>{profile.displayName || 'User'}</Text>
          {profile.bio && <Text style={s.bio}>{profile.bio}</Text>}

          {/* Stats */}
          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statNum}>{profile.followersCount || 0}</Text>
              <Text style={s.statLabel}>Followers</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statNum}>{profile.followingCount || 0}</Text>
              <Text style={s.statLabel}>Following</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statNum}>{reviews.length}</Text>
              <Text style={s.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* Follow button */}
          {!isOwnProfile && currentUser && (
            <Button
              mode={isFollowingUser ? 'outlined' : 'contained'}
              onPress={handleFollowToggle}
              loading={loading}
              disabled={loading}
              style={s.followBtn}
            >
              {isFollowingUser ? 'Unfollow' : 'Follow'}
            </Button>
          )}
        </View>

        <Divider style={{ marginVertical: SIZES.md }} />

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Interests</Text>
            <View style={s.chipRow}>
              {profile.interests.map((interest) => (
                <Chip key={interest} style={s.chip}>
                  {interest}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Reviews */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text style={s.emptyText}>No reviews yet</Text>
          ) : (
            reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={s.reviewItem}>
                <Text style={s.reviewPlace}>{review.placeName || 'Unknown place'}</Text>
                <Text style={s.reviewRating}>{'⭐'.repeat(review.rating)}</Text>
                <Text style={s.reviewText} numberOfLines={2}>
                  {review.text}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Events */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Events Organized ({events.length})</Text>
          {events.length === 0 ? (
            <Text style={s.emptyText}>No events organized yet</Text>
          ) : (
            events.slice(0, 3).map((event) => (
              <TouchableOpacity
                key={event.id}
                style={s.eventItem}
                onPress={() => navigation.navigate('Events', {
                  screen: 'EventDetail',
                  params: { eventId: event.id },
                })}
              >
                <Text style={s.eventTitle}>{event.title}</Text>
                <Text style={s.eventMeta}>{event.city} • {event.category}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: SIZES.md },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: SIZES.sm },
  bio: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: SIZES.md },
  stats: { flexDirection: 'row', marginTop: SIZES.md, gap: SIZES.xl },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  followBtn: { marginTop: SIZES.md, minWidth: 120 },
  section: { padding: SIZES.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.xs },
  chip: { marginBottom: SIZES.xs },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic' },
  reviewItem: { backgroundColor: '#fff', padding: SIZES.sm, borderRadius: 8, marginBottom: SIZES.sm },
  reviewPlace: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  reviewRating: { fontSize: 12, marginVertical: 2 },
  reviewText: { fontSize: 13, color: COLORS.textSecondary },
  eventItem: { backgroundColor: '#fff', padding: SIZES.sm, borderRadius: 8, marginBottom: SIZES.sm },
  eventTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  eventMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
