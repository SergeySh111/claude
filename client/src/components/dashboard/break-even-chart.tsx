import { ChartDataPoint } from "@/lib/data-processor";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";

interface BreakEvenChartProps {
  data: ChartDataPoint[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const netProfit = payload[0].payload.netProfit;
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
          <p className="text-emerald-600 font-medium">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-rose-500 font-medium">
            Cost: {formatCurrency(payload[1].value)}
          </p>
          <div className="pt-2 mt-2 border-t border-slate-100">
            <p className={`font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              Net Profit: {formatCurrency(netProfit)}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function BreakEvenChart({ data }: BreakEvenChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400">
        No chart data available
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">Break-Even Analysis</h3>
        <p className="text-sm text-slate-500">Cumulative Revenue vs. Cumulative Cost over time</p>
      </div>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(dateStr) => {
                try {
                  return format(parseISO(dateStr), 'MMM dd');
                } catch (e) {
                  return dateStr;
                }
              }}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12} 
              tickFormatter={(val) => `$${val / 1000}k`}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <Line
              type="monotone"
              dataKey="cumulativeRevenue"
              name="Cumulative Revenue"
              stroke="#10b981" // Emerald 500
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="cumulativeCost"
              name="Cumulative Cost"
              stroke="#ef4444" // Rose 500
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
