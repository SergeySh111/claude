import { describe, it, expect } from 'vitest';
import { generateAIPayload } from '../client/src/lib/ai-payload-generator';
import type { RawCampaignData } from '../client/src/lib/data-processor';

describe('generateAIPayload with Seasonality & Product Benchmarking', () => {
  const mockRawData: RawCampaignData[] = [
    // Week 44 - PaymePlus campaign
    {
      Date: '2024-10-28',
      Campaign: 'PaymePlus_Sub_Campaign_A',
      'Media source': 'facebook.com',
      Cost: 1000,
      revenue_payme: 0,
      gross_profit_payme: 0,
      roas_payme: 0,
      'Installs appsflyer': 100,
      'Unique users ltv days cumulative appsflyer af_card_add_fin': 50,
      'Unique users ltv days cumulative appsflyer af_s2s_subscription_activated': 10,
      'eCPI appsflyer': 10,
      'Revenue 0 days cumulative appsflyer af_transfer_completed': 10000,
      'Revenue 0 days cumulative appsflyer af_purchase': 2000,
      'Revenue 3 days cumulative appsflyer af_transfer_completed': 20000,
      'Revenue 3 days cumulative appsflyer af_purchase': 4000,
      'Revenue 7 days cumulative appsflyer af_transfer_completed': 40000,
      'Revenue 7 days cumulative appsflyer af_purchase': 8000,
      'Revenue 30 days cumulative appsflyer af_transfer_completed': 100000,
      'Revenue 30 days cumulative appsflyer af_purchase': 20000,
    },
    // Week 45 - P2P campaign
    {
      Date: '2024-11-04',
      Campaign: 'P2P_Transfer_Campaign_B',
      'Media source': 'google.com',
      Cost: 2000,
      revenue_payme: 0,
      gross_profit_payme: 0,
      roas_payme: 0,
      'Installs appsflyer': 200,
      'Unique users ltv days cumulative appsflyer af_card_add_fin': 80,
      'Unique users ltv days cumulative appsflyer af_s2s_subscription_activated': 20,
      'eCPI appsflyer': 10,
      'Revenue 0 days cumulative appsflyer af_transfer_completed': 15000,
      'Revenue 0 days cumulative appsflyer af_purchase': 3000,
      'Revenue 3 days cumulative appsflyer af_transfer_completed': 25000,
      'Revenue 3 days cumulative appsflyer af_purchase': 5000,
      'Revenue 7 days cumulative appsflyer af_transfer_completed': 50000,
      'Revenue 7 days cumulative appsflyer af_purchase': 10000,
      'Revenue 30 days cumulative appsflyer af_transfer_completed': 120000,
      'Revenue 30 days cumulative appsflyer af_purchase': 24000,
    },
    // Week 46 - Reach campaign
    {
      Date: '2024-11-11',
      Campaign: 'Reach_Awareness_Campaign_C',
      'Media source': 'bigo.tv',
      Cost: 500,
      revenue_payme: 0,
      gross_profit_payme: 0,
      roas_payme: 0,
      'Installs appsflyer': 50,
      'Unique users ltv days cumulative appsflyer af_card_add_fin': 25,
      'Unique users ltv days cumulative appsflyer af_s2s_subscription_activated': 5,
      'eCPI appsflyer': 10,
      'Revenue 0 days cumulative appsflyer af_transfer_completed': 5000,
      'Revenue 0 days cumulative appsflyer af_purchase': 1000,
      'Revenue 3 days cumulative appsflyer af_transfer_completed': 10000,
      'Revenue 3 days cumulative appsflyer af_purchase': 2000,
      'Revenue 7 days cumulative appsflyer af_transfer_completed': 20000,
      'Revenue 7 days cumulative appsflyer af_purchase': 4000,
      'Revenue 30 days cumulative appsflyer af_transfer_completed': 50000,
      'Revenue 30 days cumulative appsflyer af_purchase': 10000,
    },
  ];

  const mockDateRange = 'Oct 28, 2024 - Nov 12, 2024';
  const mockActiveTab = 'All';
  const mockActiveSource = 'All';

  it('should include seasonality context', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    expect(payload).toContain('SEASONALITY CONTEXT:');
    expect(payload).toContain('Context:');
  });

  it('should detect Black Friday period', () => {
    const blackFridayData = mockRawData.map(row => ({
      ...row,
      Date: '2024-11-25', // Black Friday week
    }));

    const payload = generateAIPayload(
      blackFridayData,
      'Nov 20, 2024 - Nov 30, 2024',
      mockActiveTab,
      mockActiveSource
    );

    expect(payload).toContain('Black Friday Period');
    expect(payload).toContain('High CPM');
  });

  it('should detect New Year Rush period', () => {
    const newYearData = mockRawData.map(row => ({
      ...row,
      Date: '2024-12-25',
    }));

    const payload = generateAIPayload(
      newYearData,
      'Dec 20, 2024 - Dec 31, 2024',
      mockActiveTab,
      mockActiveSource
    );

    expect(payload).toContain('New Year Rush');
    expect(payload).toContain('high conversion rates');
  });

  it('should detect Post-Holiday Slump', () => {
    const postHolidayData = mockRawData.map(row => ({
      ...row,
      Date: '2025-01-05',
    }));

    const payload = generateAIPayload(
      postHolidayData,
      'Jan 01, 2025 - Jan 10, 2025',
      mockActiveTab,
      mockActiveSource
    );

    expect(payload).toContain('Post-Holiday Slump');
    expect(payload).toContain('activity typically drops');
  });

  it('should include product winners section', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    expect(payload).toContain('PRODUCT WINNERS:');
    expect(payload).toContain('Best ROAS:');
    expect(payload).toContain('Highest Volume:');
  });

  it('should identify best ROAS product', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    // Should identify which product has the best ROAS
    expect(payload).toMatch(/Best ROAS: (PaymePlus|P2P|Reach|Payments|Other)/);
  });

  it('should identify highest volume product', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    // Should identify which product has the highest spend
    expect(payload).toMatch(/Highest Volume: (PaymePlus|P2P|Reach|Payments|Other)/);
    expect(payload).toContain('spend');
  });

  it('should include cohort velocity tracking', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    expect(payload).toContain('COHORT VELOCITY');
    expect(payload).toContain('Week-over-Week Day 0 ROAS');
  });

  it('should flag improving cohort starts', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    // Should have velocity indicators (either improving or weakening)
    const hasVelocityIndicators = 
      payload.includes('🟢 Improving Start') || 
      payload.includes('🔴 Weakening Start');
    
    expect(hasVelocityIndicators).toBe(true);
  });

  it('should show week-over-week percentage changes', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    // Should include percentage changes in velocity section
    const hasPercentageChange = 
      payload.match(/[+-]\d+\.\d+%/) !== null;
    
    expect(hasPercentageChange).toBe(true);
  });

  it('should maintain all existing cohort anomaly detection features', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    // Should still have all the previous features
    expect(payload).toContain('GLOBAL BENCHMARK ROAS CURVE:');
    expect(payload).toContain('WEEKLY COHORT ANALYSIS:');
    expect(payload).toContain('Day 0 ROAS');
    expect(payload).toContain('Day 3 ROAS');
    expect(payload).toContain('Day 7 ROAS');
  });

  it('should handle standard business season', () => {
    const standardData = mockRawData.map(row => ({
      ...row,
      Date: '2024-03-15', // Random date not in any special season
    }));

    const payload = generateAIPayload(
      standardData,
      'Mar 10, 2024 - Mar 20, 2024',
      mockActiveTab,
      mockActiveSource
    );

    expect(payload).toContain('Standard business season');
  });

  it('should handle empty data gracefully', () => {
    const payload = generateAIPayload(
      [],
      mockDateRange,
      'P2P',
      'Facebook'
    );

    expect(payload).toContain('NO DATA FOUND');
  });

  it('should include all products in breakdown when data exists', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    // Should have processed PaymePlus, P2P, and Reach campaigns
    // At least one of them should be mentioned in product winners
    const hasProducts = 
      payload.includes('PaymePlus') || 
      payload.includes('P2P') || 
      payload.includes('Reach');
    
    expect(hasProducts).toBe(true);
  });

  it('should maintain proper payload structure', () => {
    const payload = generateAIPayload(
      mockRawData,
      mockDateRange,
      mockActiveTab,
      mockActiveSource
    );

    // Check that all major sections are present in order
    const seasonalityIndex = payload.indexOf('SEASONALITY CONTEXT:');
    const productIndex = payload.indexOf('PRODUCT WINNERS:');
    const velocityIndex = payload.indexOf('COHORT VELOCITY');
    const weeklyIndex = payload.indexOf('WEEKLY COHORT ANALYSIS:');

    expect(seasonalityIndex).toBeGreaterThan(-1);
    expect(productIndex).toBeGreaterThan(seasonalityIndex);
    expect(velocityIndex).toBeGreaterThan(productIndex);
    expect(weeklyIndex).toBeGreaterThan(velocityIndex);
  });
});
