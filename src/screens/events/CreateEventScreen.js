import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { createEvent } from '../../services/eventService';
import useAuthStore from '../../stores/useAuthStore';
import { COLORS, SIZES } from '../../config/constants';

const CATS = ['food', 'culture', 'outdoor', 'music', 'sports', 'travel'];
const PRICES = ['free', '$', '$$', '$$$'];

export default function CreateEventScreen({ navigation }) {
  const { user, userProfile } = useAuthStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [price, setPrice] = useState('free');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const parseDate = (str) => {
    // Accept DD/MM/YYYY or YYYY-MM-DD
    if (!str) return null;
    const parts = str.includes('/') ? str.split('/').reverse() : str.split('-');
    const d = new Date(parts.join('-'));
    return isNaN(d.getTime()) ? null : d;
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Please enter event title.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    if (!city.trim()) { setError('Please enter city.'); return; }
    if (!dateStr.trim()) { setError('Please enter event date.'); return; }
    const date = parseDate(dateStr);
    if (!date) { setError('Invalid date. Use DD/MM/YYYY format.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        category,
        city: city.trim(),
        address: address.trim(),
        date,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        price,
        organizerId: user.uid,
        organizerName: userProfile?.displayName || user?.email?.split('@')[0] || 'Organizer',
        coverImage: null,
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigation.goBack();
    } catch (e) {
      setError('Failed to create event: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.pageTitle}>Create Event</Text>

        <TextInput label="Event title *" value={title} onChangeText={t => { setTitle(t); setError(''); }}
          mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} style={s.input} />

        <TextInput label="Description" value={description} onChangeText={setDescription}
          mode="outlined" multiline numberOfLines={4}
          outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} style={s.input} />

        {/* Category picker */}
        <Text style={s.label}>Category *</Text>
        <View style={s.optionRow}>
          {CATS.map((c) => (
            <TouchableOpacity key={c} style={[s.optionChip, category === c && s.optionChipActive]}
              onPress={() => { setCategory(c); setError(''); }}>
              <Text style={[s.optionText, category === c && s.optionTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput label="City *" value={city} onChangeText={t => { setCity(t); setError(''); }}
          mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} style={s.input} />

        <TextInput label="Address / Venue" value={address} onChangeText={setAddress}
          mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} style={s.input} />

        <TextInput label="Date * (DD/MM/YYYY)" value={dateStr} onChangeText={t => { setDateStr(t); setError(''); }}
          mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.primary}
          placeholder="25/12/2025" style={s.input} />

        <TextInput label="Max attendees (optional)" value={maxAttendees} onChangeText={setMaxAttendees}
          mode="outlined" keyboardType="numeric"
          outlineColor={COLORS.border} activeOutlineColor={COLORS.primary} style={s.input} />

        {/* Price picker */}
        <Text style={s.label}>Price</Text>
        <View style={s.optionRow}>
          {PRICES.map((p) => (
            <TouchableOpacity key={p} style={[s.optionChip, price === p && s.optionChipActive]}
              onPress={() => setPrice(p)}>
              <Text style={[s.optionText, price === p && s.optionTextActive]}>
                {p === 'free' ? 'Free' : p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting}
          style={s.submitBtn} contentStyle={{ paddingVertical: 6 }}>
          Create Event
        </Button>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={s.cancelBtn} disabled={submitting}>
          Cancel
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.lg, gap: SIZES.sm, paddingBottom: SIZES.xxl },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: SIZES.sm },
  input: { backgroundColor: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: SIZES.xs },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.xs },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E8EAED' },
  optionChipActive: { backgroundColor: COLORS.primary },
  optionText: { fontSize: 13, fontWeight: '500', color: '#444', textTransform: 'capitalize' },
  optionTextActive: { color: '#fff', fontWeight: '700' },
  errorBox: { backgroundColor: '#FFF3F3', borderRadius: 10, padding: SIZES.sm, borderLeftWidth: 3, borderLeftColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: 13 },
  submitBtn: { borderRadius: 12, marginTop: SIZES.sm },
  cancelBtn: { borderRadius: 12, borderColor: COLORS.border },
});
