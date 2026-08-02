import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

async function generateAIResponse(messages: ChatMessage[]): Promise<string> {
  const systemPrompt = `You are a helpful AI coding assistant. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice  
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers. Use proper code formatting when showing examples.`;

  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // fast, free, strong for coding tasks
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI model");
    }

    return content.trim();
  } catch (error) {
    console.error("AI generation error:", error);
    throw new Error("Failed to generate AI response");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    const validHistory = Array.isArray(history)
      ? history.filter(
          (msg) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.role === "string" &&
            typeof msg.content === "string" &&
            ["user", "assistant"].includes(msg.role),
        )
      : [];

    const recentHistory = validHistory.slice(-10);

    const messages: ChatMessage[] = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    const aiResponse = await generateAIResponse(messages);

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
