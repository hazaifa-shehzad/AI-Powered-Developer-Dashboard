import { NextRequest, NextResponse } from 'next/server';

const OPENWEATHER_GEOCODE_ENDPOINT = 'https://api.openweathermap.org/geo/1.0/direct';
const OPENWEATHER_CURRENT_ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather';
const OPEN_METEO_GEOCODE_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

interface GeocodeResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

interface WeatherResponse {
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  sys: {
    sunrise: number;
    sunset: number;
  };
  name: string;
}

interface OpenMeteoGeocodeResponse {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1?: string;
  }>;
}

interface OpenMeteoWeatherResponse {
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  daily?: {
    sunrise: string[];
    sunset: string[];
  };
}

function getWeatherDescription(code: number) {
  const map: Record<number, { condition: string; description: string; icon: string }> = {
    0: { condition: 'Clear', description: 'clear sky', icon: '01d' },
    1: { condition: 'Clear', description: 'mainly clear', icon: '02d' },
    2: { condition: 'Clouds', description: 'partly cloudy', icon: '03d' },
    3: { condition: 'Clouds', description: 'overcast', icon: '04d' },
    45: { condition: 'Mist', description: 'fog', icon: '50d' },
    48: { condition: 'Mist', description: 'depositing rime fog', icon: '50d' },
    51: { condition: 'Drizzle', description: 'light drizzle', icon: '09d' },
    53: { condition: 'Drizzle', description: 'moderate drizzle', icon: '09d' },
    55: { condition: 'Drizzle', description: 'dense drizzle', icon: '09d' },
    61: { condition: 'Rain', description: 'slight rain', icon: '10d' },
    63: { condition: 'Rain', description: 'moderate rain', icon: '10d' },
    65: { condition: 'Rain', description: 'heavy rain', icon: '10d' },
    71: { condition: 'Snow', description: 'slight snow', icon: '13d' },
    73: { condition: 'Snow', description: 'moderate snow', icon: '13d' },
    75: { condition: 'Snow', description: 'heavy snow', icon: '13d' },
    80: { condition: 'Rain', description: 'rain showers', icon: '09d' },
    81: { condition: 'Rain', description: 'moderate rain showers', icon: '09d' },
    82: { condition: 'Rain', description: 'violent rain showers', icon: '09d' },
    95: { condition: 'Storm', description: 'thunderstorm', icon: '11d' },
    96: { condition: 'Storm', description: 'thunderstorm with hail', icon: '11d' },
    99: { condition: 'Storm', description: 'severe thunderstorm with hail', icon: '11d' },
  };

  return map[code] ?? { condition: 'Unknown', description: 'weather data unavailable', icon: '01d' };
}

async function fetchFallbackWeather(city: string, units: 'metric' | 'imperial') {
  const geocodeUrl = `${OPEN_METEO_GEOCODE_ENDPOINT}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geocodeResponse = await fetch(geocodeUrl, { next: { revalidate: 1800 } });

  if (!geocodeResponse.ok) {
    throw new Error('Unable to geocode the provided city.');
  }

  const geocodeData = (await geocodeResponse.json()) as OpenMeteoGeocodeResponse;
  const location = geocodeData.results?.[0];

  if (!location) {
    return NextResponse.json({ error: 'City not found.' }, { status: 404 });
  }

  const temperatureUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
  const windSpeedUnit = units === 'imperial' ? 'mph' : 'kmh';
  const weatherUrl =
    `${OPEN_METEO_FORECAST_ENDPOINT}?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,is_day` +
    `&daily=sunrise,sunset&timezone=auto&temperature_unit=${temperatureUnit}&wind_speed_unit=${windSpeedUnit}`;
  const weatherResponse = await fetch(weatherUrl, { next: { revalidate: 600 } });

  if (!weatherResponse.ok) {
    throw new Error('Unable to fetch current weather.');
  }

  const weather = (await weatherResponse.json()) as OpenMeteoWeatherResponse;
  const current = weather.current;

  if (!current) {
    throw new Error('Unable to fetch current weather.');
  }

  const summary = getWeatherDescription(current.weather_code);
  const icon = summary.icon.replace('d', current.is_day ? 'd' : 'n');

  return NextResponse.json(
    {
      city: location.name,
      state: location.admin1 ?? null,
      country: location.country,
      coordinates: {
        lat: location.latitude,
        lon: location.longitude,
      },
      units,
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      sunrise: weather.daily?.sunrise?.[0] ? Math.floor(new Date(weather.daily.sunrise[0]).getTime() / 1000) : 0,
      sunset: weather.daily?.sunset?.[0] ? Math.floor(new Date(weather.daily.sunset[0]).getTime() / 1000) : 0,
      condition: summary.condition,
      description: summary.description,
      icon,
      iconUrl: `https://openweathermap.org/img/wn/${icon}@2x.png`,
      source: 'open-meteo',
    },
    { status: 200 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city')?.trim() ?? '';
    const units = searchParams.get('units')?.trim() === 'imperial' ? 'imperial' : 'metric';

    if (!city) {
      return NextResponse.json({ error: 'city query parameter is required.' }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return await fetchFallbackWeather(city, units);
    }

    const geocodeUrl = `${OPENWEATHER_GEOCODE_ENDPOINT}?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl, { next: { revalidate: 1800 } });

    if (!geocodeResponse.ok) {
      return NextResponse.json({ error: 'Unable to geocode the provided city.' }, { status: 502 });
    }

    const geocodeData = (await geocodeResponse.json()) as GeocodeResult[];
    const location = geocodeData[0];

    if (!location) {
      return NextResponse.json({ error: 'City not found.' }, { status: 404 });
    }

    const weatherUrl = `${OPENWEATHER_CURRENT_ENDPOINT}?lat=${location.lat}&lon=${location.lon}&units=${units}&appid=${apiKey}`;
    const weatherResponse = await fetch(weatherUrl, { next: { revalidate: 600 } });

    if (!weatherResponse.ok) {
      return NextResponse.json({ error: 'Unable to fetch current weather.' }, { status: 502 });
    }

    const weather = (await weatherResponse.json()) as WeatherResponse;
    const current = weather.weather[0];

    return NextResponse.json(
      {
        city: weather.name,
        state: location.state ?? null,
        country: location.country,
        coordinates: {
          lat: location.lat,
          lon: location.lon,
        },
        units,
        temperature: weather.main.temp,
        feelsLike: weather.main.feels_like,
        humidity: weather.main.humidity,
        windSpeed: weather.wind.speed,
        sunrise: weather.sys.sunrise,
        sunset: weather.sys.sunset,
        condition: current?.main ?? 'Unknown',
        description: current?.description ?? 'No description available',
        icon: current?.icon ?? '01d',
        iconUrl: `https://openweathermap.org/img/wn/${current?.icon ?? '01d'}@2x.png`,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to fetch weather data.' }, { status: 500 });
  }
}
