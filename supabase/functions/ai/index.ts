import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, userId, userLanguage } =
      await req.json();

    // Simple validation
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({
          error: "Message is required and must be a non-empty string",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if GEMINI_API_KEY is available
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "AI service not configured",
          debug: "GEMINI_API_KEY not found in environment",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Simple system prompt
    const systemPrompt = `You are MindCompanion, a compassionate AI mental health support assistant for students. 
    
Provide empathetic, supportive responses while maintaining professional boundaries. Never diagnose or replace professional care. 
If someone mentions self-harm or crisis, encourage them to contact emergency services or mental health professionals.

Keep responses warm, helpful, and focused on student mental health support.`;

    // Prepare conversation context
    let conversationContext = "";
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationContext = conversationHistory
        .slice(-4) // Last 4 messages for context
        .filter((msg) => msg && msg.role && msg.content)
        .map(
          (msg) =>
            `${msg.role === "user" ? "Student" : "MindCompanion"}: ${
              msg.content
            }`
        )
        .join("\n");
    }

    const fullPrompt = `${systemPrompt}

${conversationContext ? `CONVERSATION CONTEXT:\n${conversationContext}\n` : ""}

CURRENT MESSAGE:
Student: ${message}

Please respond as MindCompanion with empathy and support.`;

    // Generate AI response
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const aiResponseText = response.text();

    // Simple crisis detection
    const crisisKeywords = [
      "suicide",
      "kill myself",
      "end my life",
      "self-harm",
      "hurt myself",
    ];
    const lowerMessage = message.toLowerCase();
    const crisisDetected = crisisKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    const finalResponse = {
      response: aiResponseText,
      crisisDetected,
      crisisLevel: crisisDetected ? "high" : null,
      triggers: crisisDetected ? ["crisis_keywords"] : [],
      responseId: `ai-${Date.now()}`,
      metadata: {
        model: "gemini-pro",
        language: userLanguage || "en",
        userId: userId || "anonymous",
      },
    };

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in AI function:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate AI response",
        details: error.message,
        type: error.constructor.name,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
