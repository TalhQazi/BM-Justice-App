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

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.signup({ name: name.trim(), email: email.trim(), password });
      if (res.token && res.user) {
        await authStorage.saveSession(res.token, res.user);
        Alert.alert('Account Created', `Welcome to Benchmark Justice, ${res.user.name}!`, [
          { text: 'Start Exploring', onPress: () => navigation.navigate('Home') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Error creating account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>NEW REGISTRATION</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Benchmark Justice for unbiased judicial intelligence analytics.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL LEGAL / PROFESSIONAL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Attorney Jane Doe"
                placeholderTextColor={colors.textSubtle}
                value={name}
                onChangeText={setName}
              />
            </View>

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
              onPress={handleSignup}
            >
              {loading ? (
                <ActivityIndicator color={colors.textDark} />
              ) : (
                <Text style={styles.submitText}>CREATE ACCOUNT &rarr;</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchAuth}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.switchAuthText}>
                Already have an account? <Text style={styles.switchAuthHighlight}>Sign in here</Text>
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
