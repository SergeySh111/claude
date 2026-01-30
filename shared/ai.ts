export type AiFilters = {
  product: string;
  source: string;
  selectedCampaignId?: string | null;
};

export type AiWeekTrendPoint = {
  week: string;
  roas: number;
};

export type AiBenchmarks = {
  globalAverageROAS: number;
  globalAverageCPI: number;
  weeklyTrend: AiWeekTrendPoint[];
};

export type AiTopPerformer = {
  name: string;
  roas: number;
  spend: number;
  profit: number;
};

export type AiOutlier = {
  name: string;
  roas: number;
  deviation: number; // percentage difference from average
  reason: string;
};

export type AiDateContext = {
  reportPeriod: string; // "Nov 01, 2025 - Nov 30, 2025"
  validWeeks: string[]; // ["Week 44", "Week 45", ...]
  minDate: string; // "yyyy-MM-dd"
  maxDate: string; // "yyyy-MM-dd"
};

/**
 * Canonical deterministic AI analytics snapshot sent from frontend to backend.
 * This is intentionally aggregate-only (no raw CSV rows).
 */
export type CanonicalAnalyticsSnapshot = {
  meta: AiDateContext;
  benchmarks: AiBenchmarks;
  topPerformers: AiTopPerformer[];
  underperformers: AiTopPerformer[];
  outliers: AiOutlier[];
};

export type AiAnalyzeRequest = {
  question: string;
  filters: AiFilters;
  analytics: CanonicalAnalyticsSnapshot;
};

export type AiAnalyzeResponse =
  | { ok: true; answerMarkdown: string }
  | { ok: false; error: string };

