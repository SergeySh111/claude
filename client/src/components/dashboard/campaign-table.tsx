import { ProcessedCampaign, CohortDataPoint, ChartDataPoint } from "@/lib/data-processor";
import { cn } from "@/lib/utils";
import { Globe, ChevronDown, ChevronUp, Facebook, Video, Monitor } from "lucide-react";
import { CohortRoasChart } from "./cohort-roas-chart";
import { DailyVolumeChart } from "./daily-volume-chart";
import React, { useState } from "react";

interface CampaignTableProps {
  campaigns: ProcessedCampaign[];
  view?: "financial" | "acquisition";
  onCampaignClick?: (campaignId: string) => void;
  selectedCampaignId?: string | null;
  getCohortData?: (campaignId: string) => { data: CohortDataPoint[], labels: string[] };
  getAcquisitionData?: (campaignId: string) => { data: ChartDataPoint[] };
  rawDailyData?: any[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

const formatCurrencyDecimal = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const formatPercent = (val: number) => {
  return `${val.toFixed(1)}%`;
};

const getPIScoreColor = (score: number) => {
  if (score >= 80) return "bg-emerald-500 text-white";
  if (score >= 50) return "bg-amber-400 text-amber-900";
  return "bg-rose-500 text-white";
};

const getCategoryBadgeStyle = (category: string) => {
  switch (category) {
    case 'Reach': return "text-blue-700 bg-blue-50 border-blue-200";
    case 'PaymePlus': return "text-purple-700 bg-purple-50 border-purple-200";
    case 'P2P': return "text-cyan-700 bg-cyan-50 border-cyan-200";
    case 'Payments': return "text-emerald-700 bg-emerald-50 border-emerald-200";
    default: return "text-slate-600 bg-slate-50 border-slate-200";
  }
};

const getSourceLogo = (source: string) => {
  switch (source) {
    case 'Facebook': return '/logos/facebook.png';
    case 'Google': return '/logos/google.png';
    case 'Bigo': return '/logos/bigo.png';
    default: return null;
  }
};

const getSourceFallbackIcon = (source: string) => {
  switch (source) {
    case 'Facebook': return <Facebook size={16} className="text-blue-600" />;
    case 'Google': return <Globe size={16} className="text-green-600" />;
    case 'Bigo': return <Video size={16} className="text-purple-600" />;
    default: return <Monitor size={16} className="text-slate-400" />;
  }
};

export function CampaignTable({ campaigns, view = "financial", onCampaignClick, selectedCampaignId, getCohortData, getAcquisitionData, rawDailyData }: CampaignTableProps) {
  // Local state for acquisition chart metric toggle per row
  const [rowMetrics, setRowMetrics] = useState<Record<string, "installs" | "cards" | "subs">>({});

  const getMetric = (id: string) => rowMetrics[id] || "installs";
  const setMetric = (id: string, metric: "installs" | "cards" | "subs") => {
    setRowMetrics(prev => ({ ...prev, [id]: metric }));
  };

  if (campaigns.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
        No data available. Please upload a CSV file.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider w-10"></th> {/* Expand Icon */}
              <th className="px-6 py-4 font-semibold tracking-wider w-16">Rank</th>
              <th className="px-6 py-4 font-semibold tracking-wider w-16 text-center">Source</th>
              <th className="px-6 py-4 font-semibold tracking-wider w-32">Category</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Campaign</th>
              
              {view === "financial" ? (
                <>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Spend</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Revenue</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Profit</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">ROAS</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Installs</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">CPI</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Cards</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right text-slate-400">CPA</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Subs</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right text-slate-400">CPA</th>
                </>
              )}
              
              <th className="px-6 py-4 font-semibold tracking-wider text-center w-32">PI Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((row) => {
              const isExpanded = selectedCampaignId === row.id;
              const cohortInfo = isExpanded && getCohortData ? getCohortData(row.campaignName) : null;
              const acquisitionInfo = isExpanded && getAcquisitionData ? getAcquisitionData(row.campaignName) : null;
              
              return (
                <React.Fragment key={row.id}>
                  <tr 
                    onClick={() => onCampaignClick?.(isExpanded ? "" : row.id)} // Toggle expansion
                    className={cn(
                      "transition-colors cursor-pointer border-l-4",
                      isExpanded ? "bg-blue-50 border-l-blue-500" : "hover:bg-slate-50/50 border-l-transparent"
                    )}
                  >
                    <td className="px-6 py-4 text-slate-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      #{row.globalRank || row.rank}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-200">
                          {getSourceLogo(row.normalizedSource) ? (
                            <img 
                              src={getSourceLogo(row.normalizedSource)!}
                              alt={row.normalizedSource}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <span className={getSourceLogo(row.normalizedSource) ? 'hidden' : ''}>
                            {getSourceFallbackIcon(row.normalizedSource)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border", getCategoryBadgeStyle(row.category))}>
                        {row.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-[300px] truncate" title={row.campaignName}>
                      {row.campaignName}
                    </td>

                    {view === "financial" ? (
                      <>
                        <td className="px-6 py-4 text-right text-slate-600 font-mono">{formatCurrency(row.cost)}</td>
                        <td className="px-6 py-4 text-right text-slate-600 font-mono">{formatCurrency(row.revenue)}</td>
                        <td className={cn("px-6 py-4 text-right font-bold font-mono", row.profit > 0 ? "text-emerald-600" : "text-rose-600")}>
                          {formatCurrency(row.profit)}
                        </td>
                        <td className={cn("px-6 py-4 text-right font-mono", row.roas > 100 ? "font-bold text-emerald-600" : "text-slate-600")}>
                          {formatPercent(row.roas)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-right text-slate-600 font-mono">{row.installs?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4 text-right text-slate-600 font-mono">{formatCurrencyDecimal(row.cpi || 0)}</td>
                        <td className="px-6 py-4 text-right text-slate-600 font-mono">{row.cards?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-xs">{formatCurrencyDecimal(row.cpaCards || 0)}</td>
                        <td className="px-6 py-4 text-right text-slate-600 font-mono">{row.subs?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-xs">{formatCurrencyDecimal(row.cpaSubs || 0)}</td>
                      </>
                    )}

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold", getPIScoreColor(row.piScore))}>
                          {row.piScore}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Accordion Content */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={10} className="px-6 py-6 border-b border-slate-200">
                        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                          {view === "financial" ? (
                            <>
                              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Campaign Cohort Performance
                              </h4>
                              <div className="h-[300px] w-full">
                                {cohortInfo ? (
                                  <CohortRoasChart 
                                    data={cohortInfo.data} 
                                    weekLabels={cohortInfo.labels} 
                                    rawDailyData={rawDailyData}
                                    campaignName={row.campaignName}
                                  />
                                ) : (
                                  <div className="h-full flex items-center justify-center text-slate-400">
                                    Loading cohort data...
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                  Campaign Acquisition Trend
                                </h4>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                  {(["installs", "cards", "subs"] as const).map((m) => (
                                    <button
                                      key={m}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMetric(row.id, m);
                                      }}
                                      className={cn(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all capitalize",
                                        getMetric(row.id) === m
                                          ? "bg-white text-slate-900 shadow-sm"
                                          : "text-slate-500 hover:text-slate-700"
                                      )}
                                    >
                                      {m}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="h-[300px] w-full">
                                {acquisitionInfo ? (
                                  <DailyVolumeChart data={acquisitionInfo.data} metric={getMetric(row.id)} />
                                ) : (
                                  <div className="h-full flex items-center justify-center text-slate-400">
                                    Loading acquisition data...
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
