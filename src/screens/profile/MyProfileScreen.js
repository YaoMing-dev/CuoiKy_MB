import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Avatar, Button, TextInput, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../stores/useAuthStore';
import { updateUserProfile } from '../../services/authService';
import { uploadImage } from '../../services/cloudinaryService';
import { COLORS, SIZES, TRAVEL_STYLES } from '../../config/constants';

export default function MyProfileScreen({ navigation }) {
  const { user, userProfile, setUserProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [travelStyle, setTravelStyle] = useState(userProfile?.travelStyle || 'solo');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setUploading(true);
      try {
        const url = await uploadImage(result.assets[0].uri, 'exploreease/avatars');
        await updateUserProfile(user.uid, { photoURL: url });
        setUserProfile({ ...userProfile, photoURL: url });
      } catch (e) {
        Alert.alert('Error', 'Failed to upload avatar. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName: name.trim(), bio: bio.trim(), travelStyle });
      setUserProfile({ ...userProfile, displayName: name.trim(), bio: bio.trim(), travelStyle });
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={editing ? handlePickAvatar : undefined}>
            {uploading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : userProfile?.photoURL ? (
              <Avatar.Image size={90} source={{ uri: userProfile.photoURL }} />
            ) : (
              <Avatar.Text size={90} label={(userProfile?.displayName || user?.email || 'U')[0].toUpperCase()} />
            )}
            {editing && (
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>Edit</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.displayName}>{userProfile?.displayName || 'No name'}</Text>
          <Text variant="bodyMedium" style={styles.email}>{user?.email}</Text>
        </View>

        <Divider style={styles.divider} />

        {/* Info */}
        {editing ? (
          <View style={styles.form}>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />
            <TextInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="text" />}
              style={styles.input}
            />
            <Text variant="labelLarge" style={styles.sectionLabel}>Travel Style</Text>
            <View style={styles.chipRow}>
              {TRAVEL_STYLES.map((s) => (
                <Chip
                  key={s.id}
                  selected={travelStyle === s.id}
                  onPress={() => setTravelStyle(s.id)}
                  style={styles.chip}
                  selectedColor={COLORS.primary}
                >
                  {s.label}
                </Chip>
              ))}
            </View>
            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={() => setEditing(false)} style={styles.halfButton}>Cancel</Button>
              <Button mode="contained" onPress={handleSave} loading={saving} style={styles.halfButton}>Save</Button>
            </View>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>Bio</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{userProfile?.bio || 'No bio yet'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>Travel Style</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {TRAVEL_STYLES.find((s) => s.id === userProfile?.travelStyle)?.label || 'Solo'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="labelMedium" style={styles.infoLabel}>Interests</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {userProfile?.interests?.length > 0
                  ? userProfile.interests.join(', ')
                  : 'None set'}
              </Text>
            </View>
            <Button mode="contained" onPress={() => setEditing(true)} style={styles.editButton} icon="pencil">
              Edit Profile
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Quick Links */}
        <View style={styles.links}>
          <Button icon="heart" mode="outlined" onPress={() => navigation.navigate('Preferences')} style={styles.linkButton}>
            My Interests & Preferences
          </Button>
          <Button icon="message" mode="outlined" onPress={() => navigation.navigate('ChatList')} style={styles.linkButton}>
            Messages
          </Button>
          <Button icon="account-group" mode="outlined" onPress={() => navigation.navigate('Feed')} style={styles.linkButton}>
            Social Feed
          </Button>
          <Button icon="qrcode" mode="outlined" onPress={() => navigation.navigate('ShareQR')} style={styles.linkButton}>
            Share QR Code
          </Button>
          {userProfile?.role === 'admin' && (
            <Button icon="shield" mode="contained" onPress={() => navigation.navigate('AdminDashboard')} style={[styles.linkButton, styles.adminButton]}>
              Admin Dashboard
            </Button>
          )}
          <Button icon="cog" mode="outlined" onPress={() => navigation.navigate('Settings')} style={styles.linkButton}>
            Settings
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: SIZES.xl },
  avatarSection: { alignItems: 'center', paddingVertical: SIZES.xl, gap: SIZES.sm },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  editBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  displayName: { fontWeight: 'bold', color: COLORS.text },
  email: { color: COLORS.textSecondary },
  divider: { marginVertical: SIZES.md },
  form: { paddingHorizontal: SIZES.lg, gap: SIZES.sm },
  input: { backgroundColor: COLORS.surface },
  sectionLabel: { color: COLORS.text, marginTop: SIZES.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  chip: { backgroundColor: COLORS.surface },
  buttonRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.sm },
  halfButton: { flex: 1 },
  infoSection: { paddingHorizontal: SIZES.lg, gap: SIZES.md },
  infoRow: { gap: 4 },
  infoLabel: { color: COLORS.textSecondary, textTransform: 'uppercase', fontSize: 11 },
  infoValue: { color: COLORS.text },
  editButton: { marginTop: SIZES.sm },
  links: { paddingHorizontal: SIZES.lg, gap: SIZES.sm },
  linkButton: { borderColor: COLORS.border },
  adminButton: { backgroundColor: COLORS.warning },
});
