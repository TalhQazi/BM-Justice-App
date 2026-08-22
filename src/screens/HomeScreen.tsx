import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors } from '../theme/colors';
import Header from '../components/Header';
import UniversalSearch from '../components/UniversalSearch';
import CoverageCounters from '../components/CoverageCounters';
import EntityCards from '../components/EntityCards';
import LiveIntelligencePanel from '../components/LiveIntelligencePanel';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero Title */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>See the Record Behind the Justice System.</Text>
          <Text style={styles.heroBadge}>REAL DATA. REAL OUTCOMES. REAL JUSTICE.</Text>
          <Text style={styles.heroSubtitle}>
            Search any judge, attorney, prosecutor, court, or case.
          </Text>
        </View>

        {/* Universal Live Search */}
        <UniversalSearch />

        {/* Real-time Coverage Counters (0 when offline, live stats when online) */}
        <CoverageCounters />

        {/* Entity Category Cards */}
        <EntityCards />

        {/* Live Justice Intelligence Feed (strictly real telemetry only) */}
        <LiveIntelligencePanel />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Benchmark Justice™ &bull; Public Records & Judicial Intelligence &bull; 2026
          </Text>
        </View>
      </ScrollView>
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
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4D7CFE',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 340,
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: colors.textSubtle,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
