import { CohortDataPoint, RawCampaignData } from "@/lib/data-processor";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { format, parseISO, getISOWeek } from "date-fns";

interface CohortRoasChartProps {
  data: CohortDataPoint[];
  weekLabels: string[];
  rawDailyData?: RawCampaignData[];
  campaignName?: string | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-lg">
        <p className="text-sm font-semibold text-slate-900 mb-2">Day {label}</p>
        <div className="space-y-1 text-xs">
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {entry.value?.toFixed(2)}%
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Generate distinct colors for dynamic lines
const getLineColor = (index: number) => {
  const colors = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f43f5e", // Rose
    "#6366f1", // Indigo
  ];
  return colors[index % colors.length];
};

// Day-specific colors for daily drill-down
const getDayColor = (dayOfWeek: number) => {
  const dayColors = [
    "#ef4444", // Sunday - Red
    "#3b82f6", // Monday - Blue
    "#10b981", // Tuesday - Emerald
    "#f59e0b", // Wednesday - Amber
    "#8b5cf6", // Thursday - Violet
    "#ec4899", // Friday - Pink
    "#06b6d4", // Saturday - Cyan
  ];
  return dayColors[dayOfWeek];
};

export function CohortRoasChart({ data, weekLabels, rawDailyData, campaignName }: CohortRoasChartProps) {
  const [selectedWeekGroup, setSelectedWeekGroup] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400">
        No cohort data available
      </div>
    );
  }

  // Process daily drill-down data
  const processDailyData = (weekLabel: string): { data: CohortDataPoint[], labels: string[] } => {
    if (!rawDailyData || rawDailyData.length === 0) {
      return { data: [], labels: [] };
    }

    // Extract week number from label (e.g., "Week 45 (Nov 03 - Nov 09)" -> 45)
    const weekMatch = weekLabel.match(/Week (\d+)/);
    if (!weekMatch) return { data: [], labels: [] };
    const weekNum = parseInt(weekMatch[1]);

    // Filter raw data for this week and campaign
    const weekData = rawDailyData.filter(row => {
      if (!row.Date) return false;
      const date = parseISO(row.Date as string);
      const rowWeek = getISOWeek(date);
      
      const matchesWeek = rowWeek === weekNum;
      const matchesCampaign = !campaignName || row.Campaign === campaignName;
      
      return matchesWeek && matchesCampaign;
    });

    if (weekData.length === 0) return { data: [], labels: [] };

    // Group by date
    const dateGroups = new Map<string, RawCampaignData[]>();
    weekData.forEach(row => {
      const dateKey = row.Date as string;
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(row);
    });

    // Process each date as a separate line
    const dailyLabels: string[] = [];
    const dailyDataPoints: CohortDataPoint[] = [];

    // Initialize data structure
    for (let day = 0; day <= 30; day++) {
      dailyDataPoints.push({ day });
    }

    // Find reportMaxDate from raw data
    const reportMaxDate = rawDailyData.reduce((max, row) => {
      if (!row.Date) return max;
      const date = parseISO(row.Date as string);
      return date > max ? date : max;
    }, new Date(0));

    Array.from(dateGroups.entries()).forEach(([dateStr, rows]) => {
      const date = parseISO(dateStr);
      const dayOfWeek = date.getDay();
      const label = `${format(date, 'MMM dd')} (${format(date, 'EEE')})`;
      dailyLabels.push(label);

      // Calculate ROAS for each day (0-30)
      let totalCost = 0;
      rows.forEach(row => {
        const cost = typeof row.Cost === 'number' ? row.Cost : parseFloat(String(row.Cost || 0).replace(/[^0-9.-]/g, ''));
        totalCost += isNaN(cost) ? 0 : cost;
      });

      // Calculate max days since install for this cohort (smart cut-off)
      const daysSinceInstall = Math.floor((reportMaxDate.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
      const maxDay = Math.min(30, daysSinceInstall);

      for (let day = 0; day <= 30; day++) {
        // Apply smart cut-off: stop at maxDay
        if (day > maxDay) {
          dailyDataPoints[day][label] = null;
          continue;
        }

        let totalRevenue = 0;
        rows.forEach(row => {
          const transferCol = `Revenue ${day} days cumulative appsflyer af_transfer_completed`;
          const purchaseCol = `Revenue ${day} days cumulative appsflyer af_purchase`;
          
          const transferRev = typeof row[transferCol] === 'number' ? row[transferCol] : parseFloat(String(row[transferCol] || 0).replace(/[^0-9.-]/g, ''));
          const purchaseRev = typeof row[purchaseCol] === 'number' ? row[purchaseCol] : parseFloat(String(row[purchaseCol] || 0).replace(/[^0-9.-]/g, ''));
          
          const bizRev = (isNaN(transferRev) ? 0 : transferRev) * 0.007 + (isNaN(purchaseRev) ? 0 : purchaseRev) * 0.00635;
          totalRevenue += bizRev;
        });

        const roas = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;
        dailyDataPoints[day][label] = roas;
      }
    });

    return { data: dailyDataPoints, labels: dailyLabels };
  };

  // Handle legend click to drill down
  const handleLegendClick = (e: any) => {
    if (!selectedWeekGroup && e && e.value) {
      setSelectedWeekGroup(e.value);
    }
  };

  // Determine what to display
  const displayData = selectedWeekGroup && rawDailyData 
    ? processDailyData(selectedWeekGroup)
    : { data, labels: weekLabels };

  const currentData = displayData.data;
  const currentLabels = displayData.labels;

  return (
    <div className="h-full w-full relative">
      {selectedWeekGroup && (
        <button
          onClick={() => setSelectedWeekGroup(null)}
          className="absolute top-0 left-0 z-10 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Weekly View
        </button>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={currentData}
          margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            label={{ value: 'Days Since Install', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#64748b' }}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }} 
            onClick={handleLegendClick}
            iconType="line"
          />
          
          <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Break-Even (100%)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />

          {currentLabels.map((label, index) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              name={label}
              stroke={selectedWeekGroup ? getDayColor(index % 7) : getLineColor(index)}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
