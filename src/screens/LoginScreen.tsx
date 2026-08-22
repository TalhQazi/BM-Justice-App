import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import Header from '../components/Header';
import { api } from '../services/api';
import { authStorage } from '../services/auth';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email: email.trim(), password });
      if (res.token && res.user) {
        await authStorage.saveSession(res.token, res.user);
        Alert.alert('Welcome', `Signed in as ${res.user.name}`, [
          { text: 'Continue', onPress: () => navigation.navigate('Home') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>SECURE ACCESS</Text>
          <Text style={styles.title}>Account Login</Text>
          <Text style={styles.subtitle}>Sign in to access advanced judicial intelligence metrics.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="counsel@firm.com"
                placeholderTextColor={colors.textSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textSubtle}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.8}
              disabled={loading}
              onPress={handleLogin}
            >
              {loading ? (
                <ActivityIndicator color={colors.textDark} />
              ) : (
                <Text style={styles.submitText}>SIGN IN &rarr;</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchAuth}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.switchAuthText}>
                Don&apos;t have an account? <Text style={styles.switchAuthHighlight}>Sign up here</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brass,
    letterSpacing: 1.5,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: colors.brass,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textDark,
    letterSpacing: 1.2,
    fontFamily: 'monospace',
  },
  switchAuth: {
    alignItems: 'center',
    marginTop: 10,
  },
  switchAuthText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  switchAuthHighlight: {
    color: colors.brass,
    fontWeight: '700',
  },
});
