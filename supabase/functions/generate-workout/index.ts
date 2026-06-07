// @ts-ignore
import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

export default {
  async fetch(req: Request) {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      const { profile } = await req.json()

      // @ts-ignore
      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

      if (!GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY environment variable on server.")
      }

      const prompt = `
        You are an elite personal trainer. Create a customized weekly workout split based on these parameters:
        - Gender: ${profile.gender}, Height: ${profile.height_cm}cm, Weight: ${profile.weight_kg}kg
        - Sessions per Week: ${profile.gym_frequency}, Session Length: ${profile.time_per_session} mins
        - Experience: ${profile.gym_exp || 'Not specified'}, Goals/Notes: ${profile.add_info || 'None'}

        CRITICAL: Return ONLY a valid JSON array matching this exact schema:
        [
          {
            "day": "Monday: Push Day",
            "exercises": [
              { "name": "Bench Press", "sets": 4, "reps": "8-10", "notes": "Warm up sets first" }
            ]
          }
        ]
      `

      //server to server
      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: "application/json"
            }
          })
        }
      )

      const result = await googleResponse.json()
      
      if (!googleResponse.ok) {
        throw new Error(result?.error?.message || "Gemini failure")
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
}