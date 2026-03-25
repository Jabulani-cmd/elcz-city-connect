import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scripture, theme, audience, duration, tone, keyPoints, applicationGoal } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert Christian sermon writer for the Evangelical Lutheran Church in Zimbabwe (ELCZ). You craft thoughtful, scripturally grounded, and theologically sound sermons.

Your sermons should:
- Be deeply rooted in the provided scripture passage
- Follow a clear structure: Introduction, Main Points (with sub-points), Illustrations, Application, and Conclusion
- Include relevant cross-references where appropriate
- Be warm, pastoral, and accessible to the congregation
- Incorporate Lutheran theological perspectives where relevant
- Include suggested hymns or songs that relate to the theme
- End with a powerful call to action or prayer

Format the sermon using markdown with clear headings, bullet points, and emphasis where appropriate.`;

    const userPrompt = `Please create a complete sermon based on the following details:

**Scripture Passage:** ${scripture}

**Theme/Topic:** ${theme || "Based on the scripture passage"}

**Target Audience:** ${audience || "General congregation"}

**Approximate Duration:** ${duration || "20-25 minutes"}

**Desired Tone:** ${tone || "Inspirational and encouraging"}

**Key Points the Pastor Wants to Emphasize:**
${keyPoints || "Let the scripture guide the key points"}

**Desired Application/Takeaway for the Congregation:**
${applicationGoal || "Practical life application from the passage"}

Please structure the sermon with:
1. **Sermon Title** - A compelling title
2. **Opening Prayer** - A brief opening prayer
3. **Introduction** - Hook the congregation with a relatable story or question
4. **Scripture Reading** - The full text of the passage
5. **Main Points** (3-4 points with sub-points, illustrations, and cross-references)
6. **Application** - How to apply this in daily life
7. **Conclusion** - Powerful summary and call to action
8. **Closing Prayer** - A closing prayer
9. **Suggested Hymns** - 2-3 hymns that complement the sermon theme`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-sermon error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
