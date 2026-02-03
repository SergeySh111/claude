/**
 * BigQuery Configuration Modal
 * Allows users to configure and test BigQuery connection
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Calendar,
  Table,
} from "lucide-react";
import { format, subDays } from "date-fns";

interface BigQueryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataFetched?: (summaryData: any[], dailyData: any[]) => void;
}

interface BQStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  config?: {
    projectId: string;
    datasetId: string;
    summaryTable: string;
    dailyTable: string;
  };
}

export function BigQueryConfigModal({
  isOpen,
  onClose,
  onDataFetched,
}: BigQueryConfigModalProps) {
  // Configuration state
  const [projectId, setProjectId] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [summaryTable, setSummaryTable] = useState("campaign_summary");
  const [dailyTable, setDailyTable] = useState("campaign_daily");
  const [customQuery, setCustomQuery] = useState("");

  // Date range for fetching
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Status state
  const [status, setStatus] = useState<BQStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  // Load status on open
  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/bigquery/status");
      const data = await response.json();
      setStatus(data);

      if (data.config) {
        setProjectId(data.config.projectId);
        setDatasetId(data.config.datasetId);
        setSummaryTable(data.config.summaryTable);
        setDailyTable(data.config.dailyTable);
      }

      // Load available tables if configured
      if (data.configured && data.connected) {
        loadTables();
      }
    } catch (err) {
      console.error("Failed to check status:", err);
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch("/api/bigquery/tables");
      const data = await response.json();
      if (data.success) {
        setAvailableTables(data.tables);
      }
    } catch (err) {
      console.error("Failed to load tables:", err);
    }
  };

  const handleConfigure = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/bigquery/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          datasetId,
          summaryTable,
          dailyTable,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("BigQuery configured successfully!");
        await checkStatus();
      } else {
        setError(data.error || "Configuration failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to configure BigQuery");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/bigquery/status");
      const data = await response.json();

      if (data.connected) {
        setSuccessMessage("Connection test successful!");
      } else {
        setError(data.message || "Connection test failed");
      }
    } catch (err: any) {
      setError(err.message || "Connection test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchData = async () => {
    setIsFetching(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/bigquery/fetch-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = await response.json();

      if (data.success) {
        const summaryRows = data.summary?.data || [];
        const dailyRows = data.daily?.data || [];

        setSuccessMessage(
          `Fetched ${summaryRows.length} summary rows and ${dailyRows.length} daily rows in ${data.totalQueryTime}ms`
        );

        if (onDataFetched) {
          onDataFetched(summaryRows, dailyRows);
        }
      } else {
        setError(data.error || "Failed to fetch data");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            BigQuery Configuration
          </DialogTitle>
          <DialogDescription>
            Connect to Google BigQuery to automatically fetch campaign data from
            AppsFlyer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status indicator */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {status?.connected ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700 dark:text-green-400">
                  Connected to BigQuery
                </span>
              </>
            ) : status?.configured ? (
              <>
                <XCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-700 dark:text-yellow-400">
                  Configured but not connected
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-gray-400" />
                <span className="text-muted-foreground">Not configured</span>
              </>
            )}
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {/* Configuration Form */}
          <div className="space-y-4">
            <h3 className="font-medium">Connection Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">GCP Project ID</Label>
                <Input
                  id="projectId"
                  placeholder="my-gcp-project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="datasetId">Dataset ID</Label>
                <Input
                  id="datasetId"
                  placeholder="appsflyer_data"
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="summaryTable">Summary Table</Label>
                <Input
                  id="summaryTable"
                  placeholder="campaign_summary"
                  value={summaryTable}
                  onChange={(e) => setSummaryTable(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyTable">Daily Table</Label>
                <Input
                  id="dailyTable"
                  placeholder="campaign_daily"
                  value={dailyTable}
                  onChange={(e) => setDailyTable(e.target.value)}
                />
              </div>
            </div>

            {/* Available tables */}
            {availableTables.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Available Tables
                </Label>
                <div className="flex flex-wrap gap-2">
                  {availableTables.map((table) => (
                    <span
                      key={table}
                      className="px-2 py-1 text-xs rounded bg-muted cursor-pointer hover:bg-muted/80"
                      onClick={() => {
                        if (table.includes("summary")) {
                          setSummaryTable(table);
                        } else if (table.includes("daily")) {
                          setDailyTable(table);
                        }
                      }}
                    >
                      {table}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleConfigure}
                disabled={isLoading || !projectId || !datasetId}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Configuration
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || !status?.configured}
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>
          </div>

          {/* Date Range & Fetch */}
          {status?.connected && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fetch Data
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleFetchData}
                disabled={isFetching}
                className="w-full"
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Fetch Campaign Data
              </Button>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-medium">Setup Instructions</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                1. Create a Service Account in Google Cloud Console with
                BigQuery Data Viewer role
              </p>
              <p>2. Download the JSON key file</p>
              <p>
                3. Add the key to Railway as{" "}
                <code className="px-1 py-0.5 bg-muted rounded">
                  BIGQUERY_CREDENTIALS
                </code>{" "}
                environment variable (paste the entire JSON content)
              </p>
              <p>4. Enter your Project ID and Dataset ID above</p>
              <p>
                5. Make sure your AppsFlyer data is exported to BigQuery (via
                Data Locker or Push API)
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
