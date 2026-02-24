import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { submitReview } from '../../services/firestoreService';
import useAuthStore from '../../stores/useAuthStore';
import { COLORS, SIZES } from '../../config/constants';

const RATING_LABELS = ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🤩'];

function StarPicker({ value, onChange }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
          <Text style={[styles.starIcon, { color: star <= value ? COLORS.star : '#DDD' }]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function WriteReviewScreen({ navigation, route }) {
  const { placeId, placeName } = route.params || {};
  const { user, userProfile } = useAuthStore();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!reviewText.trim()) { setError('Please write your review.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await submitReview({
        placeId,
        userId: user.uid,
        userName: userProfile?.displayName || user?.email?.split('@')[0] || 'Anonymous',
        userPhoto: userProfile?.photoURL || null,
        rating,
        text: reviewText.trim(),
      });
      // Invalidate caches so data refreshes
      queryClient.invalidateQueries({ queryKey: ['reviews', placeId] });
      queryClient.invalidateQueries({ queryKey: ['place', placeId] });
      queryClient.invalidateQueries({ queryKey: ['all-places'] });
      queryClient.invalidateQueries({ queryKey: ['places'] });
      navigation.goBack();
    } catch (e) {
      setError('Failed to submit review. Please try again.');
      console.error('[WriteReview]', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Place name */}
        <View style={styles.placeHeader}>
          <Text style={styles.placeLabel}>Reviewing</Text>
          <Text style={styles.placeName}>{placeName}</Text>
        </View>

        {/* Star rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingPrompt}>How was your experience?</Text>
          <StarPicker value={rating} onChange={(v) => { setRating(v); setError(''); }} />
          <Text style={styles.ratingLabel}>{RATING_LABELS[rating] || 'Tap a star'}</Text>
        </View>

        {/* Review text */}
        <TextInput
          label="Your review"
          value={reviewText}
          onChangeText={(t) => { setReviewText(t); setError(''); }}
          mode="outlined"
          multiline
          numberOfLines={6}
          placeholder="What did you like or dislike? Tips for others?"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          style={styles.input}
        />
        <Text style={styles.charCount}>{reviewText.length} / 500</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitBtn}
          contentStyle={{ paddingVertical: 6 }}
        >
          Submit Review
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
          disabled={submitting}
        >
          Cancel
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.lg, gap: SIZES.md, paddingBottom: SIZES.xxl },

  placeHeader: {
    backgroundColor: '#fff', borderRadius: 14, padding: SIZES.md,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  placeLabel: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  placeName: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center' },

  ratingCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: SIZES.lg,
    alignItems: 'center', gap: SIZES.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  ratingPrompt: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  starRow: { flexDirection: 'row', gap: SIZES.sm },
  starIcon: { fontSize: 44 },
  ratingLabel: { fontSize: 16, fontWeight: '700', color: COLORS.star, minHeight: 22 },

  input: { backgroundColor: '#fff' },
  charCount: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right', marginTop: -SIZES.sm },

  errorBox: {
    backgroundColor: '#FFF3F3', borderRadius: 10,
    padding: SIZES.sm, borderLeftWidth: 3, borderLeftColor: COLORS.error,
  },
  errorText: { color: COLORS.error, fontSize: 13 },

  submitBtn: { borderRadius: 12 },
  cancelBtn: { borderRadius: 12, borderColor: COLORS.border },
});
