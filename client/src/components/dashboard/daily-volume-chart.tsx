import { ChartDataPoint } from "@/lib/data-processor";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";

interface DailyVolumeChartProps {
  data: ChartDataPoint[];
  metric: "installs" | "cards" | "subs";
}

const CustomTooltip = ({ active, payload, label, metricLabel }: any) => {
  if (active && payload && payload.length) {
    // Format the date label
    const formattedDate = (() => {
      try {
        return format(parseISO(label), 'MMM dd, yyyy');
      } catch (e) {
        return label;
      }
    })();
    
    return (
      <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-lg">
        <p className="text-sm font-semibold text-slate-900 mb-2">{formattedDate}</p>
        <div className="space-y-1 text-xs">
          <p className="font-medium" style={{ color: payload[0].color }}>
            {metricLabel}: {payload[0].value.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function DailyVolumeChart({ data, metric }: DailyVolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400">
        No chart data available
      </div>
    );
  }

  // Configuration based on selected metric
  const config = {
    installs: {
      dataKey: "dailyInstalls",
      label: "Daily Installs",
      color: "#3b82f6", // Blue 500
      tooltipLabel: "Installs"
    },
    cards: {
      dataKey: "dailyCards",
      label: "Daily Cards",
      color: "#06b6d4", // Cyan 500
      tooltipLabel: "Cards"
    },
    subs: {
      dataKey: "dailySubs",
      label: "Daily Subs",
      color: "#6366f1", // Indigo 500
      tooltipLabel: "Subs"
    }
  };

  const currentConfig = config[metric];

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={formatDate}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
          />
          <Tooltip 
            content={<CustomTooltip metricLabel={currentConfig.tooltipLabel} />}
            labelFormatter={formatDate}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <Bar
            dataKey={currentConfig.dataKey}
            name={currentConfig.label}
            fill={currentConfig.color}
            radius={[4, 4, 0, 0]}
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
