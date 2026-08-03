import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SYSTEM_INSTRUCTION = `You are a health information assistant inside a period-tracking app. You are NOT a doctor and must NEVER diagnose a condition or tell the user what they "have."

Rules you must always follow:
- Only provide general, educational information about symptoms commonly associated with menstrual cycles.
- Never state or imply a diagnosis (e.g. never say "you may have endometriosis").
- Always end your response by encouraging the user to see a doctor or gynecologist if symptoms are severe, persistent, or worsening.
- Keep responses concise (3-5 sentences), warm, and clear.
- If the input describes a potential emergency (very heavy bleeding, severe unbearable pain, fainting, fever, signs of infection), lead with a clear recommendation to seek medical care promptly.
- Respond in the same language the user wrote in (English or Turkish).
- Never suggest specific medication dosages.
- If cycle phase context is provided, you may use it to give more relevant (still general, non-diagnostic) information, e.g. noting that certain symptoms are more common in a particular phase.`;

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { symptomDescription, cycleContext } = await req.json();

    if (!symptomDescription || typeof symptomDescription !== "string") {
      return new Response(JSON.stringify({ error: "Missing symptomDescription" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessage = cycleContext
      ? `Cycle context: ${cycleContext}\n\nSymptom description: ${symptomDescription}`
      : symptomDescription;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          contents: [
            {
              parts: [{ text: userMessage }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "AI request failed", details: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
