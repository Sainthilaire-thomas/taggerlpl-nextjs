// ============================================================================
// API Route : /api/level0/annotate
// Annotation sécurisée via OpenAI (serveur uniquement)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";

interface AnnotateRequest {
  prompt: string;
}

interface AnnotateResponse {
  content: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt }: AnnotateRequest = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt requis" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("OPENAI_API_KEY non définie dans .env.local");
      return NextResponse.json(
        { error: "Configuration serveur manquante" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es un annotateur expert en analyse conversationnelle. Tu réponds toujours en JSON valide."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return NextResponse.json({ content } as AnnotateResponse);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
