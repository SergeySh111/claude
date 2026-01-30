import { RawCampaignData } from "./data-processor";
import { parseISO, getISOWeek, isWithinInterval, parse } from "date-fns";

/**
 * Helper function to detect seasonality context based on date range
 */
function getSeasonalityContext(dateRangeStr: string): string {
  try {
    // Parse date range string (e.g., "Oct 28, 2024 - Nov 12, 2024")
    const parts = dateRangeStr.split(' - ');
    if (parts.length !== 2) return "Context: Standard business season.";
    
    const startDate = parse(parts[0].trim(), 'MMM dd, yyyy', new Date());
    const endDate = parse(parts[1].trim(), 'MMM dd, yyyy', new Date());
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return "Context: Standard business season.";
    }
    
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    // Black Friday Period (Nov 20-30)
    const blackFridayStart = new Date(startYear, 10, 20); // Month is 0-indexed
    const blackFridayEnd = new Date(startYear, 10, 30);
    
    // New Year Rush (Dec 20-31)
    const newYearStart = new Date(startYear, 11, 20);
    const newYearEnd = new Date(startYear, 11, 31);
    
    // Post-Holiday Slump (Jan 01-10) - use endYear since it's in January
    const postHolidayStart = new Date(endYear, 0, 1);
    const postHolidayEnd = new Date(endYear, 0, 10);
    
    // Check if date range overlaps with any seasonal period
    const overlapsBlackFriday = 
      (startDate <= blackFridayEnd && endDate >= blackFridayStart);
    const overlapsNewYear = 
      (startDate <= newYearEnd && endDate >= newYearStart);
    const overlapsPostHoliday = 
      (startDate <= postHolidayEnd && endDate >= postHolidayStart);
    
    if (overlapsBlackFriday) {
      return "⚠️ Context: **Black Friday Period**. Expect High CPM, high competition, and potential drop in ROAS due to expensive traffic.";
    }
    if (overlapsNewYear) {
      return "🎄 Context: **New Year Rush**. Expect high conversion rates but expensive traffic.";
    }
    if (overlapsPostHoliday) {
      return "📉 Context: **Post-Holiday Slump**. Buying activity typically drops.";
    }
    
    return "Context: Standard business season.";
  } catch (error) {
    return "Context: Standard business season.";
  }
}

/**
 * Helper to determine product category from campaign name
 */
function determineCategory(campaignName: string): 'Reach' | 'PaymePlus' | 'P2P' | 'Payments' | 'Other' {
  const name = (campaignName || '').toLowerCase();
  if (name.includes('reach')) return 'Reach';
  if (name.includes('paymeplus') || name.includes('pfm') || name.includes('sub')) return 'PaymePlus';
  if (name.includes('p2p') || name.includes('transfer')) return 'P2P';
  if (name.includes('payment')) return 'Payments';
  return 'Other';
}

/**
 * Helper function to extract revenue for a specific day from cumulative columns
 */
function getRevenueForDay(row: RawCampaignData, day: number): number {
  const transferKey = `Revenue ${day} days cumulative appsflyer af_transfer_completed`;
  const purchaseKey = `Revenue ${day} days cumulative appsflyer af_purchase`;
  
  let transferRevenue = 0;
  let purchaseRevenue = 0;
  
  if (row[transferKey]) {
    const val = typeof row[transferKey] === 'string' 
      ? parseFloat(row[transferKey] as string) 
      : (row[transferKey] as number);
    transferRevenue = isNaN(val) ? 0 : val;
  }
  
  if (row[purchaseKey]) {
    const val = typeof row[purchaseKey] === 'string' 
      ? parseFloat(row[purchaseKey] as string) 
      : (row[purchaseKey] as number);
    purchaseRevenue = isNaN(val) ? 0 : val;
  }
  
  // Calculate business revenue: (Transfer * 0.007) + (Purchase * 0.00635)
  return (transferRevenue * 0.007) + (purchaseRevenue * 0.00635);
}

/**
 * Helper function to extract the latest cumulative revenue from a row
 * Finds the largest day number with valid data and calculates business revenue
 */
function getLatestRevenue(row: RawCampaignData): number {
  let maxDay = -1;
  let transferRevenue = 0;
  let purchaseRevenue = 0;

  // Iterate through all keys in the row
  for (const key of Object.keys(row)) {
    // Check if this is a revenue column
    if (key.includes('Revenue') && key.includes('days')) {
      // Extract day number from column name (e.g., "Revenue 5 days..." -> 5)
      const dayMatch = key.match(/Revenue\s+(\d+)\s+days/);
      if (!dayMatch) continue;
      
      const dayNum = parseInt(dayMatch[1], 10);
      const value = row[key];
      
      // Skip if value is empty/null/undefined
      if (value === null || value === undefined || value === '' || value === 0) continue;
      
      // Check if this is a transfer or purchase column
      const isTransfer = key.includes('af_transfer_completed');
      const isPurchase = key.includes('af_purchase');
      
      if (!isTransfer && !isPurchase) continue;
      
      // Update max day if this is larger
      if (dayNum > maxDay) {
        maxDay = dayNum;
        
        // Reset revenues for this new max day
        transferRevenue = 0;
        purchaseRevenue = 0;
        
        // Find both transfer and purchase for this day
        const transferKey = `Revenue ${dayNum} days cumulative appsflyer af_transfer_completed`;
        const purchaseKey = `Revenue ${dayNum} days cumulative appsflyer af_purchase`;
        
        if (row[transferKey]) {
          const val = typeof row[transferKey] === 'string' 
            ? parseFloat(row[transferKey] as string) 
            : (row[transferKey] as number);
          transferRevenue = isNaN(val) ? 0 : val;
        }
        
        if (row[purchaseKey]) {
          const val = typeof row[purchaseKey] === 'string' 
            ? parseFloat(row[purchaseKey] as string) 
            : (row[purchaseKey] as number);
          purchaseRevenue = isNaN(val) ? 0 : val;
        }
      }
    }
  }

  // Calculate business revenue
  const businessRevenue = (transferRevenue * 0.007) + (purchaseRevenue * 0.00635);
  
  return businessRevenue;
}

interface WeekCohort {
  weekNum: number;
  weekLabel: string;
  cost: number;
  revenueD0: number;
  revenueD3: number;
  revenueD7: number;
  roasD0: number;
  roasD3: number;
  roasD7: number;
  status: string;
  retentionIssue: boolean;
}

/**
 * Generate human-readable summary string for AI analysis with Cohort Anomaly Detection
 */
export function generateAIPayload(
  rawDailyData: RawCampaignData[],
  dateRange: string,
  activeTab: string,
  activeSource: string
): string {
  // Handle empty data case
  if (rawDailyData.length === 0) {
    return `NO DATA FOUND

Current Filters:
- Product: ${activeTab}
- Source: ${activeSource}
- Report Period: ${dateRange}

No data matches the current filter criteria. Please adjust your filters or upload data.`;
  }

  // === STEP A: Calculate Global Benchmark Curve ===
  let totalCost = 0;
  let totalRevenueD0 = 0;
  let totalRevenueD3 = 0;
  let totalRevenueD7 = 0;
  let totalRevenueFinal = 0;

  for (const row of rawDailyData) {
    const rowCost = typeof row.Cost === 'string' 
      ? parseFloat(row.Cost) 
      : (row.Cost as number);
    const cost = isNaN(rowCost) ? 0 : rowCost;

    totalCost += cost;
    totalRevenueD0 += getRevenueForDay(row, 0);
    totalRevenueD3 += getRevenueForDay(row, 3);
    totalRevenueD7 += getRevenueForDay(row, 7);
    totalRevenueFinal += getLatestRevenue(row);
  }

  const benchmarkD0 = totalCost > 0 ? (totalRevenueD0 / totalCost) * 100 : 0;
  const benchmarkD3 = totalCost > 0 ? (totalRevenueD3 / totalCost) * 100 : 0;
  const benchmarkD7 = totalCost > 0 ? (totalRevenueD7 / totalCost) * 100 : 0;
  const globalROAS = totalCost > 0 ? (totalRevenueFinal / totalCost) * 100 : 0;

  // === STEP B: Analyze Each Week ===
  const weekMap = new Map<number, WeekCohort>();

  for (const row of rawDailyData) {
    if (!row.Date) continue;

    const weekNum = getISOWeek(parseISO(row.Date));
    const rowCost = typeof row.Cost === 'string' 
      ? parseFloat(row.Cost) 
      : (row.Cost as number);
    const cost = isNaN(rowCost) ? 0 : rowCost;

    if (!weekMap.has(weekNum)) {
      weekMap.set(weekNum, {
        weekNum,
        weekLabel: `Week ${weekNum}`,
        cost: 0,
        revenueD0: 0,
        revenueD3: 0,
        revenueD7: 0,
        roasD0: 0,
        roasD3: 0,
        roasD7: 0,
        status: 'Normal',
        retentionIssue: false,
      });
    }

    const weekData = weekMap.get(weekNum)!;
    weekData.cost += cost;
    weekData.revenueD0 += getRevenueForDay(row, 0);
    weekData.revenueD3 += getRevenueForDay(row, 3);
    weekData.revenueD7 += getRevenueForDay(row, 7);
  }

  // Calculate ROAS and detect anomalies for each week
  const weekCohorts: WeekCohort[] = [];
  for (const weekData of Array.from(weekMap.values())) {
    weekData.roasD0 = weekData.cost > 0 ? (weekData.revenueD0 / weekData.cost) * 100 : 0;
    weekData.roasD3 = weekData.cost > 0 ? (weekData.revenueD3 / weekData.cost) * 100 : 0;
    weekData.roasD7 = weekData.cost > 0 ? (weekData.revenueD7 / weekData.cost) * 100 : 0;

    // Anomaly Detection
    if (benchmarkD7 > 0) {
      const d7Ratio = weekData.roasD7 / benchmarkD7;
      
      if (d7Ratio < 0.8) {
        weekData.status = '📉 Underperforming';
      } else if (d7Ratio > 1.2) {
        weekData.status = '🚀 Outperforming';
      } else {
        weekData.status = 'Normal';
      }
    }

    // Retention Issue Detection (high Day 0, low Day 7)
    if (weekData.roasD0 > benchmarkD0 && weekData.roasD7 < benchmarkD7 * 0.9) {
      weekData.retentionIssue = true;
      weekData.status += ' ⚠️ Retention Issue';
    }

    weekCohorts.push(weekData);
  }

  // Sort weeks by week number
  weekCohorts.sort((a, b) => a.weekNum - b.weekNum);

  // === STEP C: Build Campaign Stats ===
  const campaignStats = new Map<string, { cost: number; revenue: number; rows: number }>();

  for (const row of rawDailyData) {
    const rowCost = typeof row.Cost === 'string' 
      ? parseFloat(row.Cost) 
      : (row.Cost as number);
    const cost = isNaN(rowCost) ? 0 : rowCost;
    const revenue = getLatestRevenue(row);

    const campaignName = row.Campaign || 'Unknown';
    if (!campaignStats.has(campaignName)) {
      campaignStats.set(campaignName, { cost: 0, revenue: 0, rows: 0 });
    }
    const stats = campaignStats.get(campaignName)!;
    stats.cost += cost;
    stats.revenue += revenue;
    stats.rows += 1;
  }

  const totalProfit = totalRevenueFinal - totalCost;

  // === STEP C2: Product Breakdown Analysis ===
  const productStats = new Map<string, { cost: number; revenue: number; campaigns: number }>();

  for (const row of rawDailyData) {
    const rowCost = typeof row.Cost === 'string' 
      ? parseFloat(row.Cost) 
      : (row.Cost as number);
    const cost = isNaN(rowCost) ? 0 : rowCost;
    const revenue = getLatestRevenue(row);
    const product = determineCategory(row.Campaign || '');

    if (!productStats.has(product)) {
      productStats.set(product, { cost: 0, revenue: 0, campaigns: 0 });
    }
    const stats = productStats.get(product)!;
    stats.cost += cost;
    stats.revenue += revenue;
    stats.campaigns += 1;
  }

  // Calculate product winners
  const productArray = Array.from(productStats.entries()).map(([product, stats]) => ({
    product,
    cost: stats.cost,
    revenue: stats.revenue,
    roas: stats.cost > 0 ? (stats.revenue / stats.cost) * 100 : 0,
    campaigns: stats.campaigns,
  })).filter(p => p.cost > 0); // Only include products with spend

  const bestROASProduct = productArray.length > 0
    ? productArray.reduce((best, current) => current.roas > best.roas ? current : best)
    : null;

  const highestVolumeProduct = productArray.length > 0
    ? productArray.reduce((highest, current) => current.cost > highest.cost ? current : highest)
    : null;

  const productWinnersText = `Best ROAS: ${bestROASProduct ? `${bestROASProduct.product} (${bestROASProduct.roas.toFixed(1)}%)` : 'N/A'} | Highest Volume: ${highestVolumeProduct ? `${highestVolumeProduct.product} ($${highestVolumeProduct.cost.toLocaleString()} spend)` : 'N/A'}`;

  // === STEP C3: Cohort Velocity Tracking ===
  const velocityInsights: string[] = [];
  for (let i = 1; i < weekCohorts.length; i++) {
    const prevWeek = weekCohorts[i - 1];
    const currentWeek = weekCohorts[i];
    
    if (currentWeek.roasD0 > prevWeek.roasD0) {
      const improvement = ((currentWeek.roasD0 - prevWeek.roasD0) / prevWeek.roasD0 * 100).toFixed(1);
      velocityInsights.push(`${currentWeek.weekLabel}: 🟢 Improving Start (+${improvement}% vs ${prevWeek.weekLabel})`);
    } else if (currentWeek.roasD0 < prevWeek.roasD0) {
      const decline = ((prevWeek.roasD0 - currentWeek.roasD0) / prevWeek.roasD0 * 100).toFixed(1);
      velocityInsights.push(`${currentWeek.weekLabel}: 🔴 Weakening Start (-${decline}% vs ${prevWeek.weekLabel})`);
    }
  }

  const velocityText = velocityInsights.length > 0
    ? velocityInsights.join('\n')
    : 'Insufficient data for week-over-week comparison';

  // Sort campaigns by profit
  const campaignArray = Array.from(campaignStats.entries()).map(([name, stats]) => ({
    name,
    cost: stats.cost,
    revenue: stats.revenue,
    profit: stats.revenue - stats.cost,
    roas: stats.cost > 0 ? (stats.revenue / stats.cost) * 100 : 0,
  })).sort((a, b) => b.profit - a.profit);

  // Top 3 and Bottom 3
  const topPerformers = campaignArray.slice(0, 3);
  const topPerformersText = topPerformers.length > 0
    ? topPerformers.map((c, i) => 
        `${i + 1}. ${c.name}: ROAS ${c.roas.toFixed(1)}%, Profit $${c.profit.toLocaleString()}`
      ).join('\n')
    : 'No data available';

  const bottomPerformers = campaignArray.slice(-3).reverse();
  const bottomPerformersText = bottomPerformers.length > 0
    ? bottomPerformers.map((c, i) => 
        `${i + 1}. ${c.name}: ROAS ${c.roas.toFixed(1)}%, Profit $${c.profit.toLocaleString()}`
      ).join('\n')
    : 'No data available';

  // === STEP D: Construct Smart Payload ===
  const weeklyCohortText = weekCohorts.map(w => 
    `- ${w.weekLabel}: Day 0 ROAS ${w.roasD0.toFixed(1)}%, Day 3 ROAS ${w.roasD3.toFixed(1)}%, Day 7 ROAS ${w.roasD7.toFixed(1)}% (Status: ${w.status})`
  ).join('\n');

  // Get seasonality context
  const seasonalityNote = getSeasonalityContext(dateRange);

  const summary = `CAMPAIGN PERFORMANCE SUMMARY WITH COHORT ANOMALY DETECTION

SEASONALITY CONTEXT:
${seasonalityNote}

CONTEXT:
- Filter: ${activeTab} / ${activeSource}
- Report Period: ${dateRange}
- Total Data Rows: ${rawDailyData.length}
- Unique Campaigns: ${campaignStats.size}

GLOBAL BENCHMARK ROAS CURVE:
- Day 0: ${benchmarkD0.toFixed(2)}%
- Day 3: ${benchmarkD3.toFixed(2)}%
- Day 7: ${benchmarkD7.toFixed(2)}%

PRODUCT WINNERS:
${productWinnersText}

COHORT VELOCITY (Week-over-Week Day 0 ROAS):
${velocityText}

WEEKLY COHORT ANALYSIS:
${weeklyCohortText}

GLOBAL BENCHMARKS:
- TOTAL SPEND: $${totalCost.toLocaleString()}
- TOTAL REVENUE (Final): $${totalRevenueFinal.toLocaleString()}
- TOTAL PROFIT: $${totalProfit.toLocaleString()}
- TOTAL ROAS (Final): ${globalROAS.toFixed(2)}%

TOP 3 PERFORMERS (by Profit):
${topPerformersText}

BOTTOM 3 PERFORMERS (by Profit):
${bottomPerformersText}

INSTRUCTIONS FOR AI:
1. Identify specific weeks that deviate from the Benchmark (look for 📉 Underperforming or 🚀 Outperforming flags)
2. If a week starts strong (High Day 0) but flattens (Low Day 7), point it out as "Retention Issue"
3. Mention specific "Week X" and "Day Y" anomalies in your response
4. Keep it brief and actionable
5. Use ONLY the data provided above - do NOT calculate totals yourself

METHODOLOGY NOTE:
Revenue is calculated from cumulative day columns using the formula:
(Transfer GMV × 0.7%) + (Purchase GMV × 0.635%)`;

  // Debug logging
  console.log("=== AI PAYLOAD WITH COHORT ANOMALY DETECTION ===");
  console.log(`Total Rows: ${rawDailyData.length}`);
  console.log(`Benchmark D0: ${benchmarkD0.toFixed(2)}%, D3: ${benchmarkD3.toFixed(2)}%, D7: ${benchmarkD7.toFixed(2)}%`);
  console.log(`Weeks Analyzed: ${weekCohorts.length}`);
  console.log("================================================");

  return summary;
}

/**
 * Legacy interface for backward compatibility
 */
export interface AIPayload {
  summaryText: string;
  meta: {
    reportPeriod: string;
    currentFilters: {
      product: string;
      source: string;
    };
  };
}

export function generateAIPayloadObject(
  rawDailyData: RawCampaignData[],
  dateRange: string,
  activeTab: string,
  activeSource: string
): AIPayload {
  const summaryText = generateAIPayload(rawDailyData, dateRange, activeTab, activeSource);

  return {
    summaryText,
    meta: {
      reportPeriod: dateRange,
      currentFilters: {
        product: activeTab,
        source: activeSource,
      },
    },
  };
}
