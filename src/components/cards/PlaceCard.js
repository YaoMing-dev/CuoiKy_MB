import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SIZES } from '../../config/constants';

function StarRow({ rating }) {
  const stars = Math.round(rating || 0);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 11, color: i <= stars ? COLORS.star : '#DDD' }}>★</Text>
      ))}
      <Text style={styles.ratingNum}>{(rating || 0).toFixed(1)}</Text>
    </View>
  );
}

const PRICE_COLOR = { free: '#4CAF50', $: COLORS.primary, $$: COLORS.warning, $$$: COLORS.error };

export default function PlaceCard({ place, onPress, distance, horizontal = false, style }) {
  const priceLabel = place.priceRange === 'free' ? 'Free' : place.priceRange;

  return (
    <TouchableOpacity
      style={[horizontal ? styles.cardH : styles.card, style]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <Image
        source={{ uri: place.photos?.[0] || `https://picsum.photos/seed/${place.id}/400/200` }}
        style={horizontal ? styles.imageH : styles.image}
        resizeMode="cover"
      />

      {/* Category badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{place.category}</Text>
      </View>

      {/* Price badge */}
      <View style={[styles.priceBadge, { backgroundColor: PRICE_COLOR[place.priceRange] || COLORS.primary }]}>
        <Text style={styles.priceBadgeText}>{priceLabel}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.city} numberOfLines={1}>{place.city}</Text>

        <View style={styles.row}>
          <StarRow rating={place.averageRating} />
          <Text style={styles.reviewCount}>({place.reviewCount || 0})</Text>
          {distance != null && (
            <Text style={styles.distance}>
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: SIZES.cardRadius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardH: {
    backgroundColor: '#fff',
    borderRadius: SIZES.cardRadius,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    height: 100,
  },
  image: { width: '100%', height: 150 },
  imageH: { width: 100, height: '100%' },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  priceBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  info: { padding: SIZES.sm },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  city: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  ratingNum: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 3 },
  reviewCount: { fontSize: 11, color: COLORS.textSecondary },
  distance: {
    marginLeft: 'auto',
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
