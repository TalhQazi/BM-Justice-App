import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight, Lock, Mail, UserPlus, UserRound } from 'lucide-react-native';
import { api } from '../services/api';
import { userFacing } from '../utils/format';
import { authStorage } from '../services/auth';
import { useTheme } from '../theme/ThemeProvider';
import { AuthLayout } from '../components/AuthLayout';
import { AppText, Button, FormField, PressableScale, haptic } from '../components/ui';

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      haptic.error();
      Alert.alert('Missing Fields', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.signup({ name: name.trim(), email: email.trim(), password });
      if (res.token && res.user) {
        await authStorage.saveSession(res.token, res.user);
        haptic.success();
        Alert.alert('Account Created', `Welcome to Benchmark Justice, ${res.user.name}!`, [
          { text: 'Start Exploring', onPress: () => navigation.navigate('Home') },
        ]);
      }
    } catch (err: any) {
      haptic.error();
      Alert.alert('Registration Failed', userFacing(err?.message, 'We couldn’t create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="New registration"
      badgeIcon={UserPlus}
      title="Create Account"
      subtitle="Join Benchmark Justice for unbiased judicial intelligence analytics."
    >
      <View style={{ gap: 16 }}>
        <FormField
          label="Full legal / professional name"
          icon={UserRound}
          placeholder="Attorney Jane Doe"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          value={name}
          onChangeText={setName}
        />
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
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleSignup}
          value={password}
          onChangeText={setPassword}
        />

        <Button
          label="Create account"
          iconRight={ArrowRight}
          size="lg"
          fullWidth
          loading={loading}
          onPress={handleSignup}
          style={{ marginTop: 6 }}
        />

        <PressableScale onPress={() => navigation.navigate('Login')} style={{ alignSelf: 'center', paddingVertical: 8 }}>
          <AppText variant="callout">
            Already have an account?{' '}
            <AppText variant="callout" color={t.colors.accent} style={{ fontFamily: t.fonts.sansSemi }}>
              Sign in here
            </AppText>
          </AppText>
        </PressableScale>
      </View>
    </AuthLayout>
  );
}
