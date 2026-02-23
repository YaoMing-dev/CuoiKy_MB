import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { registerWithEmail } from '../../services/authService';
import { validateEmail, validatePassword, getPasswordStrength, validateRequired } from '../../utils/validators';
import { COLORS, SIZES } from '../../config/constants';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(height * 0.27, 220);

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const passwordStrength = getPasswordStrength(password);

  const validate = () => {
    const e = {};
    if (!validateRequired(name)) e.name = 'Name is required.';
    if (!validateEmail(email)) e.email = 'Enter a valid email.';
    if (!validatePassword(password)) e.password = 'Min 8 chars, uppercase, lowercase & number.';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await registerWithEmail(name.trim(), email.trim(), password);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email is already registered.' });
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !name.trim() || !email.trim() || !password || !confirmPassword || loading;

  const strengthColors = { 1: '#EF5350', 2: '#FF9800', 3: '#4CAF50', 4: '#1B5E20' };
  const strengthWidth = password.length > 0 ? `${(passwordStrength.level / 4) * 100}%` : '0%';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <LinearGradient colors={['#1565C0', '#4A90D9']} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroContent}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>✈️</Text>
              </View>
              <Text style={styles.heroTitle}>Create Account</Text>
              <Text style={styles.heroSubtitle}>Join thousands of travelers</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Card */}
        <View style={styles.card}>
          <Text variant="titleMedium" style={styles.cardTitle}>Your details</Text>

          {/* Name */}
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((p) => ({ ...p, name: '' })); }}
            mode="outlined"
            left={<TextInput.Icon icon="account-outline" color={COLORS.primary} />}
            error={!!errors.name}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            style={styles.input}
          />
          {errors.name ? <Text style={styles.errText}>⚠️ {errors.name}</Text> : null}

          {/* Email */}
          <TextInput
            label="Email address"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: '' })); }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" color={COLORS.primary} />}
            error={!!errors.email}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            style={styles.input}
          />
          {errors.email ? <Text style={styles.errText}>⚠️ {errors.email}</Text> : null}

          {/* Password */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: '' })); }}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock-outline" color={COLORS.primary} />}
            right={<TextInput.Icon icon={showPassword ? 'eye-off-outline' : 'eye-outline'} onPress={() => setShowPassword(!showPassword)} color={COLORS.textSecondary} />}
            error={!!errors.password}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            style={styles.input}
          />
          {password.length > 0 && (
            <View style={styles.strengthSection}>
              <View style={styles.strengthBar}>
                <View style={[styles.strengthFill, { width: strengthWidth, backgroundColor: strengthColors[passwordStrength.level] || '#ccc' }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColors[passwordStrength.level] || COLORS.textSecondary }]}>
                {passwordStrength.label}
              </Text>
            </View>
          )}
          {errors.password ? <Text style={styles.errText}>⚠️ {errors.password}</Text> : null}

          {/* Confirm Password */}
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
            mode="outlined"
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            left={<TextInput.Icon icon="lock-check-outline" color={COLORS.primary} />}
            right={<TextInput.Icon icon={showConfirm ? 'eye-off-outline' : 'eye-outline'} onPress={() => setShowConfirm(!showConfirm)} color={COLORS.textSecondary} />}
            error={!!errors.confirmPassword}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            style={styles.input}
          />
          {errors.confirmPassword ? <Text style={styles.errText}>⚠️ {errors.confirmPassword}</Text> : null}
          {errors.general ? <Text style={styles.errText}>⚠️ {errors.general}</Text> : null}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.btn, isDisabled && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isDisabled}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#1565C0', '#4A90D9']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.btnText}>{loading ? 'Creating account...' : 'Create Account 🚀'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.terms}>
            <Text style={styles.termsText}>By signing up, you agree to our </Text>
            <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { height: HERO_HEIGHT, justifyContent: 'flex-end', paddingBottom: SIZES.xl },
  heroContent: { alignItems: 'center', gap: 8 },
  logoCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  logoEmoji: { fontSize: 28 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },

  card: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -22, padding: SIZES.lg,
    paddingBottom: SIZES.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
    gap: SIZES.sm,
  },
  cardTitle: { fontWeight: '700', color: '#1A1A2E', marginBottom: SIZES.xs },
  input: { backgroundColor: '#fff' },

  strengthSection: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  strengthBar: { flex: 1, height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 70 },

  errText: { color: COLORS.error, fontSize: 12, marginTop: -SIZES.xs },

  btn: { borderRadius: 14, overflow: 'hidden', marginTop: SIZES.sm },
  btnDisabled: { opacity: 0.5 },
  btnGradient: { paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  terms: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  termsText: { color: COLORS.textSecondary, fontSize: 12 },
  termsLink: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.sm },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
