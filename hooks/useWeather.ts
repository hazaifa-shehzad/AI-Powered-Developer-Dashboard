"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface WeatherData {
  city: string;
  country?: string;
  temperature: number;
  feelsLike?: number;
  condition: string;
  description?: string;
  humidity?: number;
  windSpeed?: number;
  icon?: string;
  localTime?: string;
}

interface UseWeatherOptions {
  city?: string;
  enabled?: boolean;
}

interface UseWeatherResult {
  data: WeatherData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWeather(options: UseWeatherOptions = {}): UseWeatherResult {
  const { city, enabled = true } = options;
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchWeather = useCallback(async () => {
    if (!enabled || !city?.trim()) {
      hasLoadedRef.current = false;
      setData(null);
      setError(null);
      return;
    }

    const isFirstLoad = !hasLoadedRef.current;
    setError(null);
    setIsLoading(isFirstLoad);
    setIsRefreshing(!isFirstLoad);

    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(city)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to fetch weather data.");
      }

      const weather = (await response.json()) as WeatherData;
      setData(weather);
      hasLoadedRef.current = true;
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Something went wrong while loading weather.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [city, enabled]);

  useEffect(() => {
    void fetchWeather();
  }, [fetchWeather]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch: fetchWeather,
  };
}

export default useWeather;
