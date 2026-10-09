export interface Gem {
  name: string;
  location: string;
  description: string;
  imageURL?: string;
  tags: string[];
  slug: string;
  details: {
    placesToStay: string[];
    food: string[];
    mustVisit: { name: string; description: string }[];
  };
}

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}