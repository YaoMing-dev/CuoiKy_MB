import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Divider, Button, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../../stores/useAuthStore';
import { logoutUser, deleteUserAccount } from '../../services/authService';
import { COLORS, SIZES } from '../../config/constants';

export default function SettingsScreen() {
  const { user, userProfile, logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logoutUser();
            logout();
          } catch (e) {
            Alert.alert('Error', 'Failed to log out.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount(user.uid);
              logout();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download My Data',
      `Your data will be compiled and sent to:\n${user?.email}\n\nThis may take a few minutes.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        {/* Account */}
        <List.Section>
          <List.Subheader style={styles.subheader}>Account</List.Subheader>
          <List.Item
            title={userProfile?.displayName || 'No name'}
            description={user?.email}
            left={(props) => <List.Icon {...props} icon="account-circle" color={COLORS.primary} />}
          />
          <Divider />
          <List.Item
            title="Role"
            description={userProfile?.role === 'admin' ? 'Administrator' : 'User'}
            left={(props) => <List.Icon {...props} icon="shield-account" color={COLORS.primary} />}
          />
        </List.Section>

        <Divider />

        {/* Notifications */}
        <List.Section>
          <List.Subheader style={styles.subheader}>Notifications</List.Subheader>
          <List.Item
            title="Push Notifications"
            description="Receive alerts for events and messages"
            left={(props) => <List.Icon {...props} icon="bell" color={COLORS.primary} />}
            right={() => (
              <Switch value={notifications} onValueChange={setNotifications} color={COLORS.primary} />
            )}
          />
        </List.Section>

        <Divider />

        {/* Privacy (GDPR) */}
        <List.Section>
          <List.Subheader style={styles.subheader}>Privacy & Data</List.Subheader>
          <List.Item
            title="Download My Data"
            description="Get a copy of your personal data"
            left={(props) => <List.Icon {...props} icon="download" color={COLORS.primary} />}
            onPress={handleDownloadData}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Privacy Policy"
            left={(props) => <List.Icon {...props} icon="shield-lock" color={COLORS.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider />

        {/* App Info */}
        <List.Section>
          <List.Subheader style={styles.subheader}>About</List.Subheader>
          <List.Item
            title="ExploreEase"
            description="Version 1.0.0"
            left={(props) => <List.Icon {...props} icon="information" color={COLORS.primary} />}
          />
        </List.Section>

        <Divider />

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            loading={loggingOut}
            icon="logout"
            textColor={COLORS.error}
            style={styles.logoutButton}
            contentStyle={styles.buttonContent}
          >
            Log Out
          </Button>

          <Button
            mode="text"
            onPress={handleDeleteAccount}
            icon="delete-forever"
            textColor={COLORS.error}
            style={styles.deleteButton}
          >
            Delete Account
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  subheader: { color: COLORS.primary, fontWeight: 'bold' },
  dangerZone: { padding: SIZES.lg, gap: SIZES.sm, marginBottom: SIZES.xl },
  logoutButton: { borderColor: COLORS.error },
  deleteButton: {},
  buttonContent: { height: 48 },
});
