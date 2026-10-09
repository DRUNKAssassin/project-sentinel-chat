import type { Gem, ChatMessage } from "./types";

const MODEL = "gemini-3.5-flash-lite";

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

/**
 * Trip Planner agent: queries the live gems database and suggests complementary
 * destinations nearby or with matching tags.
 */
export async function planTripWithGemini(
  query: string,
  history: ChatMessage[],
  gems: Gem[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "Error: GEMINI_API_KEY is not configured in the server environment.";
  }

  const compactGems = gems.map((gem) => ({
    name: gem.name,
    location: gem.location,
    description: gem.description,
    tags: gem.tags,
    placesToStay: gem.details.placesToStay,
    food: gem.details.food,
    mustVisit: gem.details.mustVisit.map((m) => m.name),
  }));

  const systemInstruction = `You are the Project Sentinel AI Trip Planner for Jammu & Kashmir.
You have access to the following verified Hidden Gems database:
${JSON.stringify(compactGems)}

Rules:
1. Answer the user's questions accurately using only the facts from the database whenever possible.
2. TRIP PLANNER RECOMMENDATION RULE: Whenever a user mentions or asks about visiting a specific location, provide the requested details AND proactively recommend 1 or 2 complementary places from the database that pair well on the same trip (based on geographic proximity or travel style/tags). Clearly explain why they should bundle them together.
3. Keep the tone helpful, knowledgeable, and concise. Format with markdown bullet points and bold text where relevant.`;

  const conversationContents = [
    { role: "user", parts: [{ text: systemInstruction }] },
    { role: "model", parts: [{ text: "Understood. I am ready to act as the Project Sentinel Trip Planner." }] },
    ...history.slice(-6).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })),
    { role: "user", parts: [{ text: query }] },
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: conversationContents,
          generationConfig: {
            temperature: 0.4,
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("[lib/gemini] API error:", res.status, await res.text());
      return "The Sentinel trip planner service is currently unavailable. Please try again shortly.";
    }

    const data = (await res.json()) as GeminiResponse;
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I couldn't generate a trip plan for that query. Please try asking about a specific place or region."
    );
  } catch (error) {
    console.error("[lib/gemini] Request failed:", error);
    return "Network error while connecting to the trip planner service.";
  }
}

/**
 * Keyword/slug matching search handler from original build.
 */
export async function searchGemsWithGemini(
  query: string,
  gems: Gem[]
): Promise<string[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const compactGems = gems.map((gem) => ({
    slug: gem.slug,
    name: gem.name,
    tags: gem.tags,
    blurb: gem.description.slice(0, 150),
  }));

  const prompt = `You are matching a travel search query against a list of hidden-gem travel destinations in Kashmir, India.

Given the user's query and the destinations below, return the slugs of destinations that genuinely match the query's intent (mood, activity, duration, difficulty, etc.) — ordered from best match to worst. Only include real matches; if nothing matches well, return an empty array. Never invent a slug that isn't in the list.

Query: "${query}"

Destinations:
${JSON.stringify(compactGems)}

Respond with JSON only, in exactly this shape: {"slugs": ["slug-a", "slug-b"]}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
          },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text) as { slugs?: unknown };
    if (!Array.isArray(parsed.slugs)) return null;

    const validSlugs = new Set(gems.map((gem) => gem.slug));
    return parsed.slugs.filter(
      (slug): slug is string => typeof slug === "string" && validSlugs.has(slug)
    );
  } catch (error) {
    console.error("[lib/gemini] Falling back to local search:", error);
    return null;
  }
}