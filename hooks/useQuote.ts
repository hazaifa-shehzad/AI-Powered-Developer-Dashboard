"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface QuoteData {
  content: string;
  author: string;
  tags?: string[];
}

interface UseQuoteOptions {
  enabled?: boolean;
  autoFetch?: boolean;
}

interface UseQuoteResult {
  data: QuoteData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuote(options: UseQuoteOptions = {}): UseQuoteResult {
  const { enabled = true, autoFetch = true } = options;
  const [data, setData] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchQuote = useCallback(async () => {
    if (!enabled) return;

    const isFirstLoad = !hasLoadedRef.current;
    setError(null);
    setIsLoading(isFirstLoad);
    setIsRefreshing(!isFirstLoad);

    try {
      const response = await fetch("/api/quote", {
        cache: "no-store",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to fetch quote.");
      }

      const quote = (await response.json()) as QuoteData;
      setData(quote);
      hasLoadedRef.current = true;
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Something went wrong while loading the quote.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!autoFetch) return;
    void fetchQuote();
  }, [autoFetch, fetchQuote]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch: fetchQuote,
  };
}

export default useQuote;
