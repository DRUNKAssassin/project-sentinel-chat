import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "Kashmir landscape";

  try {
    // Make sure UNSPLASH_ACCESS_KEY is in your .env file!
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!accessKey) {
      console.warn("Missing Unsplash API Key - using dynamic fallback");
      // If no key, generate a unique placeholder so they aren't all identical
      return NextResponse.json({ url: `https://picsum.photos/seed/${encodeURIComponent(query)}/800/600` });
    }

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=10`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    const data = await res.json();

    if (data.results && data.results.length > 0) {
      // THE FIX: Pick a random image from the top 10 results instead of always data.results[0]
      const randomIndex = Math.floor(Math.random() * data.results.length);
      const imageUrl = data.results[randomIndex].urls.regular;
      
      return NextResponse.json({ url: imageUrl });
    }

    // Fallback if Unsplash has no results for the specific query
    return NextResponse.json({ 
      url: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200&auto=format&fit=crop" 
    });

  } catch (error) {
    console.error("Image Fetch Error:", error);
    return NextResponse.json({ 
      url: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200&auto=format&fit=crop" 
    });
  }
}