import { CohortDataPoint, ProcessedCampaign, RawCampaignData } from "./data-processor";
import { getISOWeek, getYear, parse, format, min, max } from "date-fns";

export interface Benchmarks {
  globalAverageROAS: number;
  globalAverageCPI: number;
  weeklyTrend: { week: string; roas: number }[];
}

export interface TopPerformer {
  name: string;
  roas: number;
  spend: number;
  profit: number;
}

export interface Outlier {
  name: string;
  roas: number;
  deviation: number; // percentage difference from average
  reason: string;
}

export interface DateContext {
  reportPeriod: string; // "Nov 01, 2025 - Nov 30, 2025"
  validWeeks: string[]; // ["Week 44", "Week 45", "Week 46"]
  minDate: string;
  maxDate: string;
}

export interface AnalysisPayload {
  meta: DateContext;
  benchmarks: Benchmarks;
  topPerformers: TopPerformer[];
  underperformers: TopPerformer[];
  outliers: Outlier[];
}

/**
 * Calculate weighted average ROAS across all campaigns
 */
export function calculateGlobalROAS(campaigns: ProcessedCampaign[]): number {
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0);
  
  if (totalCost === 0) return 0;
  return (totalRevenue / totalCost) * 100;
}

/**
 * Calculate weighted average CPI across all campaigns
 */
export function calculateGlobalCPI(campaigns: ProcessedCampaign[]): number {
  const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0);
  const totalInstalls = campaigns.reduce((sum, c) => sum + c.installs, 0);
  
  if (totalInstalls === 0) return 0;
  return totalCost / totalInstalls;
}

/**
 * Calculate ROAS trend for the last 3 weeks from cohort data
 */
export function calculateWeeklyTrend(
  cohortData: CohortDataPoint[],
  weekLabels: string[]
): { week: string; roas: number }[] {
  // Take last 3 weeks
  const lastThreeWeeks = cohortData.slice(-3);
  
  return lastThreeWeeks.map((cohort, index) => {
    const weekIndex = cohortData.length - 3 + index;
    const weekLabel = weekLabels[weekIndex] || `Week ${weekIndex + 1}`;
    
    // Get the final ROAS value (day 30) for this cohort
    const roasValue = cohort.day30 || 0;
    const roasNumber = typeof roasValue === 'string' ? parseFloat(roasValue) : roasValue;
    
    return {
      week: weekLabel,
      roas: roasNumber,
    };
  });
}

/**
 * Detect outlier campaigns (>20% deviation from average ROAS)
 */
export function detectOutliers(
  campaigns: ProcessedCampaign[],
  globalROAS: number
): Outlier[] {
  const threshold = 0.2; // 20% deviation
  const outliers: Outlier[] = [];

  campaigns.forEach((campaign) => {
    const deviation = ((campaign.roas - globalROAS) / globalROAS);
    
    if (Math.abs(deviation) > threshold) {
      outliers.push({
        name: campaign.campaignName,
        roas: campaign.roas,
        deviation: deviation * 100,
        reason: deviation > 0 
          ? `${Math.abs(deviation * 100).toFixed(0)}% above average`
          : `${Math.abs(deviation * 100).toFixed(0)}% below average`,
      });
    }
  });

  // Sort by absolute deviation (most extreme first)
  return outliers.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
}

/**
 * Calculate date range and valid ISO weeks from raw data
 */
export function calculateDateContext(dailyData: RawCampaignData[]): DateContext {
  const dates: Date[] = [];
  const weekSet = new Set<string>();

  dailyData.forEach((row) => {
    if (row.Date) {
      try {
        const parsedDate = parse(row.Date, 'yyyy-MM-dd', new Date());
        if (!isNaN(parsedDate.getTime())) {
          dates.push(parsedDate);
          const weekNum = getISOWeek(parsedDate);
          const year = getYear(parsedDate);
          weekSet.add(`Week ${weekNum}`);
        }
      } catch (e) {
        // Skip invalid dates
      }
    }
  });

  if (dates.length === 0) {
    return {
      reportPeriod: "Unknown",
      validWeeks: [],
      minDate: "",
      maxDate: "",
    };
  }

  const minDate = min(dates);
  const maxDate = max(dates);

  return {
    reportPeriod: `${format(minDate, 'MMM dd, yyyy')} - ${format(maxDate, 'MMM dd, yyyy')}`,
    validWeeks: Array.from(weekSet).sort((a, b) => {
      const numA = parseInt(a.replace('Week ', ''));
      const numB = parseInt(b.replace('Week ', ''));
      return numA - numB;
    }),
    minDate: format(minDate, 'yyyy-MM-dd'),
    maxDate: format(maxDate, 'yyyy-MM-dd'),
  };
}

/**
 * Prepare complete analysis payload for AI
 */
export function prepareAnalysisPayload(
  campaigns: ProcessedCampaign[],
  cohortData: CohortDataPoint[],
  weekLabels: string[],
  dailyData: RawCampaignData[]
): AnalysisPayload {
  const globalROAS = calculateGlobalROAS(campaigns);
  const globalCPI = calculateGlobalCPI(campaigns);
  const weeklyTrend = calculateWeeklyTrend(cohortData, weekLabels);

  // Sort by profit to get top and bottom performers
  const sortedByProfit = [...campaigns].sort((a, b) => b.profit - a.profit);

  const topPerformers = sortedByProfit.slice(0, 3).map((c) => ({
    name: c.campaignName,
    roas: c.roas,
    spend: c.cost,
    profit: c.profit,
  }));

  const underperformers = sortedByProfit.slice(-3).reverse().map((c) => ({
    name: c.campaignName,
    roas: c.roas,
    spend: c.cost,
    profit: c.profit,
  }));

  const outliers = detectOutliers(campaigns, globalROAS);
  const dateContext = calculateDateContext(dailyData);

  return {
    meta: dateContext,
    benchmarks: {
      globalAverageROAS: globalROAS,
      globalAverageCPI: globalCPI,
      weeklyTrend,
    },
    topPerformers,
    underperformers,
    outliers: outliers.slice(0, 5), // Limit to top 5 outliers
  };
}
