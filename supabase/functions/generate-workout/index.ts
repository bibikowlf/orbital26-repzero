// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

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
        You are a World-Class Certified Strength and Conditioning Specialist (CSCS) and Elite Personal Trainer. 
        Your objective is to design a perfectly tailored, periodized, and anatomically balanced weekly workout routine based strictly on the user's personal profile and goals.

         1. USER PROFILE & CONSTRAINTS
        - Gender: ${profile?.gender || 'Not specified'}
        - Height: ${profile?.height_cm || 170} cm
        - Weight: ${profile?.weight_kg || 70} kg
        - Birth Year: ${profile?.birth_year || 'Not specified'}
        - Weekly Frequency: ${profile?.gym_frequency || 4} days per week
        - Session Duration: ${profile?.time_per_session || 60} minutes per session
        - Training Experience: ${profile?.gym_exp || 'Beginner'}
        - Primary Goals & Special Requests: ${profile?.add_info || 'Improve general fitness'}
        OTHER IMPORTANT INFORMATION - 
        Focus Area: ${profile?.focus_area || 'Not specified'}
        Illness: ${profile?.illness || 'Not specified'}

        ---

        2. EXERCISE & PROGRAMMING RULES
        1. Split Logic:
          - Choose a split logically matching the user's weekly frequency (e.g., 2 Days = Full Body; 3 Days = Full Body or Push/Pull/Legs; 4 Days = Upper/Lower; 5-6 Days = Push/Pull/Legs/Upper/Lower or Body-Part Split).
        2. Session Structure:
          - Limit exercises to fit strictly within the requested time limit (${profile?.time_per_session || 60} mins). Typically 4 to 6 quality exercises per session.
          - Order exercises logically: Heavy compound movements FIRST (e.g., Squat, Deadlift, Bench), followed by accessory/isolation movements.
        3. Volume & Intensity:
          - Provide explicit, standard rep ranges (e.g., "6-8", "8-12", "12-15") optimized for the user's experience level and goals.
          - Assign reasonable set counts (typically 3 to 4 working sets per exercise).
        4. Actionable Notes:
          - In the "notes" field for each exercise, provide 1 concise cue on form, tempo, or rest period (e.g., "2-min rest, focus on slow eccentric phase", "Drive through heels", "Keep elbows tucked at 45 degrees").

        ---

        3. OUTPUT FORMAT CONSTRAINTS (CRITICAL)
        - You MUST return ONLY a valid JSON array matching the exact structure below.
        - Do NOT wrap the response in markdown code blocks like \`\`\`json or \`\`\`.
        - Do NOT include introductory text, conversational chatter, or concluding remarks.

        EXPECTED JSON SCHEMA:
        [
          {
            "day": "Day 1: Upper Body - Push Focus",
            "exercises": [
              {
                "name": "Barbell Bench Press",
                "sets": 4,
                "reps": "6-8",
                "notes": "Rest 2-3 mins between sets; focus on controlled eccentric."
              },
              {
                "name": "Incline Dumbbell Press",
                "sets": 3,
                "reps": "8-10",
                "notes": "30-degree incline, squeeze at peak contraction."
              }
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