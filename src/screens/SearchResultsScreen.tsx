import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import Header from '../components/Header';
import { api } from '../services/api';
import type { SearchResults, SearchResultItem } from '../types';

export default function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialCategory = route.params?.initialCategory || 'ALL';

  const [query, setQuery] = useState(route.params?.query || '');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'JUDGE' | 'ATTORNEY' | 'PROSECUTOR' | 'LEGISLATOR' | 'CASE'>(
    initialCategory === 'judges'
      ? 'JUDGE'
      : initialCategory === 'attorneys'
      ? 'ATTORNEY'
      : initialCategory === 'prosecutors'
      ? 'PROSECUTOR'
      : initialCategory === 'legislators'
      ? 'LEGISLATOR'
      : initialCategory === 'cases'
      ? 'CASE'
      : 'ALL'
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .search(query)
      .then((res) => {
        if (mounted) setResults(res);
      })
      .catch((err) => console.error('Search error:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [query]);

  const allItems: SearchResultItem[] = React.useMemo(() => {
    if (!results) return [];
    const arr: SearchResultItem[] = [];
    if (selectedFilter === 'ALL' || selectedFilter === 'JUDGE') {
      (results.judges || []).forEach((j) => arr.push({ ...j, type: 'judge' }));
    }
    if (selectedFilter === 'ALL' || selectedFilter === 'ATTORNEY') {
      (results.attorneys || []).forEach((a) => arr.push({ ...a, type: 'attorney' }));
    }
    if (selectedFilter === 'ALL' || selectedFilter === 'PROSECUTOR') {
      (results.prosecutors || []).forEach((p) => arr.push({ ...p, type: 'prosecutor' }));
    }
    if (selectedFilter === 'ALL' || selectedFilter === 'LEGISLATOR') {
      (results.legislators || []).forEach((l) => arr.push({ ...l, type: 'legislator' }));
    }
    if (selectedFilter === 'ALL' || selectedFilter === 'CASE') {
      (results.cases || []).forEach((c) => arr.push({ ...c, type: 'case' }));
    }
    return arr;
  }, [results, selectedFilter]);

  const handleSelectItem = (item: SearchResultItem) => {
    if (item.type === 'judge') navigation.navigate('JudgeProfile', { id: item.id });
    else if (item.type === 'attorney') navigation.navigate('AttorneyProfile', { id: item.id });
    else if (item.type === 'prosecutor') navigation.navigate('ProsecutorProfile', { id: item.id });
    else if (item.type === 'legislator') navigation.navigate('LegislatorProfile', { id: item.id });
    else if (item.type === 'case') navigation.navigate('CaseDetail', { id: item.id });
  };

  const filters = [
    { key: 'ALL', label: 'All Records' },
    { key: 'JUDGE', label: 'Judges' },
    { key: 'ATTORNEY', label: 'Attorneys' },
    { key: 'PROSECUTOR', label: 'Prosecutors' },
    { key: 'CASE', label: 'Cases' },
    { key: 'LEGISLATOR', label: 'Congress' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <View style={styles.container}>
        {/* Search Header */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, court, or office..."
            placeholderTextColor={colors.textSubtle}
            value={query}
            onChangeText={setQuery}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, selectedFilter === f.key && styles.filterPillActive]}
                onPress={() => setSelectedFilter(f.key as any)}
              >
                <Text style={[styles.filterText, selectedFilter === f.key && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brass} />
            <Text style={styles.loadingText}>Searching legal intelligence database...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.resultsList}>
            <Text style={styles.resultsCount}>
              Showing {allItems.length} indexed {selectedFilter.toLowerCase()} records
            </Text>

            {allItems.map((item) => (
              <TouchableOpacity
                key={`${item.type}-${item.id}`}
                style={styles.resultCard}
                activeOpacity={0.7}
                onPress={() => handleSelectItem(item)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.court}>
                  {item.court || item.office || (item.chamber ? `${item.party} &bull; ${item.state}` : item.jurisdiction)}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.viewProfile}>View Profile & Analytics &rsaquo;</Text>
                </View>
              </TouchableOpacity>
            ))}

            {allItems.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No records found matching your query.</Text>
              </View>
            )}
          </ScrollView>
        )}
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
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterPillActive: {
    backgroundColor: colors.brass,
    borderColor: colors.brass,
  },
  filterText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  filterTextActive: {
    color: colors.textDark,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  resultsList: {
    padding: 16,
    gap: 12,
  },
  resultsCount: {
    fontSize: 11,
    color: colors.textSubtle,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  resultCard: {
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
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  typeBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brass,
    fontFamily: 'monospace',
  },
  court: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewProfile: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brass,
    fontFamily: 'monospace',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
});
