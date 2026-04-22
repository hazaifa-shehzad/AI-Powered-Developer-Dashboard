import { CloudSun, Droplets, Thermometer, Wind } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeatherData } from "@/types/dashboard";

interface WeatherCardProps {
  weather: WeatherData;
}

export function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Weather Snapshot</CardTitle>
            <CardDescription>{weather.location}</CardDescription>
          </div>
          <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <CloudSun className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{Math.round(weather.temperature)}°</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{weather.condition}</p>
          </div>
          {weather.localTime ? <Badge variant="secondary">{weather.localTime}</Badge> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Thermometer className="h-4 w-4" />
              Feels like
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{Math.round(weather.feelsLike ?? weather.temperature)}°</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Droplets className="h-4 w-4" />
              Humidity
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{weather.humidity ?? 0}%</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Wind className="h-4 w-4" />
              Wind
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{weather.windSpeed ?? 0} km/h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
