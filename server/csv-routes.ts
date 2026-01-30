import { Router } from "express";
import multer from "multer";
import Papa from "papaparse";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Helper to parse numbers
const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = val.toString().replace(/[^0-9.-]+/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Helper to determine category
const determineCategory = (campaignName: string): string => {
  const name = (campaignName || '').toLowerCase();
  
  if (name.includes('pfm') || name.includes('fines') || name.includes('fine') || name.includes('payment')) {
    return 'Payments';
  }
  if (name.includes('reach') || name.includes('brand')) {
    return 'Reach';
  }
  if (name.includes('paymeplus') || name.includes('payme plus') || name.includes('payme+')) {
    return 'PaymePlus';
  }
  if (name.includes('p2p') || name.includes('transfer')) {
    return 'P2P';
  }
  return 'Other';
};

// Helper to normalize media source
const normalizeSource = (source: string): string => {
  const s = (source || '').toLowerCase();
  if (s.includes('facebook') || s.includes('instagram') || s.includes('meta')) return 'Facebook';
  if (s.includes('google') || s.includes('youtube') || s.includes('gdn')) return 'Google';
  if (s.includes('bigo')) return 'Bigo';
  return 'Other';
};

// Process Summary CSV
router.post("/process-summary", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const csvText = req.file.buffer.toString("utf-8");
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const rawData = parsed.data as any[];

    // Process campaigns
    const campaigns = rawData.map((row, index) => {
      const cost = parseNumber(row.Cost);
      const revenue = parseNumber(row.revenue_payme);
      const profit = parseNumber(row.gross_profit_payme);
      const installs = parseNumber(row['Installs appsflyer']);
      const cards = parseNumber(row['Unique users ltv days cumulative appsflyer af_card_add_fin']);
      const subs = parseNumber(row['Unique users ltv days cumulative appsflyer af_s2s_subscription_activated']);
      const mediaSource = row['Media source'] || '';

      return {
        id: row.Campaign || `campaign-${index}`,
        rank: index + 1,
        globalRank: index + 1,
        category: determineCategory(row.Campaign || ''),
        campaignName: row.Campaign || '',
        mediaSource,
        normalizedSource: normalizeSource(mediaSource),
        cost,
        revenue,
        profit,
        roas: cost > 0 ? (revenue / cost) * 100 : 0,
        installs,
        cards,
        cpaCards: cards > 0 ? cost / cards : 0,
        subs,
        cpaSubs: subs > 0 ? cost / subs : 0,
        cpi: installs > 0 ? cost / installs : 0,
        piScore: 0, // Will be calculated later
      };
    });

    // Filter out campaigns with zero spend
    const activeCampaigns = campaigns.filter(c => c.cost > 0);

    // Calculate PI Score (Min-Max Normalization)
    const maxRoas = Math.max(...activeCampaigns.map(c => c.roas), 1);
    const minCpi = Math.min(...activeCampaigns.filter(c => c.cpi > 0).map(c => c.cpi), 0.01);
    const maxCpi = Math.max(...activeCampaigns.map(c => c.cpi), 1);

    activeCampaigns.forEach(c => {
      const roasScore = (c.roas / maxRoas) * 50;
      const cpiScore = maxCpi > minCpi ? ((maxCpi - c.cpi) / (maxCpi - minCpi)) * 30 : 15;
      const volumeScore = Math.min(c.installs / 1000, 20);
      c.piScore = Math.round(roasScore + cpiScore + volumeScore);
    });

    // Sort by PI Score
    activeCampaigns.sort((a, b) => b.piScore - a.piScore);
    activeCampaigns.forEach((c, i) => {
      c.rank = i + 1;
      c.globalRank = i + 1;
    });

    res.json({ campaigns: activeCampaigns, rawData });
  } catch (error: any) {
    console.error("Error processing summary CSV:", error);
    res.status(500).json({ error: error.message || "Failed to process CSV" });
  }
});

// Process Daily CSV
router.post("/process-daily", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const csvText = req.file.buffer.toString("utf-8");
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const rawData = parsed.data as any[];

    // Extract date range
    const dates = rawData
      .map(row => row.Date)
      .filter(Boolean)
      .sort();
    
    const dateRange = dates.length > 0 
      ? `${dates[0]} to ${dates[dates.length - 1]}`
      : '';

    res.json({ rawData, dateRange });
  } catch (error: any) {
    console.error("Error processing daily CSV:", error);
    res.status(500).json({ error: error.message || "Failed to process CSV" });
  }
});

export default router;
