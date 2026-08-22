import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { api } from '../services/api';
import type { SearchResults, SearchResultItem } from '../types';

export default function UniversalSearch() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'JUDGE' | 'ATTORNEY' | 'PROSECUTOR' | 'LEGISLATOR'>('ALL');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.search(query);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
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
    setQuery('');
    setResults(null);
    if (item.type === 'judge') navigation.navigate('JudgeProfile', { id: item.id });
    else if (item.type === 'attorney') navigation.navigate('AttorneyProfile', { id: item.id });
    else if (item.type === 'prosecutor') navigation.navigate('ProsecutorProfile', { id: item.id });
    else if (item.type === 'legislator') navigation.navigate('LegislatorProfile', { id: item.id });
    else if (item.type === 'case') navigation.navigate('CaseDetail', { id: item.id });
  };

  const filters = [
    { key: 'ALL', label: 'All' },
    { key: 'JUDGE', label: 'Judges' },
    { key: 'ATTORNEY', label: 'Attorneys' },
    { key: 'PROSECUTOR', label: 'Prosecutors' },
    { key: 'CASE', label: 'Cases' },
    { key: 'LEGISLATOR', label: 'Congress' },
  ];

  return (
    <View style={styles.container}>
      {/* Search Input Box */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Search judges, attorneys, prosecutors..."
          placeholderTextColor={colors.textSubtle}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.brass} style={styles.loader} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
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
      </View>

      {/* Live Autocomplete Results Dropdown */}
      {query.trim().length > 0 && (
        <View style={styles.resultsDropdown}>
          {loading && allItems.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={colors.brass} />
              <Text style={styles.emptyText}>Searching court records...</Text>
            </View>
          ) : allItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No matching legal records found for &quot;{query}&quot;</Text>
            </View>
          ) : (
            <ScrollView style={styles.resultsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {allItems.map((item) => (
                <TouchableOpacity
                  key={`${item.type}-${item.id}`}
                  style={styles.resultItem}
                  onPress={() => handleSelectItem(item)}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemCourt}>
                    {item.court || item.office || (item.chamber ? `${item.party} · ${item.state}` : item.jurisdiction)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    zIndex: 100,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: 14,
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 6,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  resultsDropdown: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 240,
    overflow: 'hidden',
  },
  resultsList: {
    padding: 6,
  },
  resultItem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  typeBadge: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.brass,
    fontFamily: 'monospace',
  },
  itemCourt: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
