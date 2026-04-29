import { useEffect, useRef, useState } from 'react';
import { searchSuggestions } from '../api/search';

const DEBOUNCE_MS = 300;

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setSuggestions([]);

    setLoading(true);
    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      searchSuggestions(trimmed)
        .then((res) => {
          if (controller.signal.aborted) return;
          const texts = res.suggestions.map((s) => s.text);
          setSuggestions(texts);
          setLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  return { suggestions, loading };
}
