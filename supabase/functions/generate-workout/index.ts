// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

// List of candidate models to attempt in order of preference
const MODEL_CANDIDATES = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
]

async function callGeminiWithRetry(prompt: string, apiKey: string) {
  for (const model of MODEL_CANDIDATES) {
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      attempts++
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

        const result = await response.json()

        if (response.ok) {
          return result
        }

        const isCapacityError = response.status === 503 || response.status === 429 || 
                                result?.error?.message?.includes("high demand")

        if (isCapacityError && attempts < maxAttempts) {
          await new Promise((res) => setTimeout(res, attempts * 1000))
          continue
        }

        console.warn(`Model ${model} failed with status ${response.status}: ${result?.error?.message}`)
        break
      } catch (err) {
        console.error(`Error calling ${model}:`, err)
        if (attempts >= maxAttempts) break
        await new Promise((res) => setTimeout(res, attempts * 1000))
      }
    }
  }

  throw new Error("All AI models are currently at capacity. Please try again in a few moments.")
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
        - Gender: ${profile?.gender || 'Not specified'}, Height: ${profile?.height_cm || 170}cm, Weight: ${profile?.weight_kg || 70}kg
        - Sessions per Week: ${profile?.gym_frequency || 3}, Session Length: ${profile?.time_per_session || 60} mins
        - Experience: ${profile?.gym_exp || 'Not specified'}, Goals/Notes: ${profile?.add_info || 'None'}

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

      const result = await callGeminiWithRetry(prompt, GEMINI_API_KEY)

      let rawJsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!rawJsonString) {
        throw new Error("No output text returned from Gemini.")
      }

      rawJsonString = rawJsonString.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

      const parsedData = JSON.parse(rawJsonString)

      return new Response(JSON.stringify(parsedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Edge function catch triggered:", errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
}