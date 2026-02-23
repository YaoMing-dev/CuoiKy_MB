import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Chip, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../../stores/useAuthStore';
import { updateUserProfile } from '../../services/authService';
import { COLORS, SIZES, INTERESTS, TRAVEL_STYLES } from '../../config/constants';

export default function PreferencesScreen({ navigation }) {
  const { user, userProfile, setUserProfile } = useAuthStore();
  const [selectedInterests, setSelectedInterests] = useState(userProfile?.interests || []);
  const [travelStyle, setTravelStyle] = useState(userProfile?.travelStyle || 'solo');
  const [saving, setSaving] = useState(false);

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { interests: selectedInterests, travelStyle });
      setUserProfile({ ...userProfile, interests: selectedInterests, travelStyle });
      Alert.alert('Saved!', 'Your preferences have been updated.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>My Preferences</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Help us personalize your experience by selecting your interests.
        </Text>

        <Divider style={styles.divider} />

        {/* Interests */}
        <Text variant="titleMedium" style={styles.sectionTitle}>What are you interested in?</Text>
        <Text variant="bodySmall" style={styles.hint}>Select all that apply</Text>
        <View style={styles.chipGrid}>
          {INTERESTS.map((interest) => (
            <Chip
              key={interest.id}
              selected={selectedInterests.includes(interest.id)}
              onPress={() => toggleInterest(interest.id)}
              icon={interest.icon}
              style={[
                styles.chip,
                selectedInterests.includes(interest.id) && styles.chipSelected,
              ]}
              selectedColor={COLORS.primary}
              showSelectedCheck
            >
              {interest.label}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* Travel Style */}
        <Text variant="titleMedium" style={styles.sectionTitle}>How do you travel?</Text>
        <View style={styles.chipGrid}>
          {TRAVEL_STYLES.map((style) => (
            <Chip
              key={style.id}
              selected={travelStyle === style.id}
              onPress={() => setTravelStyle(style.id)}
              style={[
                styles.chip,
                travelStyle === style.id && styles.chipSelected,
              ]}
              selectedColor={COLORS.primary}
              showSelectedCheck
            >
              {style.label}
            </Chip>
          ))}
        </View>

        <View style={styles.summary}>
          <Text variant="bodySmall" style={styles.summaryText}>
            {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
          icon="content-save"
        >
          Save Preferences
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.lg, paddingBottom: SIZES.xxl },
  title: { color: COLORS.primary, fontWeight: 'bold' },
  subtitle: { color: COLORS.textSecondary, marginTop: SIZES.xs },
  divider: { marginVertical: SIZES.lg },
  sectionTitle: { fontWeight: 'bold', color: COLORS.text, marginBottom: SIZES.xs },
  hint: { color: COLORS.textSecondary, marginBottom: SIZES.md },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  chip: { backgroundColor: COLORS.surface },
  chipSelected: { backgroundColor: '#D4E4F7' },
  summary: { alignItems: 'center', marginTop: SIZES.md },
  summaryText: { color: COLORS.textSecondary },
  saveButton: { marginTop: SIZES.lg },
  buttonContent: { height: 48 },
});
