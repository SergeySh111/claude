import { CohortDataPoint, ProcessedCampaign } from "./data-processor";
import { prepareAnalysisPayload } from "./benchmark-calculator";

export interface AIAnalysisResult {
  analysis: string;
  error?: string;
}

/**
 * Filter out lines mentioning weeks not in the valid list
 */
function filterHallucinatedWeeks(analysis: string, validWeeks: string[]): string {
  const lines = analysis.split('\n');
  const filteredLines: string[] = [];

  // Create regex pattern to match week mentions (e.g., "Week 29", "Week 30")
  const weekPattern = /Week\s+(\d+)/gi;

  lines.forEach((line) => {
    let isValid = true;
    const matches = Array.from(line.matchAll(weekPattern));

    for (const match of matches) {
      const weekMention = `Week ${match[1]}`;
      if (!validWeeks.includes(weekMention)) {
        // This line contains an invalid week reference
        isValid = false;
        console.warn(`Filtered hallucinated week: ${weekMention} in line: ${line}`);
        break;
      }
    }

    if (isValid) {
      filteredLines.push(line);
    }
  });

  return filteredLines.join('\n');
}

export async function analyzeWithAI(
  campaigns: ProcessedCampaign[],
  cohortData: CohortDataPoint[],
  weekLabels: string[],
  dailyData: any[],
  apiKey: string
): Promise<AIAnalysisResult> {
  try {
    if (campaigns.length === 0) {
      throw new Error("No campaign data available for analysis");
    }

    // Prepare structured payload with benchmarks and date context
    const payload = prepareAnalysisPayload(campaigns, cohortData, weekLabels, dailyData);

    const systemPrompt = `You are a Strict Data Auditor for a Marketing Report.

**CONTEXT BOUNDARIES (CRITICAL):**
* The report covers ONLY the period: **${payload.meta.reportPeriod}**.
* The valid weeks are ONLY: **${payload.meta.validWeeks.join(', ')}**.
* **DO NOT** mention any weeks outside this list (e.g., Week 29, 30, 31 are HALLUCINATIONS and STRICTLY FORBIDDEN).
* Do not confuse 'Days since install' (Day 0, Day 30) with 'Calendar Weeks'.
* Calendar weeks refer to ISO week numbers within the report period.

**Rules:**
1. Use **ONLY** the provided JSON data. Do NOT invent numbers or scenarios.
2. Be concise. Use bullet points. No fluff.
3. Focus on **Deviations**: Highlight campaigns significantly above or below the Global Benchmark.
4. All numbers you mention MUST match the provided data exactly.
5. When mentioning weeks, use ONLY the valid weeks from the list above.

**Output Format:**

**🟢 SCALE (Best Performers)**
* [Campaign Name]: ROAS [X]% vs Avg [Y]%. Profit: $[Z]. Why: [Specific reason based on metrics].

**🔴 STOP/FIX (Bleeding Budget)**
* [Campaign Name]: Spend $[X], Profit -$[Y]. ROAS [Z]% vs Avg [A]%. Why: [Specific reason].

**⚠️ ANOMALIES (Needs Attention)**
* Mention only factual deviations inside the valid weeks.
* Weekly Trend: [Describe trend using ONLY valid weeks, e.g., "Week 46 dropped by 15% compared to Week 45"].
* [Specific Campaign]: [Describe anomaly, e.g., "CPI is 2x higher than average"].`;

    const userPrompt = `Analyze this campaign performance data:

**REPORT CONTEXT:**
- Period: ${payload.meta.reportPeriod}
- Valid Weeks: ${payload.meta.validWeeks.join(', ')}

**BENCHMARKS:**
- Global Average ROAS: ${payload.benchmarks.globalAverageROAS.toFixed(1)}%
- Global Average CPI: $${payload.benchmarks.globalAverageCPI.toFixed(2)}
- Weekly Trend: ${payload.benchmarks.weeklyTrend.map(w => `${w.week}: ${w.roas.toFixed(1)}%`).join(', ')}

**TOP 3 PERFORMERS (by Profit):**
${payload.topPerformers.map((p, i) => `${i + 1}. ${p.name}
   - ROAS: ${p.roas.toFixed(1)}%
   - Spend: $${p.spend.toLocaleString()}
   - Profit: $${p.profit.toLocaleString()}`).join('\n')}

**BOTTOM 3 PERFORMERS (by Profit):**
${payload.underperformers.map((p, i) => `${i + 1}. ${p.name}
   - ROAS: ${p.roas.toFixed(1)}%
   - Spend: $${p.spend.toLocaleString()}
   - Profit: $${p.profit.toLocaleString()}`).join('\n')}

**OUTLIERS (>20% deviation from average):**
${payload.outliers.length > 0 
  ? payload.outliers.map((o, i) => `${i + 1}. ${o.name}
   - ROAS: ${o.roas.toFixed(1)}% (${o.reason})`).join('\n')
  : 'None detected'}

Provide your analysis following the exact format specified in the system prompt.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenAI API key in Settings.");
      }
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }

      throw new Error(
        errorData.error?.message || `OpenAI API error: ${response.statusText}`
      );
    }

    const data = await response.json();
    let analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error("No analysis received from AI");
    }

    // Filter out hallucinated weeks
    analysis = filterHallucinatedWeeks(analysis, payload.meta.validWeeks);

    return { analysis };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      analysis: "",
      error: error instanceof Error ? error.message : "Failed to analyze data with AI",
    };
  }
}
