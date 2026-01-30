import { getISOWeek, startOfISOWeek, endOfISOWeek, format, addDays, parseISO } from 'date-fns';

export interface RawCampaignData {
  Date?: string;
  Campaign: string;
  'Media source'?: string;
  Cost: string | number;
  revenue_payme: string | number;
  gross_profit_payme: string | number;
  roas_payme: string | number;
  'Installs appsflyer': string | number;
  'Unique users ltv days cumulative appsflyer af_card_add_fin': string | number;
  'Unique users ltv days cumulative appsflyer af_s2s_subscription_activated': string | number;
  'eCPI appsflyer': string | number;
  source?: string; // Enriched field
  [key: string]: any;
}

export interface ProcessedCampaign {
  id: string;
  rank: number;
  globalRank: number;
  category: 'Reach' | 'PaymePlus' | 'P2P' | 'Payments' | 'Other';
  campaignName: string;
  mediaSource: string;
  normalizedSource: 'Facebook' | 'Google' | 'Bigo' | 'Other'; // New field
  cost: number;
  revenue: number;
  profit: number;
  roas: number;
  installs: number;
  cards: number;
  cpaCards: number;
  subs: number;
  cpaSubs: number;
  cpi: number;
  piScore: number;
}

export interface ChartDataPoint {
  date: string;
  dailyCost: number;
  dailyRevenue: number;
  dailyInstalls: number;
  dailyCards: number;
  dailySubs: number;
  cumulativeCost: number;
  cumulativeRevenue: number;
  netProfit: number;
}

export interface CohortDataPoint {
  day: number;
  [key: string]: number | string | null;
}

export interface ProductSplit {
  product: "P2P" | "PaymePlus" | "Payments" | "Reach";
  value: number;
  percentage: number;
}

export interface DashboardMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalProfit: number;
  avgRoas: number;
  totalInstalls: number;
  avgCpi: number;
  totalCards: number;
  avgCpaCards: number;
  totalSubs: number;
  avgCpaSubs: number;
  spendSplit: ProductSplit[];
  revenueSplit: ProductSplit[];
  profitSplit: ProductSplit[];
  installsSplit: ProductSplit[];
  cardsSplit: ProductSplit[];
  subsSplit: ProductSplit[];
}

const API_URL = '/api';

// Helper to parse numbers
const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = val.toString().replace(/[^0-9.-]+/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Helper to determine category
const determineCategory = (campaignName: string): ProcessedCampaign['category'] => {
  const name = (campaignName || '').toLowerCase();
  
  // Debug logging for PFM campaigns
  if (name.includes('pfm')) {
    console.log('🔍 PFM Campaign detected:', campaignName, '→ lowercase:', name);
  }
  
  if (name.includes('reach')) return 'Reach';
  if (name.includes('paymeplus') || name.includes('pfm') || name.includes('sub')) {
    if (name.includes('pfm')) {
      console.log('✅ Categorizing as PaymePlus:', campaignName);
    }
    return 'PaymePlus';
  }
  if (name.includes('p2p') || name.includes('transfer')) return 'P2P';
  if (name.includes('payment')) return 'Payments';
  
  // Debug: Log campaigns that fall through to Other
  if (name.includes('pfm')) {
    console.log('❌ PFM campaign fell through to Other:', campaignName);
  }
  
  return 'Other';
};

// Helper to normalize media source
const normalizeSource = (source: string): ProcessedCampaign['normalizedSource'] => {
  const s = (source || '').toLowerCase();
  if (s.includes('facebook') || s.includes('instagram') || s.includes('meta')) return 'Facebook';
  if (s.includes('google') || s.includes('youtube') || s.includes('gdn')) return 'Google';
  if (s.includes('bigo')) return 'Bigo';
  return 'Other';
};

// Helper to get ISO Week Info using date-fns
const getISOWeekInfo = (dateStr: string): { weekNum: number; label: string; startDate: Date } => {
  const date = parseISO(dateStr);
  const weekNum = getISOWeek(date);
  const startDate = startOfISOWeek(date);
  const endDate = endOfISOWeek(date);
  
  const label = `Week ${weekNum} (${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')})`;
  
  return { weekNum, label, startDate };
};

// 1. Parse CSV (Backend)
export const parseCSV = async (file: File, type: 'summary' | 'daily'): Promise<{ rawData: RawCampaignData[]; dateRange: string; processedData?: any }> => {
  const formData = new FormData();
  formData.append('file', file);
  const endpoint = type === 'summary' ? '/process-summary' : '/process-daily';
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Error processing file: ${response.status} ${response.statusText}`);
    }
    
    if (type === 'summary') {
      // Add globalRank and normalizedSource to processed campaigns
      const campaignsWithRank = result.campaigns.map((c: any, i: number) => ({
        ...c,
        globalRank: i + 1,
        normalizedSource: normalizeSource(c.mediaSource)
      }));
      return { rawData: [], dateRange: 'Unknown Period', processedData: campaignsWithRank };
    }
    
    return {
      rawData: result.rawData || [],
      dateRange: result.dateRange || 'Unknown Period',
      processedData: result
    };
  } catch (error) {
    console.error("Backend processing error:", error);
    throw error;
  }
};

// 2. Client-Side Aggregation Logic
export const aggregateData = (
  summaryCampaigns: ProcessedCampaign[], 
  dailyRawData: RawCampaignData[], 
  filterCategory: string,
  filterSource: string, // New parameter
  selectedCampaignId: string | null
): { 
  campaigns: ProcessedCampaign[]; 
  chartData: ChartDataPoint[];
  cohortData: CohortDataPoint[];
  weekLabels: string[];
} => {
  
  // --- Create Source Lookup Map ---
  const campaignSourceMap = new Map<string, string>();
  summaryCampaigns.forEach(c => {
    campaignSourceMap.set(c.campaignName, c.normalizedSource);
  });

  // --- A. Filter Summary Table ---
  let filteredCampaigns = summaryCampaigns;
  
  // Filter by Category
  if (filterCategory !== 'All') {
    filteredCampaigns = filteredCampaigns.filter(c => c.category === filterCategory);
  }
  
  // Filter by Source
  if (filterSource !== 'All') {
    filteredCampaigns = filteredCampaigns.filter(c => c.normalizedSource === filterSource);
  }
  
  // --- B. Filter Daily Data (The Core Logic) ---
  let activeDailyData = dailyRawData;

  // Enrich daily data with source
  const enrichedDailyData = dailyRawData.map(row => ({
    ...row,
    source: campaignSourceMap.get(row.Campaign) || 'Other'
  }));

  if (selectedCampaignId) {
    // Level 3: Campaign State
    activeDailyData = enrichedDailyData.filter(row => row.Campaign === selectedCampaignId);
  } else {
    // Level 2: Matrix Filtering (Product + Source)
    activeDailyData = enrichedDailyData.filter(row => {
      const cat = determineCategory(row.Campaign || '');
      const src = row.source || 'Other';
      
      const catMatch = filterCategory === 'All' || cat === filterCategory;
      const srcMatch = filterSource === 'All' || src === filterSource;
      
      return catMatch && srcMatch;
    });
  }

  // --- C. Recalculate Cohorts Dynamically ---
  const weekMap = new Map<string, { label: string; cost: number; revenueByDay: number[]; startDate: Date }>();
  const dateMap = new Map<string, { cost: number; revenue: number; installs: number; cards: number; subs: number }>();
  
  // Find Max Date in the entire dataset (ReportMaxDate)
  let reportMaxDate = new Date(0);
  dailyRawData.forEach(row => {
    if (row.Date) {
      const d = parseISO(row.Date);
      if (d > reportMaxDate) reportMaxDate = d;
    }
  });

  activeDailyData.forEach(row => {
    const cost = parseNumber(row.Cost);
    const revenue = parseNumber(row.revenue_payme);
    const installs = parseNumber(row['Installs appsflyer']);
    const cards = parseNumber(row['Unique users ltv days cumulative appsflyer af_card_add_fin']);
    const subs = parseNumber(row['Unique users ltv days cumulative appsflyer af_s2s_subscription_activated']);
    const date = row.Date;

    if (date) {
      // 1. Trend Data
      if (!dateMap.has(date)) {
        dateMap.set(date, { cost: 0, revenue: 0, installs: 0, cards: 0, subs: 0 });
      }
      const day = dateMap.get(date)!;
      day.cost += cost;
      day.revenue += revenue;
      day.installs += installs;
      day.cards += cards;
      day.subs += subs;

      // 2. Cohort Data (ISO Weeks)
      const { weekNum, label, startDate } = getISOWeekInfo(date);
      const weekKey = `week${weekNum}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { label, cost: 0, revenueByDay: Array(31).fill(0), startDate });
      }
      const weekData = weekMap.get(weekKey)!;
      weekData.cost += cost;
      
      // Calculate Business Revenue (0.7% Transfer, 0.635% Purchase)
      for (let i = 0; i <= 30; i++) {
        const transferKey = Object.keys(row).find(k => k.includes(`Revenue ${i} days`) && k.includes('af_transfer_completed'));
        const purchaseKey = Object.keys(row).find(k => k.includes(`Revenue ${i} days`) && k.includes('af_purchase'));
        
        const transferRev = transferKey ? parseNumber(row[transferKey]) : 0;
        const purchaseRev = purchaseKey ? parseNumber(row[purchaseKey]) : 0;
        
        const bizRev = (transferRev * 0.007) + (purchaseRev * 0.00635);
        weekData.revenueByDay[i] += bizRev;
      }
    }
  });

  // --- D. Format Outputs ---
  
  // Chart Data
  const sortedDates = Array.from(dateMap.keys()).sort();
  let cumulativeCost = 0;
  let cumulativeRevenue = 0;
  
  const chartData: ChartDataPoint[] = sortedDates.map(date => {
    const dayData = dateMap.get(date)!;
    cumulativeCost += dayData.cost;
    cumulativeRevenue += dayData.revenue;
    return {
      date,
      dailyCost: dayData.cost,
      dailyRevenue: dayData.revenue,
      dailyInstalls: dayData.installs,
      dailyCards: dayData.cards,
      dailySubs: dayData.subs,
      cumulativeCost,
      cumulativeRevenue,
      netProfit: cumulativeRevenue - cumulativeCost
    };
  });

  // Cohort Data
  const sortedWeekKeys = Array.from(weekMap.keys()).sort();
  const weekLabels = sortedWeekKeys.map(key => weekMap.get(key)!.label);
  
  const cohortData: CohortDataPoint[] = Array.from({ length: 31 }, (_, i) => {
    const point: CohortDataPoint = { day: i };
    sortedWeekKeys.forEach(key => {
      const weekData = weekMap.get(key)!;
      
      // Smart Cut-off Logic
      const realDate = addDays(weekData.startDate, i);
      
      if (realDate > reportMaxDate) {
        point[weekData.label] = null; // Stop drawing if future date
      } else {
        // Avoid division by zero
        point[weekData.label] = weekData.cost > 0 ? (weekData.revenueByDay[i] / weekData.cost) * 100 : null;
      }
    });
    return point;
  });

  return { campaigns: filteredCampaigns, chartData, cohortData, weekLabels };
};

export const calculateMetrics = (data: ProcessedCampaign[]): DashboardMetrics => {
  const totalSpend = data.reduce((sum, item) => sum + item.cost, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
  const totalInstalls = data.reduce((sum, item) => sum + item.installs, 0);
  const totalCards = data.reduce((sum, item) => sum + item.cards, 0);
  const totalSubs = data.reduce((sum, item) => sum + item.subs, 0);
  
  const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend) * 100 : 0;
  const avgCpi = totalInstalls > 0 ? totalSpend / totalInstalls : 0;
  const avgCpaCards = totalCards > 0 ? totalSpend / totalCards : 0;
  const avgCpaSubs = totalSubs > 0 ? totalSpend / totalSubs : 0;

  // Calculate product splits
  const calculateSplit = (metric: 'cost' | 'revenue' | 'profit' | 'installs' | 'cards' | 'subs'): ProductSplit[] => {
    const products: Array<"P2P" | "PaymePlus" | "Payments" | "Reach"> = ["P2P", "PaymePlus", "Payments", "Reach"];
    const splits: ProductSplit[] = [];
    
    products.forEach(product => {
      const productData = data.filter(item => item.category === product);
      const value = productData.reduce((sum, item) => sum + item[metric], 0);
      splits.push({ product, value, percentage: 0 });
    });

    const total = splits.reduce((sum, s) => sum + s.value, 0);
    if (total > 0) {
      splits.forEach(s => {
        s.percentage = (s.value / total) * 100;
      });
    }

    return splits.filter(s => s.value > 0);
  };

  return {
    totalSpend,
    totalRevenue,
    totalProfit,
    avgRoas,
    totalInstalls,
    avgCpi,
    totalCards,
    avgCpaCards,
    totalSubs,
    avgCpaSubs,
    spendSplit: calculateSplit('cost'),
    revenueSplit: calculateSplit('revenue'),
    profitSplit: calculateSplit('profit'),
    installsSplit: calculateSplit('installs'),
    cardsSplit: calculateSplit('cards'),
    subsSplit: calculateSplit('subs'),
  };
};
