import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { sendPasswordReset } from '../../services/authService';
import { validateEmail } from '../../utils/validators';
import { COLORS, SIZES } from '../../config/constants';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setError('');
    if (!validateEmail(email)) { setError('Please enter a valid email.'); return; }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (e) {
      setError(e.code === 'auth/user-not-found' ? 'No account found with this email.' : 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.container}>
          {sent ? (
            /* Success State */
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>📧</Text>
              <Text variant="headlineSmall" style={styles.successTitle}>Email Sent!</Text>
              <Text style={styles.successDesc}>
                We've sent a password reset link to{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
              <Text style={styles.successHint}>Check your inbox and follow the instructions.</Text>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#1565C0', '#4A90D9']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.btnText}>Back to Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form State */
            <View style={styles.formCard}>
              <Text style={styles.iconBig}>🔑</Text>
              <Text variant="headlineSmall" style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>

              <TextInput
                label="Email address"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email-outline" color={COLORS.primary} />}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                style={styles.input}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.btn, (!email.trim() || loading) && styles.btnDisabled]}
                onPress={handleReset}
                disabled={!email.trim() || loading}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#1565C0', '#4A90D9']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  backBtn: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  container: { flex: 1, justifyContent: 'center', padding: SIZES.lg },

  formCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: SIZES.xl,
    alignItems: 'center', gap: SIZES.sm,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
  },
  iconBig: { fontSize: 48, marginBottom: SIZES.xs },
  title: { fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  input: { backgroundColor: '#fff', width: '100%' },
  errorBox: {
    backgroundColor: '#FFF3F3', borderRadius: 10, padding: SIZES.sm,
    borderLeftWidth: 3, borderLeftColor: COLORS.error, width: '100%',
  },
  errorText: { color: COLORS.error, fontSize: 13 },

  successCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: SIZES.xl,
    alignItems: 'center', gap: SIZES.md,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
  },
  successEmoji: { fontSize: 56 },
  successTitle: { fontWeight: '800', color: '#1A1A2E' },
  successDesc: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 22 },
  emailHighlight: { color: COLORS.primary, fontWeight: '700' },
  successHint: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },

  btn: { borderRadius: 14, overflow: 'hidden', width: '100%', marginTop: SIZES.xs },
  btnDisabled: { opacity: 0.5 },
  btnGradient: { paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
