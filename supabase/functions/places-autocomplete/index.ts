import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { input, action, placeId, locationBias, includedPrimaryTypes } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "details") {
      if (!placeId) {
        return new Response(JSON.stringify({ error: "Missing placeId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?fields=formattedAddress,displayName,location,primaryType,types`,
        {
          headers: { "X-Goog-Api-Key": apiKey },
        }
      );
      const data = await response.json();

      return new Response(
        JSON.stringify({
          name: data.displayName?.text || "",
          address: data.formattedAddress || "",
          location: data.location || null,
          primaryType: data.primaryType || null,
          types: data.types || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!input || input.length < 2) {
      return new Response(JSON.stringify({ predictions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Record<string, unknown> = {
      input,
      includedPrimaryTypes: includedPrimaryTypes || ["hospital", "doctor", "health"],
    };

    if (locationBias?.lat && locationBias?.lng) {
      body.locationBias = {
        circle: {
          center: { latitude: locationBias.lat, longitude: locationBias.lng },
          radius: 15000,
        },
      };
    }

    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    const predictions = (data.suggestions || [])
      .map((s: any) => s.placePrediction)
      .filter(Boolean)
      .map((p: any) => ({
        placeId: p.placeId,
        text: p.text?.text || "",
      }));

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
