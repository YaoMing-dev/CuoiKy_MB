import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { loginWithEmail, loginWithGoogleCredential } from '../../services/authService';
import { validateEmail } from '../../utils/validators';
import { COLORS, SIZES } from '../../config/constants';

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken) => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogleCredential(idToken);
    } catch (e) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!validateEmail(email)) { setError('Please enter a valid email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (e) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
        setError('Incorrect email or password.');
      } else if (e.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Hero Header */}
        <LinearGradient colors={['#1565C0', '#4A90D9', '#64B5F6']} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroContent}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌍</Text>
              </View>
              <Text style={styles.appName}>ExploreEase</Text>
              <Text style={styles.tagline}>Discover the world around you</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Form Card */}
        <View style={styles.card}>
          <Text variant="headlineSmall" style={styles.cardTitle}>Welcome back</Text>
          <Text variant="bodyMedium" style={styles.cardSubtitle}>Sign in to continue your journey</Text>

          <View style={styles.form}>
            <TextInput
              label="Email address"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email-outline" color={COLORS.primary} />}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock-outline" color={COLORS.primary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword(!showPassword)}
                  color={COLORS.textSecondary}
                />
              }
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              style={styles.input}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotLink}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, (!email.trim() || !password.trim() || loading) && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={!email.trim() || !password.trim() || loading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#1565C0', '#4A90D9']} style={styles.loginGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => { setGoogleLoading(true); promptAsync(); }}
              disabled={!request || googleLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>{googleLoading ? 'Connecting...' : 'Continue with Google'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: height * 0.32,
    justifyContent: 'flex-end',
    paddingBottom: SIZES.xl,
  },
  heroContent: { alignItems: 'center', gap: SIZES.sm },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '400' },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: { fontWeight: '700', color: '#1A1A2E' },
  cardSubtitle: { color: COLORS.textSecondary, marginTop: 4, marginBottom: SIZES.lg },

  form: { gap: SIZES.sm },
  input: { backgroundColor: '#fff' },

  errorBox: {
    backgroundColor: '#FFF3F3',
    borderRadius: 10,
    padding: SIZES.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  errorText: { color: COLORS.error, fontSize: 13 },

  forgotLink: { alignSelf: 'flex-end' },
  forgotText: { color: COLORS.primary, fontSize: 13, fontWeight: '500' },

  loginBtn: { borderRadius: 14, overflow: 'hidden', marginTop: SIZES.xs },
  loginBtnDisabled: { opacity: 0.55 },
  loginGradient: { paddingVertical: 15, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginVertical: SIZES.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textSecondary, fontSize: 13 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SIZES.sm, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.xl },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
