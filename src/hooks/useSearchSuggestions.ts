import { useEffect, useRef, useState } from 'react';
import { searchSuggestions } from '../api/search';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';

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

    // Show local fallback immediately while waiting for debounce
    const localMatches = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
      item.toLowerCase().includes(trimmed.toLowerCase())
    );
    setSuggestions(localMatches);

    setLoading(true);
    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      searchSuggestions(trimmed)
        .then((res) => {
          if (controller.signal.aborted) return;
          const texts = res.suggestions.map((s) => s.text);
          setSuggestions(texts.length > 0 ? texts : localMatches);
          setLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          // Fallback to local hardcoded suggestions on API failure
          setSuggestions(localMatches);
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
