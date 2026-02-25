import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import useAuthStore from '../../stores/useAuthStore';
import { COLORS, SIZES } from '../../config/constants';

export default function ShareQRScreen({ navigation }) {
  const { user } = useAuthStore();
  const [mode, setMode] = useState('generate'); // 'generate' | 'scan'
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const qrData = JSON.stringify({
    type: 'profile',
    userId: user?.uid,
    name: user?.displayName || user?.email,
  });

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'profile' && parsed.userId) {
        navigation.navigate('UserProfile', { userId: parsed.userId });
      } else if (parsed.type === 'place' && parsed.placeId) {
        navigation.navigate('Discover', {
          screen: 'PlaceDetail',
          params: { placeId: parsed.placeId },
        });
      } else if (parsed.type === 'event' && parsed.eventId) {
        navigation.navigate('Events', {
          screen: 'EventDetail',
          params: { eventId: parsed.eventId },
        });
      }
    } catch (error) {
      console.error('Invalid QR code:', error);
    }
    setTimeout(() => setScanned(false), 2000);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Share QR Code</Text>
      </View>

      <SegmentedButtons
        value={mode}
        onValueChange={setMode}
        buttons={[
          { value: 'generate', label: 'Generate' },
          { value: 'scan', label: 'Scan' },
        ]}
        style={{ margin: SIZES.md }}
      />

      {mode === 'generate' ? (
        <View style={s.center}>
          <Text style={s.subtitle}>Share Your Profile</Text>
          <Text style={s.hint}>Let others scan this QR code to view your profile</Text>

          <View style={s.qrContainer}>
            <QRCode value={qrData} size={200} />
          </View>

          <Text style={s.nameText}>{user?.displayName || user?.email || 'Your Profile'}</Text>
        </View>
      ) : (
        <View style={s.scanContainer}>
          {!permission ? (
            <View style={s.center}>
              <Text style={s.subtitle}>Loading...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={s.center}>
              <Text style={s.subtitle}>Camera Permission Required</Text>
              <Button mode="contained" onPress={requestPermission} style={{ marginTop: SIZES.md }}>
                Grant Permission
              </Button>
            </View>
          ) : (
            <>
              <Text style={s.scanHint}>Point camera at QR code</Text>
              <View style={s.cameraContainer}>
                <CameraView
                  style={s.camera}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
              </View>
              {scanned && (
                <View style={s.scannedBanner}>
                  <Text style={s.scannedText}>✓ Scanned!</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SIZES.md, paddingBottom: SIZES.sm },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.md },
  subtitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SIZES.xs },
  hint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SIZES.xl },
  qrContainer: {
    backgroundColor: '#fff',
    padding: SIZES.xl,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nameText: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: SIZES.md },
  scanContainer: { flex: 1, padding: SIZES.md },
  scanHint: { fontSize: 16, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginBottom: SIZES.md },
  cameraContainer: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  camera: { flex: 1 },
  scannedBanner: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: 8,
  },
  scannedText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
