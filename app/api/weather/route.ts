import { NextRequest, NextResponse } from 'next/server';

const OPENWEATHER_GEOCODE_ENDPOINT = 'https://api.openweathermap.org/geo/1.0/direct';
const OPENWEATHER_CURRENT_ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather';

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

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENWEATHER_API_KEY is missing in .env.local.' },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city')?.trim() ?? '';
    const units = searchParams.get('units')?.trim() === 'imperial' ? 'imperial' : 'metric';

    if (!city) {
      return NextResponse.json({ error: 'city query parameter is required.' }, { status: 400 });
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
