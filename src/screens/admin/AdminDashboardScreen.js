import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Portal, Dialog } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { seedPlacesToFirestore } from '../../services/firestoreService';
import useAuthStore from '../../stores/useAuthStore';
import { COLORS, SIZES } from '../../config/constants';

export default function AdminDashboardScreen({ navigation }) {
  const { userProfile } = useAuthStore();
  const [seeding, setSeeding] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const handleSeed = async () => {
    setShowSeedDialog(false);
    setSeeding(true);
    try {
      const count = await seedPlacesToFirestore();
      setSeedResult(`✅ Successfully seeded ${count} places to Firestore!`);
    } catch (e) {
      setSeedResult(`❌ Seed failed: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Portal>
        <Dialog visible={showSeedDialog} onDismiss={() => setShowSeedDialog(false)}>
          <Dialog.Title>Seed Places Data</Dialog.Title>
          <Dialog.Content>
            <Text>This will add 30 sample places (HCM, Da Nang, Ha Noi) to Firestore.{'\n\n'}Only run this once. Running again will add duplicates.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSeedDialog(false)}>Cancel</Button>
            <Button onPress={handleSeed} textColor={COLORS.primary}>Seed Now</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Logged in as: {userProfile?.email}</Text>

        {/* Seed Data */}
        <Card style={styles.card}>
          <Card.Title title="🌱 Seed Sample Data" subtitle="Populate Firestore with 30 places" />
          <Card.Content>
            {seedResult ? (
              <Text style={styles.seedResult}>{seedResult}</Text>
            ) : null}
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => setShowSeedDialog(true)}
              loading={seeding}
              disabled={seeding}
            >
              {seeding ? 'Seeding...' : 'Seed 30 Places'}
            </Button>
          </Card.Actions>
        </Card>

        {/* Management Links */}
        <Card style={styles.card}>
          <Card.Title title="👥 Manage Users" />
          <Card.Actions>
            <Button onPress={() => navigation.navigate('ManageUsers')}>Open</Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="📅 Manage Events" subtitle="Approve / reject pending events" />
          <Card.Actions>
            <Button onPress={() => navigation.navigate('ManageEvents')}>Open</Button>
          </Card.Actions>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="⭐ Manage Reviews" subtitle="Moderate flagged reviews" />
          <Card.Actions>
            <Button onPress={() => navigation.navigate('ManageReviews')}>Open</Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.md, gap: SIZES.sm, paddingBottom: SIZES.xl },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SIZES.md },
  card: { backgroundColor: '#fff' },
  seedResult: { fontSize: 14, color: COLORS.text, marginTop: 4 },
});
