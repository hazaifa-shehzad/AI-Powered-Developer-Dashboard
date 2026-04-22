export type TemperatureUnit = "metric" | "imperial";

export interface WeatherCoordinates {
  lat: number;
  lon: number;
}

export interface WeatherLocation {
  name: string;
  country: string;
  state?: string | null;
  timezone?: string | null;
  coordinates?: WeatherCoordinates;
}

export interface WeatherCondition {
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  tempMin?: number;
  tempMax?: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg?: number;
  visibility?: number;
  sunrise?: string;
  sunset?: string;
  cloudiness?: number;
  condition: WeatherCondition;
  observedAt: string;
}

export interface WeatherForecastDay {
  date: string;
  min: number;
  max: number;
  humidity: number;
  precipitationChance?: number;
  windSpeed?: number;
  condition: WeatherCondition;
}

export interface WeatherForecastHour {
  time: string;
  temperature: number;
  precipitationChance?: number;
  windSpeed?: number;
  condition: WeatherCondition;
}

export interface WeatherApiResponse {
  location: WeatherLocation;
  unit: TemperatureUnit;
  current: CurrentWeather;
  hourly?: WeatherForecastHour[];
  daily?: WeatherForecastDay[];
}
