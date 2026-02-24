import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Image, Linking, Dimensions, Platform,
} from 'react-native';
import { Text, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getPlaceById } from '../../services/firestoreService';
import { COLORS, SIZES } from '../../config/constants';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = Math.min(width * 0.65, 280);

function StarDisplay({ rating }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 18, color: i <= Math.round(rating || 0) ? COLORS.star : '#DDD' }}>★</Text>
      ))}
      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginLeft: 6 }}>
        {(rating || 0).toFixed(1)}
      </Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function PlaceDetailScreen({ route, navigation }) {
  const { placeId } = route.params;
  const [photoIndex, setPhotoIndex] = useState(0);

  const { data: place, isLoading, isError } = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => getPlaceById(placeId),
    staleTime: 10 * 60 * 1000,
  });

  const openInMaps = () => {
    if (!place?.location) return;
    const { latitude, longitude } = place.location;
    const label = encodeURIComponent(place.name);
    const url = Platform.OS === 'ios'
      ? `maps:0,0?q=${label}@${latitude},${longitude}`
      : Platform.OS === 'android'
      ? `geo:0,0?q=${latitude},${longitude}(${label})`
      : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }
  if (isError || !place) {
    return <View style={styles.center}><Text>Failed to load place.</Text></View>;
  }

  const photos = place.photos?.length > 0 ? place.photos : [`https://picsum.photos/seed/${placeId}/600/400`];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        <View>
          <Image source={{ uri: photos[photoIndex] }} style={{ width: '100%', height: IMG_HEIGHT }} resizeMode="cover" />
          {photos.length > 1 && (
            <>
              <TouchableOpacity style={[styles.arrow, styles.arrowLeft]} onPress={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}>
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.arrow, styles.arrowRight]} onPress={() => setPhotoIndex((i) => (i + 1) % photos.length)}>
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.content}>
          {/* Title + category */}
          <View style={styles.titleRow}>
            <Text style={styles.name}>{place.name}</Text>
            <Chip style={styles.catChip} textStyle={styles.catChipText}>{place.category}</Chip>
          </View>

          <StarDisplay rating={place.averageRating} />
          <Text style={styles.reviewCount}>{place.reviewCount || 0} reviews</Text>

          <Divider style={styles.divider} />

          {/* Info */}
          <InfoRow icon="📍" label="Address" value={`${place.address}, ${place.city}, ${place.country}`} />
          <InfoRow icon="🕐" label="Opening Hours" value={place.openingHours || 'N/A'} />
          <InfoRow icon="💰" label="Price" value={place.priceRange === 'free' ? 'Free admission' : place.priceRange} />

          <Divider style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{place.description}</Text>

          {/* Tags */}
          {place.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {place.tags.map((tag) => (
                <Chip key={tag} style={styles.tag} textStyle={styles.tagText}>#{tag}</Chip>
              ))}
            </View>
          )}

          <Divider style={styles.divider} />

          {/* Actions */}
          <TouchableOpacity style={styles.btnPrimary} onPress={openInMaps}>
            <Text style={styles.btnPrimaryText}>🧭  Get Directions</Text>
          </TouchableOpacity>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('ReviewList', {
                placeId: place.id, placeName: place.name,
                averageRating: place.averageRating, reviewCount: place.reviewCount,
              })}
            >
              <Text style={styles.btnSecondaryText}>⭐  All Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('WriteReview', { placeId: place.id, placeName: place.name })}
            >
              <Text style={styles.btnSecondaryText}>✍️  Write Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  arrow: {
    position: 'absolute', top: '38%',
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20,
    width: 36, height: 36, justifyContent: 'center', alignItems: 'center',
  },
  arrowLeft: { left: 10 },
  arrowRight: { right: 10 },
  arrowText: { color: '#fff', fontSize: 24, lineHeight: 28 },
  dots: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 20 },
  content: { padding: SIZES.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SIZES.sm, marginBottom: 8 },
  name: { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.text, lineHeight: 28 },
  catChip: { backgroundColor: '#EBF4FF', marginTop: 4 },
  catChipText: { color: COLORS.primary, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  reviewCount: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  divider: { marginVertical: SIZES.md },
  infoRow: { flexDirection: 'row', gap: SIZES.sm, paddingVertical: 6 },
  infoIcon: { fontSize: 20, width: 28 },
  infoLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '500', flexWrap: 'wrap' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.sm },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SIZES.sm },
  tag: { backgroundColor: COLORS.background },
  tagText: { fontSize: 11, color: COLORS.textSecondary },
  btnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: SIZES.sm,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: SIZES.sm },
  btnSecondary: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14,
    paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff',
  },
  btnSecondaryText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
});
