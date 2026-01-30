/**
 * AI Chat Service for conversational analysis
 * Uses pre-calculated human-readable summary instead of JSON
 */

/**
 * Send a chat message to OpenAI with pre-calculated context
 */
export async function sendChatMessage(
  summaryText: string,
  apiKey: string,
  userQuestion: string
): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    // Check if we have no data
    if (summaryText.startsWith("NO DATA FOUND")) {
      return summaryText; // Return the "no data" message directly
    }

    const systemPrompt = `You are a Head of User Acquisition with deep expertise in performance marketing and cohort analysis.

**YOUR GOAL:** Provide succinct, strategic insights based on pre-calculated data. Be analytical, professional, and concise.

**RESPONSE STRUCTURE (when providing executive summaries):**

🌍 **Seasonal Impact:** How is the current season (e.g., Black Friday, Post-Holiday Slump) affecting our metrics compared to normal? Reference the SEASONALITY CONTEXT section.

🏆 **Product Battle:** Which product is carrying the budget? Which one is underperforming? Use the PRODUCT WINNERS section to identify leaders by ROAS and volume.

📉 **Cohort Health:** Are newer weeks getting better or worse? Use the COHORT VELOCITY section to identify improving or weakening starts. Mention specific Week X trends.

🚨 **Anomalies:** Point out any specific week/campaign that breaks the pattern. Look for 📉 Underperforming, 🚀 Outperforming, or ⚠️ Retention Issue flags in WEEKLY COHORT ANALYSIS.

**CRITICAL RULES:**
1. Use ONLY the data provided in the summary below
2. Do NOT calculate totals yourself - trust the provided numbers
3. When mentioning weeks, use ONLY the weeks listed in the data
4. Do not confuse 'Days since install' (Day 0, Day 7) with 'Calendar Weeks'
5. If the summary shows "NO DATA FOUND", tell the user to adjust their filters
6. Focus on actionable insights and strategic recommendations
7. If asked about data not in the summary, respond "Data not available for current filters"
8. Keep responses concise - aim for clarity over length

**DATA SUMMARY:**
${summaryText}

Answer the user's question based on this context. If they ask for a general analysis, use the response structure above.`;

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
          { role: "user", content: userQuestion },
        ],
        temperature: 0.5,
        max_tokens: 800,
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
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("No response received from AI");
    }

    return answer;
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
}
