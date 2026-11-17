import { useCallback, useEffect, useRef, useState } from 'react';

export interface PageResult<T> {
  results: T[];
  count?: number;
  next: string | null;
}

/**
 * Cursor pagination for infinite lists. `fetchPage(null)` loads the first
 * page; subsequent calls receive the API's `next` URL.
 */
export function usePaginated<T>(fetchPage: (next: string | null) => Promise<PageResult<T>>, deps: unknown[]) {
  const [items, setItems] = useState<T[]>([]);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  useEffect(() => {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    fetchRef
      .current(null)
      .then((p) => {
        if (id !== seq.current) return;
        setItems(p.results);
        setCount(p.count);
        setNext(p.next);
      })
      .catch((e) => {
        if (id === seq.current) {
          setError(e);
          setItems([]);
          setNext(null);
        }
      })
      .finally(() => {
        if (id === seq.current) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const loadMore = useCallback(() => {
    if (!next || loadingMore || loading) return;
    const id = seq.current;
    setLoadingMore(true);
    fetchRef
      .current(next)
      .then((p) => {
        if (id !== seq.current) return;
        setItems((prev) => [...prev, ...p.results]);
        setNext(p.next);
      })
      .catch(() => {
        /* keep existing items; user can retry by scrolling */
      })
      .finally(() => setLoadingMore(false));
  }, [next, loadingMore, loading]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setTick((t) => t + 1);
  }, []);

  return { items, count, hasMore: !!next, loading, loadingMore, refreshing, error, loadMore, refresh };
}
