from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from typing import List, Dict, Any
import math
from datetime import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_number(val: Any) -> float:
    if isinstance(val, (int, float)):
        return float(val)
    if not val:
        return 0.0
    # Remove currency symbols, commas, etc.
    clean = str(val).replace('$', '').replace(',', '').replace(' ', '')
    try:
        return float(clean)
    except ValueError:
        return 0.0

def determine_category(campaign_name: str) -> str:
    name = str(campaign_name).lower()
    if 'reach' in name: return 'Reach'
    if 'paymeplus' in name or 'pfm' in name or 'sub' in name: return 'PaymePlus'
    if 'p2p' in name or 'transfer' in name: return 'P2P'
    if 'payment' in name: return 'Payments'
    return 'Other'

def get_iso_week_info(date_str: str) -> Dict[str, Any]:
    try:
        date = pd.to_datetime(date_str)
        year, week, day = date.isocalendar()
        
        # Calculate start and end of the week
        # ISO week starts on Monday
        start_date = datetime.fromisocalendar(year, week, 1)
        end_date = datetime.fromisocalendar(year, week, 7)
        
        label = f"Week {week} ({start_date.strftime('%b %d')} - {end_date.strftime('%b %d')})"
        return {"weekNum": week, "label": label}
    except:
        return {"weekNum": 0, "label": "Unknown"}

@app.post("/api/process-summary")
async def process_summary(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Fill NaN values
        df = df.fillna('')
        
        processed_campaigns = []
        
        for _, row in df.iterrows():
            cost = parse_number(row.get('Cost', 0))
            if cost <= 0:
                continue
                
            revenue = parse_number(row.get('revenue_payme', 0))
            profit = parse_number(row.get('gross_profit_payme', 0))
            installs = parse_number(row.get('Installs appsflyer', 0))
            cards = parse_number(row.get('Unique users ltv days cumulative appsflyer af_card_add_fin', 0))
            subs = parse_number(row.get('Unique users ltv days cumulative appsflyer af_s2s_subscription_activated', 0))
            campaign_name = str(row.get('Campaign', 'Unknown Campaign'))
            media_source = str(row.get('Media source', 'unknown'))
            
            roas = (revenue / cost) * 100 if cost > 0 else 0
            cpi = cost / installs if installs > 0 else 0
            cpa_cards = cost / cards if cards > 0 else 0
            cpa_subs = cost / subs if subs > 0 else 0
            
            processed_campaigns.append({
                "id": campaign_name,
                "category": determine_category(campaign_name),
                "campaignName": campaign_name,
                "mediaSource": media_source,
                "cost": cost,
                "revenue": revenue,
                "profit": profit,
                "roas": roas,
                "installs": installs,
                "cards": cards,
                "cpaCards": cpa_cards,
                "subs": subs,
                "cpaSubs": cpa_subs,
                "cpi": cpi
            })
            
        # Calculate PI Score
        if not processed_campaigns:
            return {"campaigns": []}
            
        df_processed = pd.DataFrame(processed_campaigns)
        
        def normalize(series):
            min_val = series.min()
            max_val = series.max()
            if max_val == min_val:
                return pd.Series([0] * len(series))
            return (series - min_val) / (max_val - min_val)
            
        norm_profit = normalize(df_processed['profit'])
        norm_roas = normalize(df_processed['roas'])
        norm_installs = normalize(df_processed['installs'])
        norm_cards = normalize(df_processed['cards'])
        norm_subs = normalize(df_processed['subs'])
        
        raw_score = (norm_profit * 0.30) + (norm_roas * 0.30) + (norm_installs * 0.30) + (norm_cards * 0.05) + (norm_subs * 0.05)
        df_processed['piScore'] = (raw_score * 100).round(1)
        
        # Sort and Rank
        df_processed = df_processed.sort_values('piScore', ascending=False)
        df_processed['rank'] = range(1, len(df_processed) + 1)
        
        return {"campaigns": df_processed.to_dict('records')}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process-daily")
async def process_daily(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        df = df.fillna(0)
        
        # Ensure Date column exists
        if 'Date' not in df.columns:
            raise HTTPException(status_code=400, detail="CSV must contain a 'Date' column")
            
        # Convert Date to datetime
        df['Date'] = pd.to_datetime(df['Date'])
        
        # --- 1. Chart Data (Trends) ---
        # Group by Date
        # Check for required columns and use defaults if missing
        agg_dict = {}
        if 'Cost' in df.columns: agg_dict['Cost'] = lambda x: sum(parse_number(v) for v in x)
        if 'revenue_payme' in df.columns: agg_dict['revenue_payme'] = lambda x: sum(parse_number(v) for v in x)
        if 'Installs appsflyer' in df.columns: agg_dict['Installs appsflyer'] = lambda x: sum(parse_number(v) for v in x)
        if 'Unique users ltv days cumulative appsflyer af_card_add_fin' in df.columns: agg_dict['Unique users ltv days cumulative appsflyer af_card_add_fin'] = lambda x: sum(parse_number(v) for v in x)
        if 'Unique users ltv days cumulative appsflyer af_s2s_subscription_activated' in df.columns: agg_dict['Unique users ltv days cumulative appsflyer af_s2s_subscription_activated'] = lambda x: sum(parse_number(v) for v in x)
        
        daily_groups = df.groupby('Date').agg(agg_dict).reset_index()
        
        daily_groups = daily_groups.sort_values('Date')
        
        chart_data = []
        cumulative_cost = 0
        cumulative_revenue = 0
        
        for _, row in daily_groups.iterrows():
            cost = row.get('Cost', 0)
            revenue = row.get('revenue_payme', 0)
            cumulative_cost += cost
            cumulative_revenue += revenue
            
            chart_data.append({
                "date": row['Date'].strftime('%Y-%m-%d'),
                "dailyCost": cost,
                "dailyRevenue": revenue,
                "dailyInstalls": row.get('Installs appsflyer', 0),
                "dailyCards": row.get('Unique users ltv days cumulative appsflyer af_card_add_fin', 0),
                "dailySubs": row.get('Unique users ltv days cumulative appsflyer af_s2s_subscription_activated', 0),
                "cumulativeCost": cumulative_cost,
                "cumulativeRevenue": cumulative_revenue,
                "netProfit": cumulative_revenue - cumulative_cost
            })
            
        # --- 2. Cohort Data (ISO Weeks) ---
        week_map = {}
        
        for _, row in df.iterrows():
            date_val = row['Date']
            cost = parse_number(row.get('Cost', 0))
            
            week_info = get_iso_week_info(str(date_val))
            week_key = f"week{week_info['weekNum']}"
            
            if week_key not in week_map:
                week_map[week_key] = {
                    "label": week_info['label'],
                    "cost": 0,
                    "revenueByDay": [0] * 31
                }
            
            week_data = week_map[week_key]
            week_data['cost'] += cost
            
            # Calculate Business Revenue for each day 0-30
            for i in range(31):
                # Find columns matching pattern
                transfer_cols = [c for c in df.columns if f"Revenue {i} days" in c and "af_transfer_completed" in c]
                purchase_cols = [c for c in df.columns if f"Revenue {i} days" in c and "af_purchase" in c]
                
                transfer_rev = parse_number(row[transfer_cols[0]]) if transfer_cols else 0
                purchase_rev = parse_number(row[purchase_cols[0]]) if purchase_cols else 0
                
                biz_rev = (transfer_rev * 0.007) + (purchase_rev * 0.00635)
                week_data['revenueByDay'][i] += biz_rev
                
        # Format Cohort Data
        sorted_week_keys = sorted(week_map.keys())
        week_labels = [week_map[k]['label'] for k in sorted_week_keys]
        
        cohort_data = []
        for i in range(31):
            point = {"day": i}
            for key in sorted_week_keys:
                week_data = week_map[key]
                if week_data['cost'] > 0:
                    point[week_data['label']] = (week_data['revenueByDay'][i] / week_data['cost']) * 100
                else:
                    point[week_data['label']] = None
            cohort_data.append(point)
            
        # Date Range
        min_date = df['Date'].min().strftime('%Y-%m-%d')
        max_date = df['Date'].max().strftime('%Y-%m-%d')
        date_range = f"{min_date} to {max_date}"
        
        return {
            "chartData": chart_data,
            "cohortData": cohort_data,
            "weekLabels": week_labels,
            "dateRange": date_range,
            "rawData": df.fillna('').to_dict('records') # Return raw data for client-side filtering if needed
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
