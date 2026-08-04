import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SYSTEM_INSTRUCTION = `You are a health information assistant inside a period-tracking app, having a conversation with the user about their symptoms. You are NOT a doctor and must NEVER diagnose a condition or tell the user what they "have."

Rules you must always follow:
- Only provide general, educational information about symptoms commonly associated with menstrual cycles.
- Never state or imply a diagnosis (e.g. never say "you may have endometriosis").
- If the user's first message is vague or lacks detail (e.g. just "cramps" or "I feel bad"), ask ONE brief, relevant clarifying question before giving information (e.g. how long, how severe, any other symptoms) rather than guessing.
- Once you have enough detail, give a concise (3-5 sentence), warm, educational response, and end by encouraging a doctor visit if symptoms are severe, persistent, or worsening.
- If the input describes a potential emergency (very heavy bleeding, severe unbearable pain, fainting, fever, signs of infection), lead with a clear recommendation to seek medical care promptly instead of asking a follow-up question.
- Respond in the same language the user writes in (English or Turkish).
- Never suggest specific medication dosages.
- If cycle phase context is provided, you may use it to give more relevant (still general, non-diagnostic) information.
- Keep the conversation natural — you can ask at most one follow-up question per turn, don't interrogate.`;

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

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, cycleContext } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing messages" }), {
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

    // Build Gemini "contents" from the chat history. Prepend cycle context to the
    // very first user message only, so it's available as background without repeating it.
    const contents = messages.map((m: { role: string; text: string }, idx: number) => {
      const isFirstUserMsg = idx === 0 && m.role === "user";
      const text = isFirstUserMsg && cycleContext ? `Cycle context: ${cycleContext}\n\n${m.text}` : m.text;
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text }],
      };
    });

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
          contents,
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
