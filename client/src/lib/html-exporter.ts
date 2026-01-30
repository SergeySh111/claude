import { ProcessedCampaign, RawCampaignData, ChartDataPoint, CohortDataPoint } from "./data-processor";

interface ExportData {
  summaryData: ProcessedCampaign[];
  dailyData: RawCampaignData[];
  dateRange: string;
  exportDate: string;
  chartData?: ChartDataPoint[];
  cohortData?: CohortDataPoint[];
  weekLabels?: string[];
  metrics?: {
    totalSpend: number;
    totalRevenue: number;
    totalProfit: number;
    avgRoas: number;
    totalInstalls: number;
    avgCpi: number;
    totalCards: number;
    totalSubs: number;
  };
  activeFilters?: {
    product: string;
    source: string;
  };
}

export function exportToHTML(data: ExportData): void {
  const { summaryData, dateRange, exportDate, metrics, chartData, cohortData, weekLabels, activeFilters } = data;

  // Calculate metrics if not provided
  const totalSpend = metrics?.totalSpend ?? summaryData.reduce((sum, c) => sum + c.cost, 0);
  const totalRevenue = metrics?.totalRevenue ?? summaryData.reduce((sum, c) => sum + c.revenue, 0);
  const totalProfit = metrics?.totalProfit ?? totalRevenue - totalSpend;
  const avgRoas = metrics?.avgRoas ?? (totalSpend > 0 ? (totalRevenue / totalSpend) * 100 : 0);
  const totalInstalls = metrics?.totalInstalls ?? summaryData.reduce((sum, c) => sum + c.installs, 0);
  const avgCpi = metrics?.avgCpi ?? (totalInstalls > 0 ? totalSpend / totalInstalls : 0);
  const totalCards = metrics?.totalCards ?? summaryData.reduce((sum, c) => sum + c.cards, 0);
  const totalSubs = metrics?.totalSubs ?? summaryData.reduce((sum, c) => sum + c.subs, 0);

  // Prepare chart data for Chart.js
  const cohortChartData = cohortData && weekLabels ? {
    labels: weekLabels,
    datasets: cohortData.map((cohort: any, index: number) => ({
      label: cohort.week,
      data: Array.isArray(cohort.days) ? cohort.days.map((d: any) => d.cumulativeRoas || 0) : [],
      borderColor: `hsl(${index * 30}, 70%, 50%)`,
      backgroundColor: `hsla(${index * 30}, 70%, 50%, 0.1)`,
      borderWidth: 2,
      tension: 0.4,
      fill: true,
    }))
  } : null;

  const dailyVolumeData = chartData ? {
    labels: chartData.map(d => d.date),
    installs: chartData.map(d => d.dailyInstalls),
    cards: chartData.map(d => d.dailyCards),
    subs: chartData.map(d => d.dailySubs),
  } : null;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campaign Performance Report - ${dateRange}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 1.5rem 2rem;
      margin: -2rem -2rem 2rem -2rem;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .logo {
      width: 2.5rem;
      height: 2.5rem;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
    }
    
    .header h1 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }
    
    .header p {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
    }
    
    .filter-badges {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    
    .filter-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }
    
    .filter-badge.active {
      background: #dbeafe;
      border-color: #3b82f6;
      color: #1e40af;
    }
    
    .period-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    
    .period-dot {
      width: 0.375rem;
      height: 0.375rem;
      background: #10b981;
      border-radius: 50%;
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .kpi-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    
    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    
    .kpi-title {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }
    
    .kpi-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .kpi-value {
      font-size: 2rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    
    .kpi-label {
      font-size: 0.75rem;
      color: #64748b;
    }
    
    .positive {
      color: #059669;
    }
    
    .negative {
      color: #dc2626;
    }
    
    .section {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    
    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }
    
    .section-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    
    thead {
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    
    th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #475569;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    
    tbody tr:hover {
      background: #f8fafc;
    }
    
    .number {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    
    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      background: #f1f5f9;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }
    
    .rank-badge.top {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
    }
    
    .source-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      background: #f1f5f9;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #475569;
    }
    
    .chart-container {
      position: relative;
      height: 400px;
      margin-top: 1rem;
    }
    
    .footer {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;
      font-size: 0.875rem;
      border-top: 1px solid #e2e8f0;
      margin-top: 2rem;
    }
    
    @media print {
      body {
        background: white;
      }
      
      .header {
        position: relative;
        page-break-after: avoid;
      }
      
      .kpi-grid {
        page-break-inside: avoid;
      }
      
      .section {
        page-break-inside: avoid;
        box-shadow: none;
      }
      
      .chart-container {
        page-break-inside: avoid;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      
      thead {
        display: table-header-group;
      }
      
      .footer {
        page-break-before: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <div class="header-left">
        <div class="logo">📊</div>
        <div>
          <h1>Campaign Performance Analyzer</h1>
          <p class="period-badge">
            <span class="period-dot"></span>
            Report Period: ${dateRange} | Exported: ${exportDate}
          </p>
        </div>
      </div>
      ${activeFilters ? `
      <div class="filter-badges">
        <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Active Filters:</span>
        <span class="filter-badge ${activeFilters.product !== 'All' ? 'active' : ''}">
          Product: ${activeFilters.product}
        </span>
        <span class="filter-badge ${activeFilters.source !== 'All' ? 'active' : ''}">
          Source: ${activeFilters.source}
        </span>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="container">
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-header">
          <div class="kpi-title">Total Spend</div>
          <div class="kpi-icon" style="background: #fef3c7; color: #f59e0b;">💰</div>
        </div>
        <div class="kpi-value">$${totalSpend.toLocaleString()}</div>
        <div class="kpi-label">Total advertising cost</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-header">
          <div class="kpi-title">Total Revenue</div>
          <div class="kpi-icon" style="background: #dbeafe; color: #3b82f6;">💵</div>
        </div>
        <div class="kpi-value">$${totalRevenue.toLocaleString()}</div>
        <div class="kpi-label">Total revenue generated</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-header">
          <div class="kpi-title">Total Profit</div>
          <div class="kpi-icon" style="background: ${totalProfit >= 0 ? '#d1fae5' : '#fee2e2'}; color: ${totalProfit >= 0 ? '#059669' : '#dc2626'};">📈</div>
        </div>
        <div class="kpi-value ${totalProfit >= 0 ? 'positive' : 'negative'}">$${totalProfit.toLocaleString()}</div>
        <div class="kpi-label">${totalProfit >= 0 ? 'Positive' : 'Negative'} return</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-header">
          <div class="kpi-title">Avg ROAS</div>
          <div class="kpi-icon" style="background: #e0e7ff; color: #6366f1;">📊</div>
        </div>
        <div class="kpi-value ${avgRoas >= 100 ? 'positive' : 'negative'}">${avgRoas.toFixed(1)}%</div>
        <div class="kpi-label">Return on ad spend</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-header">
          <div class="kpi-title">Total Installs</div>
          <div class="kpi-icon" style="background: #fce7f3; color: #ec4899;">🚀</div>
        </div>
        <div class="kpi-value">${totalInstalls.toLocaleString()}</div>
        <div class="kpi-label">App installations</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-header">
          <div class="kpi-title">Avg CPI</div>
          <div class="kpi-icon" style="background: #f3e8ff; color: #a855f7;">💳</div>
        </div>
        <div class="kpi-value">$${avgCpi.toFixed(2)}</div>
        <div class="kpi-label">Cost per install</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-header">
          <div class="kpi-title">Total Cards</div>
          <div class="kpi-icon" style="background: #dbeafe; color: #0ea5e9;">💳</div>
        </div>
        <div class="kpi-value">${totalCards.toLocaleString()}</div>
        <div class="kpi-label">Card additions</div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-header">
          <div class="kpi-title">Total Subs</div>
          <div class="kpi-icon" style="background: #d1fae5; color: #10b981;">👥</div>
        </div>
        <div class="kpi-value">${totalSubs.toLocaleString()}</div>
        <div class="kpi-label">Subscriptions</div>
      </div>
    </div>

    ${cohortChartData ? `
    <!-- Weekly Cohort ROAS Chart -->
    <div class="section">
      <h2 class="section-title">Weekly Cohort ROAS</h2>
      <p class="section-subtitle">Cumulative ROAS by Week</p>
      <div class="chart-container">
        <canvas id="cohortChart"></canvas>
      </div>
    </div>
    ` : ''}

    ${dailyVolumeData ? `
    <!-- Daily Volume Chart -->
    <div class="section">
      <h2 class="section-title">Daily Volume Metrics</h2>
      <p class="section-subtitle">Daily installs, cards, and subscriptions over time</p>
      <div class="chart-container">
        <canvas id="volumeChart"></canvas>
      </div>
    </div>
    ` : ''}

    <!-- Campaign Leaderboard -->
    <div class="section">
      <h2 class="section-title">Campaign Leaderboard</h2>
      <p class="section-subtitle">Top performing campaigns ranked by PI Score</p>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Campaign</th>
            <th>Source</th>
            <th class="number">Spend</th>
            <th class="number">Revenue</th>
            <th class="number">Profit</th>
            <th class="number">ROAS</th>
            <th class="number">Installs</th>
            <th class="number">CPI</th>
            <th class="number">PI Score</th>
          </tr>
        </thead>
        <tbody>
          ${summaryData
            .slice(0, 50)
            .map(
              (campaign, index) => `
            <tr>
              <td>
                <span class="rank-badge ${index < 3 ? 'top' : ''}">${campaign.rank}</span>
              </td>
              <td><strong>${campaign.campaignName}</strong></td>
              <td>
                <span class="source-badge">${campaign.normalizedSource}</span>
              </td>
              <td class="number">$${campaign.cost.toLocaleString()}</td>
              <td class="number">$${campaign.revenue.toLocaleString()}</td>
              <td class="number ${campaign.profit >= 0 ? 'positive' : 'negative'}">
                $${campaign.profit.toLocaleString()}
              </td>
              <td class="number ${campaign.roas >= 100 ? 'positive' : 'negative'}">
                ${campaign.roas.toFixed(1)}%
              </td>
              <td class="number">${campaign.installs.toLocaleString()}</td>
              <td class="number">$${campaign.cpi.toFixed(2)}</td>
              <td class="number"><strong>${campaign.piScore.toFixed(1)}</strong></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      ${
        summaryData.length > 50
          ? `<p style="text-align: center; color: #64748b; margin-top: 1rem; font-size: 0.875rem;">
            Showing top 50 of ${summaryData.length} campaigns
          </p>`
          : ""
      }
    </div>

    <!-- Footer -->
    <div class="footer">
      Generated by Campaign Performance Analyzer | ${exportDate}
    </div>
  </div>

  <script>
    // Initialize charts after page load
    window.addEventListener('DOMContentLoaded', function() {
      ${cohortChartData ? `
      // Cohort ROAS Chart
      const cohortCtx = document.getElementById('cohortChart');
      if (cohortCtx) {
        new Chart(cohortCtx, {
          type: 'line',
          data: ${JSON.stringify(cohortChartData)},
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 15,
                  font: {
                    size: 12,
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  font: { size: 11 }
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  font: { size: 11 },
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            }
          }
        });
      }
      ` : ''}

      ${dailyVolumeData ? `
      // Daily Volume Chart
      const volumeCtx = document.getElementById('volumeChart');
      if (volumeCtx) {
        new Chart(volumeCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(dailyVolumeData.labels)},
            datasets: [
              {
                label: 'Installs',
                data: ${JSON.stringify(dailyVolumeData.installs)},
                backgroundColor: 'rgba(236, 72, 153, 0.8)',
                borderColor: 'rgb(236, 72, 153)',
                borderWidth: 1
              },
              {
                label: 'Cards',
                data: ${JSON.stringify(dailyVolumeData.cards)},
                backgroundColor: 'rgba(14, 165, 233, 0.8)',
                borderColor: 'rgb(14, 165, 233)',
                borderWidth: 1
              },
              {
                label: 'Subs',
                data: ${JSON.stringify(dailyVolumeData.subs)},
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 15,
                  font: {
                    size: 12,
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  font: { size: 10 },
                  maxRotation: 45,
                  minRotation: 45
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  font: { size: 11 }
                }
              }
            }
          }
        });
      }
      ` : ''}
    });
  </script>
</body>
</html>`;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `campaign-report-${dateRange.replace(/\s+/g, "-")}-${Date.now()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
