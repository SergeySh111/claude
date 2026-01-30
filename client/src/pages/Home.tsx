import { CohortRoasChart } from "@/components/dashboard/cohort-roas-chart";
import { CampaignTable } from "@/components/dashboard/campaign-table";
import { DailyVolumeChart } from "@/components/dashboard/daily-volume-chart";
import { FileUploader } from "@/components/dashboard/file-uploader";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import { KPICard } from "@/components/dashboard/kpi-card";
import { MethodologySection } from "@/components/dashboard/methodology-section";
import { ViewToggle } from "@/components/dashboard/view-toggle";
import { SettingsModal } from "@/components/dashboard/settings-modal";
import { AIChatSidebar } from "@/components/dashboard/ai-chat-sidebar";
import { prepareAnalysisPayload } from "@/lib/benchmark-calculator";
import type { CanonicalAnalyticsSnapshot, AiFilters } from "@shared/ai";

import { aggregateData, calculateMetrics, ChartDataPoint, CohortDataPoint, parseCSV, ProcessedCampaign, RawCampaignData } from "@/lib/data-processor";

import { BarChart3, ChevronDown, ChevronUp, CreditCard, DollarSign, Rocket, TrendingUp, Users, Wallet, Facebook, Globe, Video, Settings, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export default function Home() {

  // Raw Data State
  const [summaryData, setSummaryData] = useState<ProcessedCampaign[]>([]);
  const [dailyData, setDailyData] = useState<RawCampaignData[]>([]);
  const [dateRange, setDateRange] = useState<string>("");

  
  // Processed/Aggregated State
  const [campaigns, setCampaigns] = useState<ProcessedCampaign[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [cohortData, setCohortData] = useState<CohortDataPoint[]>([]);
  const [weekLabels, setWeekLabels] = useState<string[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState("All");
  const [activeSource, setActiveSource] = useState("All");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [view, setView] = useState<"financial" | "acquisition">("financial");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [volumeMetric, setVolumeMetric] = useState<"installs" | "cards" | "subs">("installs");
  
  // AI Sidebar State
  const [showSettings, setShowSettings] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(false);

  // Handle File Uploads
  const handleSummaryUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const { processedData } = await parseCSV(file, 'summary');
      setSummaryData(processedData);
      toast.success("Campaign Summary uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error processing summary file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDailyUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const { rawData, dateRange: range } = await parseCSV(file, 'daily');
      setDailyData(rawData);
      setDateRange(range);
      toast.success("Daily Cohort report uploaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error processing daily file.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reactive Aggregation
  useEffect(() => {
    if (summaryData.length > 0 && dailyData.length > 0) {
      const { campaigns: aggregatedCampaigns, chartData: aggregatedChartData, cohortData: aggregatedCohortData, weekLabels: aggregatedWeekLabels } = aggregateData(summaryData, dailyData, activeTab, activeSource, null);
      setCampaigns(aggregatedCampaigns);
      setChartData(aggregatedChartData);
      setCohortData(aggregatedCohortData);
      setWeekLabels(aggregatedWeekLabels);
    } else {
      setCampaigns([]);
      setChartData([]);
    }
  }, [summaryData, dailyData, activeTab, activeSource]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedCampaignId(null);
    setShowAllRows(false);
  };

  const handleSourceChange = (source: string) => {
    setActiveSource(source);
    setSelectedCampaignId(null);
    setShowAllRows(false);
  };

  const handleCampaignClick = (campaignId: string) => {
    if (selectedCampaignId === campaignId) {
      setSelectedCampaignId(null);
    } else {
      setSelectedCampaignId(campaignId);
    }
  };

  const getCohortDataForCampaign = (campaignName: string) => {
    const { cohortData, weekLabels } = aggregateData(summaryData, dailyData, activeTab, activeSource, campaignName);
    return { data: cohortData, labels: weekLabels };
  };

  const getAcquisitionDataForCampaign = (campaignName: string) => {
    const { chartData } = aggregateData(summaryData, dailyData, activeTab, activeSource, campaignName);
    return { data: chartData };
  };

  const metrics = calculateMetrics(campaigns);

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

  const displayedCampaigns = showAllRows ? campaigns : campaigns.slice(0, 5);
  const hasData = summaryData.length > 0 && dailyData.length > 0;

  // Build canonical analytics snapshot for AI sidebar
  const analyticsSnapshot: CanonicalAnalyticsSnapshot | null = hasData
    ? (prepareAnalysisPayload(campaigns, cohortData, weekLabels, dailyData) as CanonicalAnalyticsSnapshot)
    : null;

  const aiFilters: AiFilters = {
    product: activeTab,
    source: activeSource,
    selectedCampaignId: selectedCampaignId,
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans flex">
      {/* Main Content (Flex-1) */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="container py-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Campaign Perfomance Analyzer</h1>
                    {dateRange && (
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Report Period: {dateRange}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Assistant Toggle */}
                {hasData && (
                  <Button
                    onClick={() => setShowAISidebar(!showAISidebar)}
                    variant={showAISidebar ? "default" : "outline"}
                    size="sm"
                    className={`gap-2 ${showAISidebar ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
                  >
                    <Bot size={16} />
                    AI Assistant
                  </Button>
                )}
              </div>

              {hasData && (
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <FilterTabs activeTab={activeTab} onTabChange={handleTabChange} />
                    
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      {['All', 'Facebook', 'Google', 'Bigo'].map((source) => (
                        <button
                          key={source}
                          onClick={() => handleSourceChange(source)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                            activeSource === source
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {source === 'Facebook' && <Facebook size={14} />}
                          {source === 'Google' && <Globe size={14} />}
                          {source === 'Bigo' && <Video size={14} />}
                          {source === 'All' && <Users size={14} />}
                          <span className="hidden sm:inline">{source}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    <ViewToggle view={view} onViewChange={setView} />

                    <Button
                      onClick={() => setShowSettings(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Settings size={16} />
                    </Button>

                    <button 
                      onClick={() => { 
                        setSummaryData([]); 
                        setDailyData([]);
                        setCampaigns([]); 
                        setChartData([]);
                        setCohortData([]);
                        setWeekLabels([]);
                        setDateRange("");
                      }}
                      className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-md transition-colors"
                    >
                      Reset Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="container mt-8 space-y-8 pb-20">
          {!hasData && (
            <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">1. Upload Campaign Summary</h3>
                  <p className="text-sm text-slate-500 mb-4">Aggregated by Campaign (No Date column). Source for Tables & KPIs.</p>
                  {summaryData.length > 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Summary Data Loaded ({summaryData.length} rows)
                    </div>
                  ) : (
                    <FileUploader onFileUpload={handleSummaryUpload} />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">2. Upload Daily Cohort Report</h3>
                  <p className="text-sm text-slate-500 mb-4">Time Series Data (With Date & Revenue Columns). Source for Cohort Analysis.</p>
                  {dailyData.length > 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Daily Data Loaded
                    </div>
                  ) : (
                    <FileUploader onFileUpload={handleDailyUpload} />
                  )}
                </div>
              </div>
            </div>
          )}

          {hasData && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {view === "financial" ? (
                  <>
                    <KPICard 
                      title="Total Spend" 
                      value={formatCurrency(metrics.totalSpend)} 
                      icon={Wallet} 
                      iconColorClass="text-slate-500 bg-slate-100"
                      split={metrics.spendSplit}
                    />
                    <KPICard 
                      title="Total Revenue" 
                      value={formatCurrency(metrics.totalRevenue)} 
                      icon={DollarSign} 
                      iconColorClass="text-blue-600 bg-blue-50"
                      colorClass="text-blue-600"
                      split={metrics.revenueSplit}
                    />
                    <KPICard 
                      title="Total Profit" 
                      value={formatCurrency(metrics.totalProfit)} 
                      icon={TrendingUp} 
                      iconColorClass={metrics.totalProfit >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}
                      colorClass={metrics.totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
                      trend={metrics.totalProfit >= 0 ? "up" : "down"}
                      trendValue={metrics.totalProfit >= 0 ? "Positive" : "Negative"}
                      split={metrics.totalProfit >= 0 ? metrics.profitSplit : undefined}
                    />
                    <KPICard 
                      title="Avg ROAS" 
                      value={`${metrics.avgRoas.toFixed(1)}%`} 
                      icon={CreditCard} 
                      iconColorClass={metrics.avgRoas >= 100 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}
                      colorClass={metrics.avgRoas >= 100 ? "text-emerald-600" : "text-amber-600"}
                    />
                  </>
                ) : (
                  <>
                    <KPICard 
                      title="Total Installs" 
                      value={metrics.totalInstalls.toLocaleString()} 
                      icon={Users} 
                      iconColorClass="text-purple-600 bg-purple-50"
                      colorClass="text-purple-600"
                      split={metrics.installsSplit}
                      metricType="number"
                    />
                    <KPICard 
                      title="Total Cards" 
                      value={metrics.totalCards.toLocaleString()} 
                      icon={CreditCard} 
                      iconColorClass="text-cyan-600 bg-cyan-50"
                      colorClass="text-cyan-600"
                      subValue={`CPA ${formatCurrencyDecimal(metrics.avgCpaCards)}`}
                      split={metrics.cardsSplit}
                      metricType="number"
                    />
                    <KPICard 
                      title="Total Subs" 
                      value={metrics.totalSubs.toLocaleString()} 
                      icon={Rocket} 
                      iconColorClass="text-indigo-600 bg-indigo-50"
                      colorClass="text-indigo-600"
                      subValue={`CPA ${formatCurrencyDecimal(metrics.avgCpaSubs)}`}
                      split={metrics.subsSplit}
                      metricType="number"
                    />
                    <KPICard 
                      title="Avg CPI" 
                      value={formatCurrencyDecimal(metrics.avgCpi)} 
                      icon={Users} 
                      iconColorClass="text-cyan-600 bg-cyan-50"
                      colorClass="text-cyan-600"
                    />
                  </>
                )}
              </div>

              {/* Main Chart Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                {view === "financial" ? (
                  <>
                    <div className="mb-6">
                      <h2 className="text-lg font-bold text-slate-900">Weekly Cohort ROAS</h2>
                      <p className="text-sm text-slate-500">Cumulative ROAS by Week</p>
                    </div>
                    <div className="h-[400px]">
                      <CohortRoasChart 
                        data={cohortData} 
                        weekLabels={weekLabels} 
                        rawDailyData={dailyData}
                        campaignName={null}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Daily Acquisition Volume</h2>
                        <p className="text-sm text-slate-500">Trend of new users and conversions over time</p>
                      </div>
                      
                      <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                        <button
                          onClick={() => setVolumeMetric("installs")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            volumeMetric === "installs" 
                              ? "bg-white text-slate-900 shadow-sm" 
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Installs
                        </button>
                        <button
                          onClick={() => setVolumeMetric("cards")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            volumeMetric === "cards" 
                              ? "bg-white text-slate-900 shadow-sm" 
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Cards
                        </button>
                        <button
                          onClick={() => setVolumeMetric("subs")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            volumeMetric === "subs" 
                              ? "bg-white text-slate-900 shadow-sm" 
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Subs
                        </button>
                      </div>
                    </div>
                    <div className="h-[400px]">
                      <DailyVolumeChart data={chartData} metric={volumeMetric} />
                    </div>
                  </>
                )}
              </div>

              {/* Campaign Leaderboard */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900">Campaign Leaderboard</h2>
                  <button 
                    onClick={() => setShowAllRows(!showAllRows)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {showAllRows ? (
                      <>Show Top 5 <ChevronUp size={16} /></>
                    ) : (
                      <>Show All ({campaigns.length}) <ChevronDown size={16} /></>
                    )}
                  </button>
                </div>
                
                <CampaignTable 
                  campaigns={displayedCampaigns} 
                  view={view}
                  onCampaignClick={handleCampaignClick}
                  selectedCampaignId={selectedCampaignId}
                  getCohortData={getCohortDataForCampaign}
                  getAcquisitionData={getAcquisitionDataForCampaign}
                  rawDailyData={dailyData}
                />
              </div>

              {/* Methodology Footer */}
              <MethodologySection />
            </>
          )}
        </div>
      </div>

      {/* AI Chat Sidebar (Right Pane, 350px) */}
      <AIChatSidebar
        isOpen={showAISidebar}
        onClose={() => setShowAISidebar(false)}
        onOpenSettings={() => setShowSettings(true)}
        analytics={analyticsSnapshot}
        filters={aiFilters}
      />

      {/* Settings Modal */}
      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
}
