import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SYSTEM_INSTRUCTION = `You are a health pattern assistant inside a period-tracking app. You analyze a user's last 14 days of logged data (flow intensity, symptoms, mood) and write a short, warm, non-diagnostic weekly summary.

Rules:
- Write 3-5 short bullet-point style observations about patterns you notice (e.g. "You logged headaches on 3 of the last 5 days" or "Your mood entries were mostly positive this week").
- Never diagnose. Only describe patterns in the data itself.
- If there isn't enough data, say so warmly and encourage a bit more logging, don't invent patterns.
- Keep it concise, friendly, and specific to the actual data given.
- Respond in the same language as the label passed in (English or Turkish).
- Do not use markdown formatting symbols like ** or #, just plain text with a dash "-" for each bullet.`;

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lang } = await req.json();

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sinceDate = fourteenDaysAgo.toISOString().split("T")[0];

    const [{ data: cycleEntries }, { data: symptomEntries }] = await Promise.all([
      userClient.from("cycle_entries").select("date, flow_intensity").gte("date", sinceDate).order("date"),
      userClient.from("symptom_entries").select("date, symptom_type").gte("date", sinceDate).order("date"),
    ]);

    if ((!cycleEntries || cycleEntries.length === 0) && (!symptomEntries || symptomEntries.length === 0)) {
      const notEnoughData =
        lang === "tr"
          ? "Son 14 günde yeterli veri yok. Birkaç gün daha kayıt yaparsan sana anlamlı içgörüler sunabilirim."
          : "Not enough data logged in the last 14 days. Log a bit more and I'll be able to share meaningful insights.";
      return new Response(JSON.stringify({ content: notEnoughData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataSummary = `
Flow entries (last 14 days): ${JSON.stringify(cycleEntries)}
Symptom/mood entries (last 14 days): ${JSON.stringify(symptomEntries)}
Language for response: ${lang === "tr" ? "Turkish" : "English"}
    `.trim();

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ parts: [{ text: dataSummary }] }],
        }),
      }
    );

    const aiData = await response.json();
    const content = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    await userClient.from("weekly_insights").insert({
      user_id: user.id,
      content,
    });

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
