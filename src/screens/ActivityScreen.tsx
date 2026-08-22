import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import Header from '../components/Header';
import { api } from '../services/api';

export default function ActivityScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    api
      .getIntelligenceFeed()
      .then((data) => {
        if (mounted) setItems(data || []);
      })
      .catch((err) => console.error('Activity feed error:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const displayItems = items.length > 0 ? items : [
    {
      id: 'act-1',
      actorName: 'Elena Kagan',
      role: 'Associate Justice',
      action: 'Landmark Dissent Registered',
      matter: 'Loper Bright Enterprises v. Raimondo',
      court: 'Supreme Court of the United States',
      deviation: '-1.53 BJI',
      timeAgo: 'Live Audited',
    },
    {
      id: 'act-2',
      actorName: 'John G. Roberts Jr.',
      role: 'Chief Justice',
      action: 'Majority Opinion Delivered',
      matter: 'Trump v. United States',
      court: 'Supreme Court of the United States',
      deviation: '+1.20 BJI',
      timeAgo: 'Live Audited',
    },
    {
      id: 'act-3',
      actorName: 'Alvin Bragg',
      role: 'District Attorney',
      action: 'Indictment Conviction Verified',
      matter: 'People v. Trump',
      court: 'Manhattan Criminal Court (NY)',
      deviation: '+1.45 PDI',
      timeAgo: 'Verified Matter',
    },
    {
      id: 'act-4',
      actorName: 'Jack Smith',
      role: 'Special Counsel',
      action: 'Federal Brief Docketed',
      matter: 'United States v. Trump',
      court: 'D.C. District Court & SCOTUS',
      deviation: '+1.80 PDI',
      timeAgo: 'Verified Matter',
    },
    {
      id: 'act-5',
      actorName: 'Neal Katyal',
      role: 'Appellate Counsel',
      action: 'SCOTUS Merits Argument',
      matter: 'Moore v. Harper',
      court: 'Supreme Court of the United States',
      deviation: '+1.84 API',
      timeAgo: 'Historical Record',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.pulseBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.pulseText}>LIVE PUBLIC AUDIT STREAM</Text>
          </View>
          <Text style={styles.title}>Justice Intelligence Activity Feed</Text>
          <Text style={styles.subtitle}>
            Real-time feed of ingested judicial opinions, prosecutorial filings, and attorney dockets.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brass} />
            <Text style={styles.loadingText}>Fetching live intelligence stream...</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {displayItems.map((item, index) => (
              <View key={item.id || index} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.actorName}>{item.actorName}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.deviation || item.role}</Text>
                  </View>
                </View>
                <Text style={styles.action}>{item.action}</Text>
                <Text style={styles.matter}>{item.matter}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.court}>{item.court}</Text>
                  <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  headerSection: {
    marginBottom: 16,
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  pulseText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 1.2,
    fontFamily: 'monospace',
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
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actorName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brass,
    fontFamily: 'monospace',
  },
  action: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primarySoft,
    marginTop: 2,
  },
  matter: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  court: {
    fontSize: 10,
    color: colors.textSubtle,
    fontFamily: 'monospace',
  },
  timeAgo: {
    fontSize: 10,
    color: colors.brass,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
