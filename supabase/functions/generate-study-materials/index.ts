import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, type, noteId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    if (type === "flashcards") {
      systemPrompt = "You are a study assistant. Generate flashcards from the provided content. Create 5-10 high-quality question-answer pairs that cover the key concepts.";
      tools = [{
        type: "function",
        function: {
          name: "generate_flashcards",
          description: "Generate flashcards from study content",
          parameters: {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string", description: "The flashcard question" },
                    answer: { type: "string", description: "The flashcard answer" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                  },
                  required: ["question", "answer", "difficulty"],
                  additionalProperties: false
                }
              }
            },
            required: ["flashcards"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "generate_flashcards" } };
    } else if (type === "quiz") {
      systemPrompt = "You are a study assistant. Generate a multiple-choice quiz from the provided content. Create 5-8 questions with 4 options each.";
      tools = [{
        type: "function",
        function: {
          name: "generate_quiz",
          description: "Generate quiz questions from study content",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    option_a: { type: "string" },
                    option_b: { type: "string" },
                    option_c: { type: "string" },
                    option_d: { type: "string" },
                    correct_answer: { type: "string", enum: ["A", "B", "C", "D"] }
                  },
                  required: ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer"],
                  additionalProperties: false
                }
              }
            },
            required: ["questions"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "generate_quiz" } };
    } else if (type === "summary") {
      systemPrompt = "You are a study assistant. Create a clear, concise summary of the key concepts from the provided content. Use bullet points and organize by topic.";
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the study material:\n\n${content}` }
      ],
    };

    if (tools.length > 0) {
      body.tools = tools;
      body.tool_choice = toolChoice;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();

    let result: any;
    if (tools.length > 0) {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        result = JSON.parse(toolCall.function.arguments);
      }
    } else {
      result = { summary: data.choices?.[0]?.message?.content };
    }

    return new Response(JSON.stringify({ result, noteId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
