import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Divider, Button, Switch, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../../stores/useAuthStore';
import { logoutUser, deleteUserAccount } from '../../services/authService';
import { COLORS, SIZES } from '../../config/constants';

export default function SettingsScreen() {
  const { user, userProfile, logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    setLoggingOut(true);
    try {
      await logoutUser();
      logout();
    } catch (e) {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteDialog(false);
    setDeleting(true);
    try {
      await deleteUserAccount(user.uid);
      logout();
    } catch (e) {
      setDeleting(false);
      if (e.code === 'auth/requires-recent-login') {
        setShowReauthDialog(true);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Portal>
        {/* Logout Confirm Dialog */}
        <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
          <Dialog.Title>Log Out</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to log out?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)}>Cancel</Button>
            <Button textColor={COLORS.error} onPress={handleLogout}>Log Out</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text>This will permanently delete your account and all your data. This cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button textColor={COLORS.error} onPress={handleDeleteAccount}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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

        {/* Privacy */}
        <List.Section>
          <List.Subheader style={styles.subheader}>Privacy & Data</List.Subheader>
          <List.Item
            title="Privacy Policy"
            left={(props) => <List.Icon {...props} icon="shield-lock" color={COLORS.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider />

        {/* About */}
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
            onPress={() => setShowLogoutDialog(true)}
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
            onPress={() => setShowDeleteDialog(true)}
            loading={deleting}
            icon="delete-forever"
            textColor={COLORS.error}
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
  buttonContent: { height: 48 },
});
