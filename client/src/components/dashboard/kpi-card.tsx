import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ProductSplit } from "@/lib/data-processor";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  colorClass?: string;
  iconColorClass?: string;
  subValue?: string;
  split?: ProductSplit[];
  metricType?: 'currency' | 'number';
}

const PRODUCT_COLORS = {
  "P2P": "bg-blue-500",
  "PaymePlus": "bg-purple-500",
  "Payments": "bg-emerald-500",
  "Reach": "bg-orange-500",
};

export function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  colorClass,
  iconColorClass,
  subValue,
  split,
  metricType = 'currency'
}: KPICardProps) {
  // Calculate total for percentage display
  const totalValue = split?.reduce((sum, item) => sum + item.value, 0) || 0;
  const hasSplit = split && split.length > 0 && totalValue > 0;

  // Format value for tooltip
  const formatValue = (val: number) => {
    if (metricType === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 font-medium text-sm">{title}</span>
        <div className={cn("p-2 rounded-lg bg-slate-50", iconColorClass || "text-slate-400")}>
          <Icon size={20} />
        </div>
      </div>
      
      <div className="flex items-end justify-between mb-3">
        <h3 className={cn("text-2xl font-bold tracking-tight", colorClass || "text-slate-900")}>
          {value}
        </h3>
        
        <div className="flex flex-col items-end">
          {trend && trendValue && (
            <span className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full mb-1",
              trend === "up" ? "text-emerald-700 bg-emerald-50" : 
              trend === "down" ? "text-rose-700 bg-rose-50" : "text-slate-600 bg-slate-100"
            )}>
              {trendValue}
            </span>
          )}
          
          {subValue && (
            <div className="text-right mt-1">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {subValue}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Product Split Bar */}
      {hasSplit && (
        <div className="mt-3">
          <div 
            className="h-2 w-full rounded-full overflow-hidden flex bg-slate-100"
          >
            {split.map((item, index) => (
              item.percentage > 0 && (
                <div
                  key={index}
                  className={cn(PRODUCT_COLORS[item.product], "transition-all duration-300")}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.product}: ${formatValue(item.value)}`}
                />
              )
            ))}
          </div>
          
          {/* Legend - compact inline */}
          <div className="flex flex-wrap gap-2 mt-2">
            {split.map((item, index) => (
              item.percentage > 0 && (
                <div key={index} className="flex items-center gap-1 text-xs text-slate-600">
                  <div className={cn("w-2 h-2 rounded-full", PRODUCT_COLORS[item.product])} />
                  <span className="font-medium">{item.product}</span>
                  <span className="text-slate-400">{item.percentage.toFixed(0)}%</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
