/**
 * BigQuery Integration Service
 * Fetches campaign data from Google BigQuery (AppsFlyer data)
 */

import { BigQuery } from "@google-cloud/bigquery";

// Types for BigQuery campaign data
export interface BQCampaignRow {
  date: string;
  campaign_name: string;
  media_source: string;
  cost: number;
  revenue: number;
  installs: number;
  impressions?: number;
  clicks?: number;
  // AppsFlyer specific fields
  af_card_add_fin?: number;
  af_subscription_activated?: number;
}

export interface BQConfig {
  projectId: string;
  datasetId: string;
  // Table names
  summaryTable: string;
  dailyTable: string;
  // Optional: custom query override
  customSummaryQuery?: string;
  customDailyQuery?: string;
}

export interface BQQueryResult {
  success: boolean;
  data?: BQCampaignRow[];
  error?: string;
  rowCount?: number;
  queryTime?: number;
}

/**
 * BigQuery Service Class
 */
export class BigQueryService {
  private client: BigQuery | null = null;
  private config: BQConfig | null = null;

  /**
   * Initialize BigQuery client
   * Credentials come from:
   * 1. GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON key file)
   * 2. Or BIGQUERY_CREDENTIALS env var (JSON string of credentials)
   */
  initialize(config: BQConfig): boolean {
    try {
      this.config = config;

      // Check for credentials
      const credentialsJson = process.env.BIGQUERY_CREDENTIALS;
      const credentialsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (credentialsJson) {
        // Parse JSON credentials from env var
        const credentials = JSON.parse(credentialsJson);
        this.client = new BigQuery({
          projectId: config.projectId,
          credentials,
        });
      } else if (credentialsFile) {
        // Use credentials file path
        this.client = new BigQuery({
          projectId: config.projectId,
          keyFilename: credentialsFile,
        });
      } else {
        // Try default credentials (works in GCP environments)
        this.client = new BigQuery({
          projectId: config.projectId,
        });
      }

      console.log(`[BigQuery] Initialized for project: ${config.projectId}`);
      return true;
    } catch (error) {
      console.error("[BigQuery] Initialization failed:", error);
      return false;
    }
  }

  /**
   * Check if BigQuery is configured
   */
  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * Fetch campaign summary data (aggregated by campaign)
   */
  async fetchSummaryData(
    startDate: string,
    endDate: string
  ): Promise<BQQueryResult> {
    if (!this.client || !this.config) {
      return { success: false, error: "BigQuery not configured" };
    }

    const startTime = Date.now();

    try {
      const query =
        this.config.customSummaryQuery ||
        `
        SELECT
          FORMAT_DATE('%Y-%m-%d', date) as date,
          campaign_name,
          media_source,
          SUM(cost) as cost,
          SUM(revenue) as revenue,
          SUM(installs) as installs,
          SUM(impressions) as impressions,
          SUM(clicks) as clicks,
          SUM(af_card_add_fin) as af_card_add_fin,
          SUM(af_subscription_activated) as af_subscription_activated
        FROM \`${this.config.projectId}.${this.config.datasetId}.${this.config.summaryTable}\`
        WHERE date BETWEEN @startDate AND @endDate
        GROUP BY date, campaign_name, media_source
        ORDER BY date DESC, campaign_name
      `;

      const [rows] = await this.client.query({
        query,
        params: { startDate, endDate },
      });

      return {
        success: true,
        data: rows as BQCampaignRow[],
        rowCount: rows.length,
        queryTime: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error("[BigQuery] Summary query failed:", error);
      return {
        success: false,
        error: error.message || "Query failed",
        queryTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Fetch daily cohort data (time series by day)
   */
  async fetchDailyData(
    startDate: string,
    endDate: string
  ): Promise<BQQueryResult> {
    if (!this.client || !this.config) {
      return { success: false, error: "BigQuery not configured" };
    }

    const startTime = Date.now();

    try {
      const query =
        this.config.customDailyQuery ||
        `
        SELECT
          FORMAT_DATE('%Y-%m-%d', date) as date,
          campaign_name,
          media_source,
          cost,
          revenue,
          installs,
          impressions,
          clicks,
          af_card_add_fin,
          af_subscription_activated
        FROM \`${this.config.projectId}.${this.config.datasetId}.${this.config.dailyTable}\`
        WHERE date BETWEEN @startDate AND @endDate
        ORDER BY date DESC, campaign_name
      `;

      const [rows] = await this.client.query({
        query,
        params: { startDate, endDate },
      });

      return {
        success: true,
        data: rows as BQCampaignRow[],
        rowCount: rows.length,
        queryTime: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error("[BigQuery] Daily query failed:", error);
      return {
        success: false,
        error: error.message || "Query failed",
        queryTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Test connection to BigQuery
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client || !this.config) {
      return { success: false, message: "BigQuery not configured" };
    }

    try {
      // Simple query to test connection
      const [rows] = await this.client.query({
        query: "SELECT 1 as test",
      });

      if (rows && rows.length > 0) {
        return { success: true, message: "Connection successful" };
      }
      return { success: false, message: "No response from BigQuery" };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Connection failed",
      };
    }
  }

  /**
   * List available tables in the dataset
   */
  async listTables(): Promise<string[]> {
    if (!this.client || !this.config) {
      return [];
    }

    try {
      const dataset = this.client.dataset(this.config.datasetId);
      const [tables] = await dataset.getTables();
      return tables.map((t) => t.id || "");
    } catch (error) {
      console.error("[BigQuery] Failed to list tables:", error);
      return [];
    }
  }

  /**
   * Execute custom query (for advanced users)
   */
  async executeCustomQuery(query: string): Promise<BQQueryResult> {
    if (!this.client) {
      return { success: false, error: "BigQuery not configured" };
    }

    const startTime = Date.now();

    try {
      const [rows] = await this.client.query({ query });
      return {
        success: true,
        data: rows as BQCampaignRow[],
        rowCount: rows.length,
        queryTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Query failed",
        queryTime: Date.now() - startTime,
      };
    }
  }
}

// Singleton instance
export const bigQueryService = new BigQueryService();
