import { create } from "zustand";

import type { AiTip } from "@/types/ai";
import type { ChartRange, DashboardCharts } from "@/types/charts";
import type { GitHubDashboardPayload, GitHubRepository } from "@/types/github";
import type { MotivationalQuote } from "@/types/quote";
import type { TemperatureUnit, WeatherApiResponse } from "@/types/weather";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface SectionState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
}

export interface DashboardStore {
  username: string;
  selectedRepo: string | null;
  chartRange: ChartRange;
  temperatureUnit: TemperatureUnit;
  lastUpdatedAt: string | null;

  github: SectionState<GitHubDashboardPayload>;
  weather: SectionState<WeatherApiResponse>;
  quote: SectionState<MotivationalQuote>;
  aiTip: SectionState<AiTip>;
  charts: SectionState<DashboardCharts>;

  setUsername: (username: string) => void;
  setSelectedRepo: (repoName: string | null) => void;
  setChartRange: (range: ChartRange) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;

  setGithubData: (payload: GitHubDashboardPayload) => void;
  setWeatherData: (payload: WeatherApiResponse) => void;
  setQuoteData: (payload: MotivationalQuote) => void;
  setAiTipData: (payload: AiTip) => void;
  setChartsData: (payload: DashboardCharts) => void;

  setGithubStatus: (status: AsyncStatus, error?: string | null) => void;
  setWeatherStatus: (status: AsyncStatus, error?: string | null) => void;
  setQuoteStatus: (status: AsyncStatus, error?: string | null) => void;
  setAiTipStatus: (status: AsyncStatus, error?: string | null) => void;
  setChartsStatus: (status: AsyncStatus, error?: string | null) => void;

  getSelectedRepository: () => GitHubRepository | null;
  resetDashboard: () => void;
}

const createSectionState = <T>(data: T | null = null): SectionState<T> => ({
  data,
  status: "idle",
  error: null,
});

const initialState = {
  username: "",
  selectedRepo: null,
  chartRange: "30d" as ChartRange,
  temperatureUnit: "metric" as TemperatureUnit,
  lastUpdatedAt: null,
  github: createSectionState<GitHubDashboardPayload>(),
  weather: createSectionState<WeatherApiResponse>(),
  quote: createSectionState<MotivationalQuote>(),
  aiTip: createSectionState<AiTip>(),
  charts: createSectionState<DashboardCharts>(),
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  ...initialState,

  setUsername: (username) => {
    set({ username: username.trim() });
  },

  setSelectedRepo: (repoName) => {
    set({ selectedRepo: repoName });
  },

  setChartRange: (range) => {
    set({ chartRange: range });
  },

  setTemperatureUnit: (unit) => {
    set({ temperatureUnit: unit });
  },

  setGithubData: (payload) => {
    set((state) => ({
      github: {
        data: payload,
        status: "success",
        error: null,
      },
      selectedRepo:
        state.selectedRepo &&
        payload.repositories.some((repo) => repo.name === state.selectedRepo)
          ? state.selectedRepo
          : payload.repositories[0]?.name ?? null,
      lastUpdatedAt: new Date().toISOString(),
    }));
  },

  setWeatherData: (payload) => {
    set({
      weather: {
        data: payload,
        status: "success",
        error: null,
      },
      temperatureUnit: payload.unit,
      lastUpdatedAt: new Date().toISOString(),
    });
  },

  setQuoteData: (payload) => {
    set({
      quote: {
        data: payload,
        status: "success",
        error: null,
      },
      lastUpdatedAt: new Date().toISOString(),
    });
  },

  setAiTipData: (payload) => {
    set({
      aiTip: {
        data: payload,
        status: "success",
        error: null,
      },
      lastUpdatedAt: new Date().toISOString(),
    });
  },

  setChartsData: (payload) => {
    set({
      charts: {
        data: payload,
        status: "success",
        error: null,
      },
      lastUpdatedAt: new Date().toISOString(),
    });
  },

  setGithubStatus: (status, error = null) => {
    set((state) => ({
      github: {
        ...state.github,
        status,
        error,
      },
    }));
  },

  setWeatherStatus: (status, error = null) => {
    set((state) => ({
      weather: {
        ...state.weather,
        status,
        error,
      },
    }));
  },

  setQuoteStatus: (status, error = null) => {
    set((state) => ({
      quote: {
        ...state.quote,
        status,
        error,
      },
    }));
  },

  setAiTipStatus: (status, error = null) => {
    set((state) => ({
      aiTip: {
        ...state.aiTip,
        status,
        error,
      },
    }));
  },

  setChartsStatus: (status, error = null) => {
    set((state) => ({
      charts: {
        ...state.charts,
        status,
        error,
      },
    }));
  },

  getSelectedRepository: () => {
    const { github, selectedRepo } = get();

    if (!github.data || !selectedRepo) {
      return null;
    }

    return github.data.repositories.find((repo) => repo.name === selectedRepo) ?? null;
  },

  resetDashboard: () => {
    set({ ...initialState });
  },
}));
