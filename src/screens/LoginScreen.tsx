import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, KeyRound, Lock, Mail } from 'lucide-react-native';
import { api } from '../services/api';
import { userFacing } from '../utils/format';
import { authStorage } from '../services/auth';
import { useTheme } from '../theme/ThemeProvider';
import { AuthLayout } from '../components/AuthLayout';
import { AppText, Button, FormField, PressableScale, haptic } from '../components/ui';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      haptic.error();
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email: email.trim(), password });
      if (res.token && res.user) {
        await authStorage.saveSession(res.token, res.user);
        haptic.success();
        Alert.alert('Welcome', `Signed in as ${res.user.name}`, [
          { text: 'Continue', onPress: () => navigation.navigate('Home') },
        ]);
      }
    } catch (err: any) {
      haptic.error();
      Alert.alert('Sign In Failed', userFacing(err?.message, 'Please check your email and password and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Secure access"
      badgeIcon={KeyRound}
      title="Account Login"
      subtitle="Sign in to access advanced judicial intelligence metrics."
    >
      <View style={{ gap: 16 }}>
        <FormField
          label="Email address"
          icon={Mail}
          placeholder="counsel@firm.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label="Password"
          icon={Lock}
          placeholder="••••••••"
          secureTextEntry
          secureToggle
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
          value={password}
          onChangeText={setPassword}
        />

        <Button label="Sign in" iconRight={ArrowRight} size="lg" fullWidth loading={loading} onPress={handleLogin} style={{ marginTop: 6 }} />

        <PressableScale onPress={() => navigation.navigate('Signup')} style={{ alignSelf: 'center', paddingVertical: 8 }}>
          <AppText variant="callout">
            Don&apos;t have an account?{' '}
            <AppText variant="callout" color={t.colors.accent} style={{ fontFamily: t.fonts.sansSemi }}>
              Sign up here
            </AppText>
          </AppText>
        </PressableScale>
      </View>
    </AuthLayout>
  );
}
