import { API_ROUTES } from "../constants/app";
import { getApiUrl, isServer } from "../config/env";

export type WeatherCondition = {
  id: number;
  main: string;
  description: string;
  icon: string;
};

export type CurrentWeather = {
  city: string;
  country: string;
  timezone: number;
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  visibility: number;
  windSpeed: number;
  sunrise?: number;
  sunset?: number;
  conditions: WeatherCondition[];
  fetchedAt: string;
};

type WeatherSearchParams = {
  city?: string;
  lat?: number;
  lon?: number;
};

type NextFetchOptions = {
  revalidate?: number;
  tags?: string[];
};

function buildUrl(path: string, searchParams?: Record<string, string | number | undefined>) {
  const url = new URL(
    isServer ? getApiUrl(path) : path,
    isServer ? undefined : window.location.origin,
  );

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return isServer ? `${getApiUrl(url.pathname)}${url.search}` : `${url.pathname}${url.search}`;
}

async function fetchJson<T>(
  path: string,
  searchParams?: Record<string, string | number | undefined>,
  next?: NextFetchOptions,
) {
  const response = await fetch(buildUrl(path, searchParams), {
    headers: {
      Accept: "application/json",
    },
    next,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(`Weather request failed (${response.status}): ${message}`);
  }

  return (await response.json()) as T;
}

export async function getWeather(params: WeatherSearchParams) {
  return fetchJson<CurrentWeather>(
    API_ROUTES.weather,
    {
    city: params.city,
    lat: params.lat,
      lon: params.lon,
    },
    { revalidate: 600 },
  );
}

export async function getWeatherByCity(city: string) {
  return getWeather({ city });
}

export async function getWeatherByCoordinates(lat: number, lon: number) {
  return getWeather({ lat, lon });
}
