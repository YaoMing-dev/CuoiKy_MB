import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getReviewsByPlace } from '../../services/firestoreService';
import { COLORS, SIZES } from '../../config/constants';

function StarDisplay({ rating, size = 14 }) {
  const filled = Math.round(rating || 0);
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: size, color: i <= filled ? COLORS.star : '#DDD' }}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({ review }) {
  const dateStr = review.createdAt?.toDate
    ? review.createdAt.toDate().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Recently';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        {review.userPhoto
          ? <Avatar.Image size={42} source={{ uri: review.userPhoto }} style={styles.avatar} />
          : <Avatar.Text size={42} label={(review.userName || 'A')[0].toUpperCase()} style={styles.avatar} />
        }
        <View style={styles.meta}>
          <Text style={styles.userName} numberOfLines={1}>{review.userName || 'Anonymous'}</Text>
          <View style={styles.metaBottom}>
            <StarDisplay rating={review.rating} />
            <Text style={styles.dot}>·</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeText}>{review.rating?.toFixed(1) || '0'}</Text>
        </View>
      </View>
      {review.text ? <Text style={styles.reviewText}>{review.text}</Text> : null}
    </View>
  );
}

export default function ReviewListScreen({ route, navigation }) {
  const { placeId, placeName, averageRating, reviewCount } = route.params || {};

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading,
  } = useInfiniteQuery({
    queryKey: ['reviews', placeId],
    queryFn: ({ pageParam }) => getReviewsByPlace(placeId, 10, pageParam),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.lastDoc : undefined),
    initialPageParam: null,
    staleTime: 2 * 60 * 1000,
  });

  const reviews = data?.pages.flatMap((p) => p.reviews) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Rating summary */}
      <View style={styles.summary}>
        <Text style={styles.ratingBig}>{(averageRating || 0).toFixed(1)}</Text>
        <View style={styles.summaryRight}>
          <StarDisplay rating={averageRating} size={22} />
          <Text style={styles.reviewCountText}>{reviewCount || 0} reviews</Text>
          <Text style={styles.placeNameText} numberOfLines={1}>{placeName}</Text>
        </View>
        <TouchableOpacity
          style={styles.writeBtn}
          onPress={() => navigation.navigate('WriteReview', { placeId, placeName })}
        >
          <Text style={styles.writeBtnText}>✏️ Write</Text>
        </TouchableOpacity>
      </View>

      {/* Review list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>📝</Text>
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptyHint}>Be the first to share your experience!</Text>
          <TouchableOpacity
            style={styles.firstReviewBtn}
            onPress={() => navigation.navigate('WriteReview', { placeId, placeName })}
          >
            <Text style={styles.firstReviewText}>Write a Review</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <ReviewCard review={item} />}
          contentContainerStyle={styles.list}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={COLORS.primary} style={{ padding: SIZES.lg }} />
              : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  summary: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    backgroundColor: '#fff', padding: SIZES.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  ratingBig: { fontSize: 52, fontWeight: '900', color: COLORS.text, lineHeight: 56 },
  summaryRight: { flex: 1, gap: 4 },
  reviewCountText: { fontSize: 13, color: COLORS.textSecondary },
  placeNameText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
  writeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  writeBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  list: { padding: SIZES.md, gap: SIZES.sm, paddingBottom: SIZES.xxl },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: SIZES.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.sm },
  avatar: { backgroundColor: COLORS.primary },
  meta: { flex: 1, gap: 3 },
  metaBottom: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  dot: { color: COLORS.textSecondary, fontSize: 12 },
  date: { fontSize: 12, color: COLORS.textSecondary },
  ratingBadge: {
    backgroundColor: COLORS.star, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  ratingBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  reviewText: { fontSize: 14, color: COLORS.text, lineHeight: 21, marginTop: 2 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SIZES.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: 14, color: COLORS.textSecondary },
  firstReviewBtn: {
    marginTop: SIZES.sm, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.sm,
  },
  firstReviewText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
