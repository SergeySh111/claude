# Project TODO

## Split-View Analytics Suite Refactoring

### Layout & UI Architecture
- [x] Implement Two-Pane Flex Layout (Left: Main Content flex-1, Right: AI Sidebar 350px)
- [x] Add collapsible AI Assistant sidebar with toggle button in header
- [x] Remove old AI Analysis modal (replaced by sidebar chat)

### Data Processing & Source Mapping
- [x] Refactor CSV upload order: Process Dropzone B (Campaign Summary) FIRST - Already implemented
- [x] Build Campaign -> Media Source lookup table from Dropzone B - Already implemented (line 159-162)
- [x] Enrich Dropzone A (Daily Cohorts) with source property using lookup - Already implemented (line 181-184)
- [x] Implement source normalization: Facebook, Google, Bigo, Other - Already implemented (line 92-98)

### Filtering System
- [x] Add Product filter tabs: [All, P2P, Payments, PaymePlus, Reach] - Already implemented
- [x] Add Source filter buttons: [All Sources, Facebook, Google, Bigo] - Already implemented
- [x] Implement matrix filtering logic (Product AND Source) - Already implemented
- [x] Update UI to show both filter sets in header - Already implemented

### AI Intelligence System
- [x] Create generateAIPayload function with pre-calculated stats
- [x] Implement weekly aggregation (Week Cost, Revenue, ROAS)
- [x] Add Top 3 profitable campaigns calculation
- [x] Add Bottom 3 bleeding campaigns calculation
- [x] Build new AI Chat component for sidebar
- [x] Implement streaming responses in AI Chat
- [x] Add conversation history to AI Chat
- [x] Update OpenAI integration to use pre-calculated payload only
- [x] Remove raw CSV data from AI prompts

### Chart & Data Visualization
- [x] Verify strict calendar weeks using date-fns getISOWeek - Already implemented (line 103)
- [x] Ensure smart cut-off (null values beyond ReportMaxDate) - Already implemented
- [x] Verify revenue formula: (Transfer * 0.007) + (Purchase * 0.00635) - Already implemented
- [x] Update main chart to show aggregated average for current selection - Already implemented

### Table Refactoring
- [x] Update table columns: Rank | Source Icon | Campaign | Spend | Profit | PI Score - Already implemented
- [x] Ensure accordion functionality (click to expand mini-chart) - Already implemented
- [x] Verify Clearbit icons use correct source-mapped domains - Already implemented
- [x] Remove CSV Export button and functionality

### Testing & Verification
- [x] Test dual-file upload with new source mapping
- [x] Test matrix filtering with all combinations
- [x] Test AI Chat with pre-calculated payload - Unit tests passing (8/8)
- [x] Test sidebar toggle and responsive layout
- [x] Verify all charts render correctly with filtered data


## Critical Fixes

### FIX 1: Chat UI Scrolling Bug
- [x] Set sidebar container to fixed height: h-screen
- [x] Add sticky positioning: sticky top-0
- [x] Ensure flex-col layout on sidebar container
- [x] Make message area scrollable internally: flex-1 overflow-y-auto min-h-0
- [x] Keep input area fixed at bottom: flex-none border-t

### FIX 2: AI Zero Data Logic Error
- [x] Refactor generateAIPayload to iterate through cohortData directly
- [x] Apply current filters (Product & Source) inside payload generation
- [x] Calculate revenue with explicit formula: (transfer * 0.007) + (purchase * 0.00635)
- [x] Generate human-readable summary string instead of JSON
- [x] Add console.log for debugging AI payload
- [x] Update system prompt to trust provided numbers
- [x] Add "No data found" message when filters return empty results


## FIX 3: Zero ROAS Issue in AI Payload

### Root Cause
- [x] CSV has cumulative columns (Revenue 0 days, Revenue 30 days, etc.), not single Revenue column
- [x] Current code uses campaign summary revenue instead of extracting from daily cohort data

### Implementation
- [x] Create getLatestRevenue(row) helper function
- [x] Find all columns matching pattern: Revenue X days...af_purchase or af_transfer_completed
- [x] Extract day number from column name
- [x] Find largest day number with valid numeric value
- [x] Calculate business revenue: (TransferGMV * 0.007) + (PurchaseGMV * 0.00635)
- [x] Refactor generateAIPayload to accept raw daily data (RawCampaignData[])
- [x] Aggregate cost and revenue using getLatestRevenue helper
- [x] Update Home.tsx to pass dailyData instead of processed campaigns
- [x] Add console.log debugging for calculated totals
- [x] Update unit tests to use raw data structure - All 11/11 tests passing


## Cohort Anomaly Detection Upgrade

### Global Benchmark Curve
- [x] Calculate average ROAS at Day 0, Day 3, and Day 7 across all filtered data
- [x] Extract revenue from specific day columns (Revenue 0 days, Revenue 3 days, Revenue 7 days)
- [x] Use formula: (af_transfer_completed * 0.007) + (af_purchase * 0.00635)
- [x] Store as Benchmark = { d0: X%, d3: Y%, d7: Z% }

### Per-Week Cohort Analysis
- [x] Group raw data by ISO week number
- [x] For each week, calculate ROAS at Day 0, Day 3, and Day 7
- [x] Compare week's Day 7 ROAS against benchmark
- [x] Flag as "📉 Underperforming" if < 80% of benchmark
- [x] Flag as "🚀 Outperforming" if > 120% of benchmark
- [x] Detect "Retention Issue" pattern (high Day 0, low Day 7)

### Smart Payload Construction
- [x] Include benchmark ROAS curve in payload
- [x] List each week with Day 0, Day 3, Day 7 ROAS and status flag
- [x] Add AI instructions to identify specific week/day anomalies
- [x] Add AI instructions to detect retention issues

### Testing & Integration
- [x] Update unit tests with multi-day revenue columns
- [x] Test anomaly detection logic with mock data - All 13/13 tests passing
- [x] Verify AI responses mention specific "Week X" and "Day Y"


## Seasonality Context & Product Benchmarking

### Seasonality Detector
- [x] Create getSeasonalityContext(startDate, endDate) helper function
- [x] Detect Black Friday period (Nov 20-30): High CPM warning
- [x] Detect New Year Rush (Dec 20-31): High conversion note
- [x] Detect Post-Holiday Slump (Jan 01-10): Low activity warning
- [x] Return default "Standard business season" for other periods

### Product Breakdown Analysis
- [x] Group raw data by Product category (PaymePlus, P2P, Payments, Reach)
- [x] Calculate average ROAS for each product
- [x] Calculate total spend (volume) for each product
- [x] Identify Best ROAS product winner
- [x] Identify Highest Volume product winner
- [x] Include product winners in AI payload

### Cohort Velocity Tracking
- [x] Compare week-over-week Day 0 ROAS changes
- [x] Flag "Improving Start" when current week Day 0 > previous week
- [x] Flag "Weakening Start" when current week Day 0 < previous week
- [x] Add velocity indicators to weekly cohort analysis

### Strategic System Prompt
- [x] Update AI chat service with new system prompt structure
- [x] Add sections: Seasonal Impact, Product Battle, Cohort Health, Anomalies
- [x] Set professional, analytical, concise tone
- [x] Position AI as "Head of User Acquisition"

### Testing & Integration
- [x] Update unit tests with seasonality detection scenarios
- [x] Test product benchmarking with multi-product data
- [x] Verify cohort velocity calculations
- [x] Test AI responses with new strategic prompt - All 15/15 tests passing


## Product Categorization Update
- [x] Move "pfm" keyword from PaymePlus to Payments category


## Product Categorization Correction
- [x] Revert "pfm" keyword back to PaymePlus category (user confirmed PFM should be PaymePlus, not Payments)


## PFM Categorization Debug
- [x] Investigate why PFM campaigns still show as "Other" despite code update
- [x] Found duplicate determineCategory function in ai-payload-generator.ts
- [x] Add debug logging to determineCategory function
- [x] Updated both determineCategory functions to include 'pfm' keyword


## URGENT: PFM Still Showing as Other
- [x] Verify both determineCategory functions have 'pfm' keyword
- [x] Check if there are any other files with category logic
- [x] Found backend/main.py Python file with determine_category function
- [x] Updated backend Python function to include 'pfm' keyword
- [x] Restarted backend server to apply changes


## Backend Connectivity Issue
- [x] Check if Python backend is running on port 8000
- [x] Installed missing python-multipart dependency
- [x] Started backend server successfully
- [x] Verify API_URL configuration in frontend
- [x] Test backend endpoint accessibility - working
- [x] CORS already configured to allow all origins


## Source Logos Enhancement
- [x] Download Facebook, Google, Bigo logos
- [x] Add logos to public assets folder (client/public/logos/)
- [x] Update campaign table to display source logos instead of generic icons
- [x] Ensure logos are properly sized and styled


## Deep Dive Drill-Down for Cohort Chart
- [x] Add selectedWeekGroup state management
- [x] Implement back navigation button in chart header
- [x] Create daily data processing logic for selected week
- [x] Add line click interaction to trigger drill-down
- [x] Assign distinct colors for 7 days of the week
- [x] Pass rawDailyData through component hierarchy
- [x] Install date-fns for date formatting


## Fix Line Click Interaction
- [x] Debug why line click is not triggering drill-down
- [x] Changed from Line onClick to Legend onClick (Recharts standard)
- [x] Users now click on legend items (week names) to drill down


## Fix Main Dashboard Drill-Down
- [x] Find where main dashboard cohort chart is rendered (line 362 in Home.tsx)
- [x] Pass rawDailyData to main dashboard chart
- [x] Ensure campaignName is null for aggregated view
- [x] Now drill-down works in both main dashboard and campaign detail views


## KPI Card Product Split Enhancement
- [x] Refactor KPICard component to accept split prop
- [x] Add stacked progress bar below main metric value (h-2 rounded)
- [x] Implement product color scheme (P2P: blue, PaymePlus: purple, Payments: emerald, Reach: orange)
- [x] Add tooltip showing breakdown on hover with percentages
- [x] Add inline legend below split bar
- [x] Create aggregation logic for product splits by metric
- [x] Handle edge cases (negative profits hidden, zero values filtered)
- [x] Update Financial Health cards with splits (Spend, Revenue, Profit)
- [x] Update User Acquisition cards with splits (Installs, Cards, Subs)
- [x] Reorder User Acquisition cards (Installs, Cards, Subs, Avg CPI)


## Daily Cohort Smart Cut-Off
- [x] Apply smart cut-off logic to daily drill-down view
- [x] Daily lines now stop at reportMaxDate like weekly lines
- [x] Calculate daysSinceInstall for each cohort date
- [x] Set values to null after maxDay to stop line rendering


## KPI Split Bar Tooltip Enhancement
- [x] Change tooltip from percentages to absolute values
- [x] Add metricType prop to KPICard (currency | number)
- [x] Format currency values for financial metrics (Spend, Revenue, Profit)
- [x] Format numbers for user acquisition metrics (Installs, Cards, Subs)
- [x] Keep percentage display in legend only

## Zero Spend Campaign Filter
- [x] Filter out campaigns with zero spend from statistics and table
