import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  BookOpenText,
  ChevronRight,
  Database,
  Info,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  UserPlus,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { authStorage } from '../services/auth';
import type { AuthUser } from '../types';
import { useTheme, useThemePreference, ThemePreference } from '../theme/ThemeProvider';
import { CONTENT_MAX_WIDTH, useResponsive, useTabBarSpace } from '../theme/responsive';
import { palette } from '../theme/tokens';
import {
  AppText,
  Badge,
  Button,
  Card,
  InfoRow,
  Monogram,
  PressableScale,
  SegmentedControl,
  Skeleton,
  enterUp,
  haptic,
} from '../components/ui';
import appConfig from '../../app.json';

function LinkRow({
  icon: Icon,
  label,
  sub,
  onPress,
  last,
}: {
  icon: LucideIcon;
  label: string;
  sub?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic
      scaleTo={0.985}
      style={[
        styles.linkRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.colors.divider },
      ]}
    >
      <View style={[styles.linkIcon, { backgroundColor: t.colors.surfaceSunken }]}>
        <Icon size={17} color={t.colors.accent} strokeWidth={1.9} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        {sub ? <AppText variant="caption">{sub}</AppText> : null}
      </View>
      <ChevronRight size={18} color={t.colors.textTertiary} />
    </PressableScale>
  );
}


export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const tabSpace = useTabBarSpace();
  const { preference, setPreference } = useThemePreference();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Re-read the stored session whenever the tab gains focus (e.g. after login).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      authStorage.getUser().then((u) => {
        if (active) {
          setUser(u);
          setLoadingUser(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const signOut = () => {
    Alert.alert('Sign out', 'You will need to sign in again to access account features.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await authStorage.clearSession();
          haptic.success();
          setUser(null);
        },
      },
    ]);
  };


  return (
    <View style={[styles.root, { backgroundColor: t.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: gutter,
          paddingBottom: tabSpace,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
          gap: 20,
        }}
      >
        <Animated.View entering={enterUp(0)}>
          <AppText variant="overline" color={t.colors.accent}>
            Account
          </AppText>
          <AppText variant="h1" style={{ marginTop: 4 }}>
            Profile & Settings
          </AppText>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={enterUp(1)}>
          {loadingUser ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Skeleton width={64} height={64} radius={32} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="55%" height={16} />
                  <Skeleton width="75%" height={12} />
                </View>
              </View>
            </Card>
          ) : user ? (
            <Card variant="elevated" accentEdge>
              <View style={styles.userRow}>
                <Monogram name={user.name} size={64} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="h2" numberOfLines={1}>
                    {user.name}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1} style={{ marginTop: 2 }}>
                    {user.email}
                  </AppText>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    <Badge label={user.role || 'Member'} tone="gold" icon={ShieldCheck} />
                    <Badge label="Signed in" tone="success" dot />
                  </View>
                </View>
              </View>
              <Button
                label="Sign out"
                icon={LogOut}
                variant="outline"
                fullWidth
                onPress={signOut}
                style={{ marginTop: 16 }}
              />
            </Card>
          ) : (
            <View style={[styles.signInCard, t.shadow(2)]}>
              <LinearGradient
                colors={[palette.navy700, palette.navy900]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Badge label="Secure access" tone="gold" icon={ShieldCheck} />
              <AppText variant="h2" color={palette.parchment} style={{ marginTop: 12 }}>
                Unlock advanced judicial intelligence
              </AppText>
              <AppText variant="body" color={palette.navy300} style={{ marginTop: 6 }}>
                Sign in to access account features and advanced metrics.
              </AppText>
              <View style={styles.authButtons}>
                <Button label="Sign in" icon={LogIn} onPress={() => navigation.navigate('Login')} style={{ flex: 1 }} fullWidth />
                <Button
                  label="Create account"
                  icon={UserPlus}
                  variant="navy"
                  onPress={() => navigation.navigate('Signup')}
                  style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(210,182,118,0.35)' }}
                  fullWidth
                />
              </View>
            </View>
          )}
        </Animated.View>

        {/* Appearance */}
        <Animated.View entering={enterUp(2)}>
          <AppText variant="overline" style={styles.groupLabel}>
            Appearance
          </AppText>
          <Card>
            <AppText variant="title">Theme</AppText>
            <AppText variant="caption" style={{ marginTop: 2, marginBottom: 12 }}>
              Follow your device or choose a fixed appearance.
            </AppText>
            <SegmentedControl<ThemePreference>
              value={preference}
              onChange={setPreference}
              segments={[
                { key: 'system', label: 'System', icon: Monitor },
                { key: 'light', label: 'Light', icon: Sun },
                { key: 'dark', label: 'Dark', icon: Moon },
              ]}
            />
          </Card>
        </Animated.View>

        {/* Explore */}
        <Animated.View entering={enterUp(3)}>
          <AppText variant="overline" style={styles.groupLabel}>
            Explore
          </AppText>
          <Card padding={0} style={{ paddingHorizontal: 16 }}>
            <LinkRow icon={Activity} label="Live activity feed" sub="Newest opinions & court filings" onPress={() => navigation.navigate('Activity')} />
            <LinkRow
              icon={BookOpenText}
              label="Judges directory"
              sub="Careers, appointments & opinions"
              onPress={() => navigation.navigate('Home', { screen: 'Judges' })}
            />
            <LinkRow
              icon={Database}
              label="Courts directory"
              sub="Federal & state courts"
              last
              onPress={() => navigation.navigate('Home', { screen: 'Courts' })}
            />
          </Card>
        </Animated.View>

        {/* About */}
        <Animated.View entering={enterUp(5)}>
          <AppText variant="overline" style={styles.groupLabel}>
            About
          </AppText>
          <Card padding={0} style={{ paddingHorizontal: 16 }}>
            <InfoRow icon={Info} label="Version" value={appConfig.expo.version} last />
          </Card>
          <AppText variant="caption" align="center" style={{ marginTop: 18 }}>
            Benchmark Justice™ · Public Records & Judicial Intelligence
          </AppText>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  signInCard: { borderRadius: 22, padding: 20, overflow: 'hidden' },
  authButtons: { flexDirection: 'row', gap: 10, marginTop: 18 },
  groupLabel: { marginBottom: 8, marginLeft: 4 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  linkIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
