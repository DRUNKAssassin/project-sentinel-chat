import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwNYOeXSmLCgOG4QqZvg_niNAU9TITPTZbVNRYA2uXsFzyz7BuY25BeMuvBPmF5du9o/exec";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    // 1. Fetch live offbeat gems from Google Sheets
    let sentinelDatabase: any[] = [];
    try {
      const sheetRes = await fetch(WEBHOOK_URL, { next: { revalidate: 60 } });
      if (sheetRes.ok) {
        sentinelDatabase = await sheetRes.json();
      }
    } catch (e) {
      console.error("Failed to fetch from Sheets. Proceeding without RAG context:", e);
    }

    // 2. Personalized Prompt with RAG grounding
    const systemPrompt = `
You are Project Sentinel, an empathetic and knowledgeable AI travel concierge for Jammu & Kashmir.
Below is our proprietary database of verified hidden gems extracted from regional travel vlogs:

${JSON.stringify(sentinelDatabase, null, 2)}

User Request: "${query}"

CRITICAL INSTRUCTIONS:
1. In "conversational_reply", craft a personalized, empathetic 2-3 sentence opener directly addressing the traveler's stated mood, pace, or desire (e.g., escaping crowds, quiet relaxation, adventure, offbeat discovery). Explicitly mention why the chosen destination and any bundled hidden gems from the Sentinel database match their exact intent.
2. Construct the day-by-day itinerary slides. Prioritize relevant locations from the database when appropriate, and pair them with logical routes across Jammu & Kashmir.
3. Return output strictly in the following JSON schema:

{
  "conversational_reply": "Personalized 2-3 sentence opener mirroring user mood and highlighting curated destinations.",
  "itinerary_slides": [
    {
      "day": 1,
      "title": "Name of the place",
      "description": "Comprehensive explanation of the experience and sights, incorporating specifics from the database where applicable.",
      "image_keywords": "3-word visual search phrase for Unsplash (e.g., 'serene river valley kashmir')",
      "activities": ["Activity or stop 1", "Activity or stop 2"]
    }
  ]
}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    return NextResponse.json({ reply: JSON.parse(responseText) });
  } catch (error) {
    console.error("Chat API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to generate itinerary. Please try again." },
      { status: 500 }
    );
  }
}