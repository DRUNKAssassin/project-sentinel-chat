"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface ItinerarySlide {
  day: number;
  title: string;
  description: string;
  image_keywords?: string;
  activities?: string[];
}

interface ChatItem {
  role: "user" | "assistant";
  content: string;
  slides?: ItinerarySlide[] | null;
}

function DynamicSlideImage({
  keywords,
  alt,
  className,
}: {
  keywords: string;
  alt: string;
  className: string;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fallbackUrl =
    "https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200&auto=format&fit=crop";

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      try {
        const queryText = keywords || alt || "Kashmir mountains";
        const res = await fetch(
          `/api/image?q=${encodeURIComponent(queryText + " landscape")}`
        );
        const data = await res.json();
        if (isMounted) {
          setImgUrl(data.url || fallbackUrl);
        }
      } catch (e) {
        console.error("Failed to load slide image:", e);
        if (isMounted) setImgUrl(fallbackUrl);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchImage();
    return () => {
      isMounted = false;
    };
  }, [keywords, alt]);

  if (loading || !imgUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-800 animate-pulse ${className}`}
      >
        <span className="text-slate-500 text-xs tracking-widest uppercase font-semibold">
          Finding photo...
        </span>
      </div>
    );
  }

  return (
    <img
      src={imgUrl}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallbackUrl;
      }}
    />
  );
}

export default function SentinelChat() {
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your Sentinel AI Trip Concierge. Where in Jammu & Kashmir are you planning to visit? Tell me your vibe, travel pace, or destination, and I'll tailor a plan featuring verified offbeat gems.",
      slides: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<{ [msgIdx: number]: number }>({});
  const [viewMode, setViewMode] = useState<{ [msgIdx: number]: "slides" | "text" }>({});

  const [expandedView, setExpandedView] = useState<{
    msgIdx: number;
    slideIndex: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleModalPrev = useCallback(() => {
    if (!expandedView) return;
    const newIdx = Math.max(0, expandedView.slideIndex - 1);
    setExpandedView((prev) => (prev ? { ...prev, slideIndex: newIdx } : null));
    setActiveSlideIndex((prev) => ({ ...prev, [expandedView.msgIdx]: newIdx }));
  }, [expandedView]);

  const handleModalNext = useCallback(() => {
    if (!expandedView) return;
    const currentMsg = messages[expandedView.msgIdx];
    const totalSlides = currentMsg?.slides?.length || 0;
    const newIdx = Math.min(totalSlides - 1, expandedView.slideIndex + 1);
    setExpandedView((prev) => (prev ? { ...prev, slideIndex: newIdx } : null));
    setActiveSlideIndex((prev) => ({ ...prev, [expandedView.msgIdx]: newIdx }));
  }, [expandedView, messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!expandedView) return;
      if (e.key === "ArrowLeft") handleModalPrev();
      if (e.key === "ArrowRight") handleModalNext();
      if (e.key === "Escape") setExpandedView(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedView, handleModalPrev, handleModalNext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    const userMessage: ChatItem = { role: "user", content: userQuery };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");

      const replyData = data.reply;
      const newIndex = messages.length + 1;

      if (replyData && typeof replyData === "object") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: replyData.conversational_reply || "",
            slides: replyData.itinerary_slides || null,
          },
        ]);
        if (replyData.itinerary_slides && replyData.itinerary_slides.length > 0) {
          setViewMode((prev) => ({ ...prev, [newIndex]: "slides" }));
          setActiveSlideIndex((prev) => ({ ...prev, [newIndex]: 0 }));
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: String(replyData || ""), slides: null },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "An error occurred while connecting to the verified database. Please try again.",
          slides: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {messages.length <= 1 && (
        <div className="text-center flex flex-col items-center gap-3 shrink-0 pb-6 animate-in fade-in duration-500">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Project Sentinel
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-3xl text-center leading-relaxed">
            Autonomous J&amp;K geospatial travel planner. Inquire about any destination or vibe to receive verified itineraries and complementary route pairings.
          </p>
        </div>
      )}

      <div className="flex flex-col w-full flex-1 min-h-0 relative">
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {messages.map((msg, idx) => {
            const hasSlides = msg.slides && msg.slides.length > 0;
            const currentMode = viewMode[idx] || (hasSlides ? "slides" : "text");
            const currentSlide = activeSlideIndex[idx] || 0;

            return (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`w-full max-w-[95%] sm:max-w-[88%] rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-sm self-end max-w-fit"
                      : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-sm shadow-xl"
                  }`}
                >
                  {hasSlides && (
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Interactive Deck</span>
                      </div>
                      <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setViewMode((prev) => ({ ...prev, [idx]: "slides" }))}
                          className={`px-3 py-1 rounded-md transition-colors ${
                            currentMode === "slides" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Visual Slides
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode((prev) => ({ ...prev, [idx]: "text" }))}
                          className={`px-3 py-1 rounded-md transition-colors ${
                            currentMode === "text" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Full Itinerary
                        </button>
                      </div>
                    </div>
                  )}

                  {hasSlides && currentMode === "slides" ? (
                    <div className="flex flex-col gap-4">
                      {/* Personalized AI note rendered above the deck */}
                      {msg.content && (
                        <div className="text-slate-200 text-sm sm:text-base leading-relaxed bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 sm:p-4">
                          {msg.content}
                        </div>
                      )}

                      {(() => {
                        const slide = msg.slides![currentSlide];
                        const mapsQuery = encodeURIComponent(`${slide.title} Jammu Kashmir`);

                        return (
                          <div className="overflow-hidden rounded-xl bg-slate-950 border border-slate-800 group relative">
                            <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-slate-900">
                              <DynamicSlideImage 
                                keywords={slide.image_keywords || slide.title} 
                                alt={slide.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                              <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-sm text-slate-950 font-extrabold px-3 py-1 rounded-md text-xs tracking-wider uppercase">
                                Day {slide.day}
                              </div>
                              <div className="absolute top-3 right-3 flex gap-2">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-slate-900/80 hover:bg-slate-900 text-emerald-400 border border-slate-700/80 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                                >
                                  Maps ↗
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setExpandedView({ msgIdx: idx, slideIndex: currentSlide })}
                                  className="bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                                >
                                  ⛶ Expand
                                </button>
                              </div>
                            </div>
                            <div className="p-4 sm:p-5 flex flex-col gap-3">
                              <h4 className="text-lg sm:text-xl font-bold text-white">{slide.title}</h4>
                              <p className="text-slate-300 text-sm leading-relaxed">{slide.description}</p>
                              {slide.activities && slide.activities.length > 0 && (
                                <div className="mt-1">
                                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Highlights & Stops:</span>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {slide.activities.map((act, actIdx) => (
                                      <span key={actIdx} className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300">
                                        • {act}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          disabled={currentSlide === 0}
                          onClick={() => setActiveSlideIndex((prev) => ({ ...prev, [idx]: Math.max(0, currentSlide - 1) }))}
                          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          ← Prev Day
                        </button>
                        <div className="flex items-center gap-1.5">
                          {msg.slides!.map((_, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => setActiveSlideIndex((prev) => ({ ...prev, [idx]: sIdx }))}
                              className={`h-2 rounded-full transition-all ${currentSlide === sIdx ? "w-6 bg-emerald-400" : "w-2 bg-slate-700 hover:bg-slate-500"}`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={currentSlide === msg.slides!.length - 1}
                          onClick={() => setActiveSlideIndex((prev) => ({ ...prev, [idx]: Math.min(msg.slides!.length - 1, currentSlide + 1) }))}
                          className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Next Day →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
                        {msg.content}
                      </div>

                      {hasSlides && (
                        <div className="flex flex-col gap-6 mt-2 pt-6 border-t border-slate-800">
                          {msg.slides!.map((slide, sIdx) => (
                            <div key={sIdx} className="flex flex-col gap-2.5">
                              <h4 className="text-emerald-400 font-extrabold text-lg">
                                Day {slide.day}: {slide.title}
                              </h4>
                              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                {slide.description}
                              </p>
                              {slide.activities && slide.activities.length > 0 && (
                                <ul className="space-y-1.5 mt-1.5">
                                  {slide.activities.map((act, actIdx) => (
                                    <li key={actIdx} className="flex items-start gap-3">
                                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
                                      <span className="text-slate-300 text-sm sm:text-base">{act}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm p-4 bg-slate-800 border border-slate-700 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="shrink-0 py-4 px-2 sm:px-4 flex gap-3 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a destination or vibe (e.g. 'A quiet 4-day trip to unwind in nature')"
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-slate-500 shadow-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-4 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Send
          </button>
        </form>
      </div>

      {expandedView && (() => {
        const currentMsg = messages[expandedView.msgIdx];
        const slides = currentMsg?.slides || [];
        const slide = slides[expandedView.slideIndex];
        if (!slide) return null;

        const mapsQuery = encodeURIComponent(`${slide.title} Jammu Kashmir`);

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 pt-20 sm:p-8 sm:pt-24">
            <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[75vh] max-h-[700px] animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setExpandedView(null)}
                className="absolute top-4 right-4 z-30 bg-slate-950/80 hover:bg-slate-950 text-white rounded-full p-2.5 transition-colors border border-slate-700 shadow-lg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="w-full md:w-1/2 h-[40%] md:h-full relative bg-black shrink-0">
                <DynamicSlideImage 
                  keywords={slide.image_keywords || slide.title} 
                  alt={slide.title} 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 md:bg-gradient-to-r md:from-transparent md:to-slate-900/60" />

                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-emerald-500 text-slate-950 font-extrabold px-3 py-1 rounded-md text-xs tracking-wider uppercase shadow">
                    Day {slide.day} of {slides.length}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900/80 hover:bg-slate-900 text-emerald-400 border border-slate-700/80 px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 shadow"
                  >
                    Open in Maps ↗
                  </a>
                </div>
              </div>

              <div className="w-full md:w-1/2 h-[60%] md:h-full p-6 flex flex-col justify-between bg-slate-900 overflow-hidden">
                <div className="overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-slate-700">
                  <div>
                    <span className="text-emerald-400 font-bold tracking-widest uppercase text-xs">Daily Focus</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mt-1">{slide.title}</h2>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4 py-1">{slide.description}</p>
                  {slide.activities && slide.activities.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Stops & Activities</h3>
                      <ul className="space-y-2">
                        {slide.activities.map((act, actIdx) => (
                          <li key={actIdx} className="flex items-start gap-2.5">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-slate-200 text-sm leading-relaxed">{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    disabled={expandedView.slideIndex === 0}
                    onClick={handleModalPrev}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Prev
                  </button>
                  <div className="flex items-center gap-1.5">
                    {slides.map((_, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          setExpandedView((prev) => (prev ? { ...prev, slideIndex: sIdx } : null));
                          setActiveSlideIndex((prev) => ({ ...prev, [expandedView.msgIdx]: sIdx }));
                        }}
                        className={`h-2 rounded-full transition-all ${expandedView.slideIndex === sIdx ? "w-5 bg-emerald-400" : "w-2 bg-slate-700 hover:bg-slate-500"}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={expandedView.slideIndex === slides.length - 1}
                    onClick={handleModalNext}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}