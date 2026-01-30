import Papa from 'papaparse';
import { ProcessedCampaign } from './data-processor';

export interface ExportRow {
  Rank: number;
  Source: string;
  Category: string;
  Campaign: string;
  Spend: number;
  Revenue: number;
  Profit: number;
  ROAS: string;
  Installs: number;
  CPI: number;
  Cards: number;
  'CPA (Cards)': number;
  Subs: number;
  'CPA (Subs)': number;
  'PI Score': number;
}

export const exportToCSV = (campaigns: ProcessedCampaign[], filename: string = 'campaign-analysis.csv') => {
  // Transform data to export format
  const exportData: ExportRow[] = campaigns.map(campaign => ({
    Rank: campaign.globalRank || campaign.rank,
    Source: campaign.normalizedSource,
    Category: campaign.category,
    Campaign: campaign.campaignName,
    Spend: Math.round(campaign.cost),
    Revenue: Math.round(campaign.revenue),
    Profit: Math.round(campaign.profit),
    ROAS: `${campaign.roas.toFixed(1)}%`,
    Installs: campaign.installs,
    CPI: parseFloat(campaign.cpi.toFixed(2)),
    Cards: campaign.cards,
    'CPA (Cards)': parseFloat(campaign.cpaCards.toFixed(2)),
    Subs: campaign.subs,
    'CPA (Subs)': parseFloat(campaign.cpaSubs.toFixed(2)),
    'PI Score': campaign.piScore,
  }));

  // Convert to CSV
  const csv = Papa.unparse(exportData, {
    header: true,
    columns: [
      'Rank',
      'Source',
      'Category',
      'Campaign',
      'Spend',
      'Revenue',
      'Profit',
      'ROAS',
      'Installs',
      'CPI',
      'Cards',
      'CPA (Cards)',
      'Subs',
      'CPA (Subs)',
      'PI Score',
    ],
  });

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
