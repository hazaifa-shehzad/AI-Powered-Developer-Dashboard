"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AITipData {
  title?: string;
  tip: string;
  category?: string;
  source?: string;
}

interface UseAIOptions {
  topic?: string;
  enabled?: boolean;
  autoFetch?: boolean;
}

interface UseAIResult {
  data: AITipData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAI(options: UseAIOptions = {}): UseAIResult {
  const { topic, enabled = true, autoFetch = true } = options;
  const [data, setData] = useState<AITipData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchAITip = useCallback(async () => {
    if (!enabled) return;

    const isFirstLoad = !hasLoadedRef.current;
    setError(null);
    setIsLoading(isFirstLoad);
    setIsRefreshing(!isFirstLoad);

    try {
      const query = topic?.trim()
        ? `?topic=${encodeURIComponent(topic.trim())}`
        : "";

      const response = await fetch(`/api/ai-tip${query}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to fetch AI tip.");
      }

      const aiTip = (await response.json()) as AITipData;
      setData(aiTip);
      hasLoadedRef.current = true;
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Something went wrong while loading the AI tip.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [enabled, topic]);

  useEffect(() => {
    if (!autoFetch) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAITip();
  }, [autoFetch, fetchAITip]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch: fetchAITip,
  };
}

export default useAI;
