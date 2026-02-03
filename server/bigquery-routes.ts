/**
 * BigQuery API Routes
 * Endpoints for configuring and fetching data from BigQuery
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { bigQueryService, BQConfig } from "./bigquery-service";

const router = Router();

// Validation schemas
const ConfigSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  datasetId: z.string().min(1, "Dataset ID is required"),
  summaryTable: z.string().min(1, "Summary table name is required"),
  dailyTable: z.string().min(1, "Daily table name is required"),
  customSummaryQuery: z.string().optional(),
  customDailyQuery: z.string().optional(),
});

const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
});

const CustomQuerySchema = z.object({
  query: z.string().min(1, "Query is required").max(10000, "Query too long"),
});

// Store config in memory (in production, use database or encrypted storage)
let currentConfig: BQConfig | null = null;

/**
 * POST /api/bigquery/configure
 * Configure BigQuery connection
 */
router.post("/configure", async (req: Request, res: Response) => {
  try {
    const parsed = ConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid configuration",
        details: parsed.error.flatten(),
      });
    }

    const config = parsed.data as BQConfig;
    
    // Check if credentials are available
    if (!process.env.BIGQUERY_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return res.status(400).json({
        success: false,
        error: "BigQuery credentials not configured. Set BIGQUERY_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS environment variable.",
      });
    }

    // Initialize BigQuery service
    const initialized = bigQueryService.initialize(config);
    if (!initialized) {
      return res.status(500).json({
        success: false,
        error: "Failed to initialize BigQuery client",
      });
    }

    // Test connection
    const testResult = await bigQueryService.testConnection();
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        error: `Connection test failed: ${testResult.message}`,
      });
    }

    // Save config
    currentConfig = config;

    return res.json({
      success: true,
      message: "BigQuery configured successfully",
      config: {
        projectId: config.projectId,
        datasetId: config.datasetId,
        summaryTable: config.summaryTable,
        dailyTable: config.dailyTable,
      },
    });
  } catch (error: any) {
    console.error("[BigQuery] Configure error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Configuration failed",
    });
  }
});

/**
 * GET /api/bigquery/status
 * Get BigQuery connection status
 */
router.get("/status", async (_req: Request, res: Response) => {
  const isConfigured = bigQueryService.isConfigured();
  
  if (!isConfigured) {
    return res.json({
      configured: false,
      message: "BigQuery not configured",
    });
  }

  const testResult = await bigQueryService.testConnection();
  
  return res.json({
    configured: true,
    connected: testResult.success,
    message: testResult.message,
    config: currentConfig ? {
      projectId: currentConfig.projectId,
      datasetId: currentConfig.datasetId,
      summaryTable: currentConfig.summaryTable,
      dailyTable: currentConfig.dailyTable,
    } : null,
  });
});

/**
 * GET /api/bigquery/tables
 * List available tables in the dataset
 */
router.get("/tables", async (_req: Request, res: Response) => {
  if (!bigQueryService.isConfigured()) {
    return res.status(400).json({
      success: false,
      error: "BigQuery not configured",
    });
  }

  const tables = await bigQueryService.listTables();
  
  return res.json({
    success: true,
    tables,
  });
});

/**
 * POST /api/bigquery/fetch-summary
 * Fetch campaign summary data
 */
router.post("/fetch-summary", async (req: Request, res: Response) => {
  try {
    if (!bigQueryService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: "BigQuery not configured",
      });
    }

    const parsed = DateRangeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid date range",
        details: parsed.error.flatten(),
      });
    }

    const { startDate, endDate } = parsed.data;
    const result = await bigQueryService.fetchSummaryData(startDate, endDate);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result.data,
      rowCount: result.rowCount,
      queryTime: result.queryTime,
    });
  } catch (error: any) {
    console.error("[BigQuery] Fetch summary error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch data",
    });
  }
});

/**
 * POST /api/bigquery/fetch-daily
 * Fetch daily cohort data
 */
router.post("/fetch-daily", async (req: Request, res: Response) => {
  try {
    if (!bigQueryService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: "BigQuery not configured",
      });
    }

    const parsed = DateRangeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid date range",
        details: parsed.error.flatten(),
      });
    }

    const { startDate, endDate } = parsed.data;
    const result = await bigQueryService.fetchDailyData(startDate, endDate);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result.data,
      rowCount: result.rowCount,
      queryTime: result.queryTime,
    });
  } catch (error: any) {
    console.error("[BigQuery] Fetch daily error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch data",
    });
  }
});

/**
 * POST /api/bigquery/fetch-all
 * Fetch both summary and daily data at once
 */
router.post("/fetch-all", async (req: Request, res: Response) => {
  try {
    if (!bigQueryService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: "BigQuery not configured",
      });
    }

    const parsed = DateRangeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid date range",
        details: parsed.error.flatten(),
      });
    }

    const { startDate, endDate } = parsed.data;
    
    // Fetch both in parallel
    const [summaryResult, dailyResult] = await Promise.all([
      bigQueryService.fetchSummaryData(startDate, endDate),
      bigQueryService.fetchDailyData(startDate, endDate),
    ]);

    return res.json({
      success: true,
      summary: {
        success: summaryResult.success,
        data: summaryResult.data,
        rowCount: summaryResult.rowCount,
        error: summaryResult.error,
      },
      daily: {
        success: dailyResult.success,
        data: dailyResult.data,
        rowCount: dailyResult.rowCount,
        error: dailyResult.error,
      },
      totalQueryTime: (summaryResult.queryTime || 0) + (dailyResult.queryTime || 0),
    });
  } catch (error: any) {
    console.error("[BigQuery] Fetch all error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch data",
    });
  }
});

/**
 * POST /api/bigquery/custom-query
 * Execute a custom query (for advanced users)
 */
router.post("/custom-query", async (req: Request, res: Response) => {
  try {
    if (!bigQueryService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: "BigQuery not configured",
      });
    }

    const parsed = CustomQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid query",
        details: parsed.error.flatten(),
      });
    }

    // Security: Basic SQL injection prevention
    const query = parsed.data.query.toLowerCase();
    const dangerousKeywords = ["drop", "delete", "truncate", "alter", "create", "insert", "update"];
    for (const keyword of dangerousKeywords) {
      if (query.includes(keyword)) {
        return res.status(400).json({
          success: false,
          error: `Query contains forbidden keyword: ${keyword}. Only SELECT queries are allowed.`,
        });
      }
    }

    const result = await bigQueryService.executeCustomQuery(parsed.data.query);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result.data,
      rowCount: result.rowCount,
      queryTime: result.queryTime,
    });
  } catch (error: any) {
    console.error("[BigQuery] Custom query error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Query failed",
    });
  }
});

export default router;
