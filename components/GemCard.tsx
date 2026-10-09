"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { Gem } from "../lib/types";

export function GemCard({ gem }: { gem: Gem }) {
  // Start with the fallback or existing URL
  const [displayImage, setDisplayImage] = useState(
    gem.imageURL ||
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=1000&auto=format&fit=crop"
  );

  useEffect(() => {
    // If the database didn't provide an image URL, ask your new API for one!
    if (!gem.imageURL) {
      let isMounted = true;
      const fetchUniqueImage = async () => {
        try {
          const res = await fetch(
            `/api/image?q=${encodeURIComponent(gem.name + " " + gem.location + " landscape")}`
          );
          const data = await res.json();
          if (isMounted && data.url) {
            setDisplayImage(data.url);
          }
        } catch (error) {
          console.error("Failed to load unique image for card:", error);
        }
      };

      fetchUniqueImage();
      return () => { isMounted = false; };
    }
  }, [gem.name, gem.location, gem.imageURL]);

  return (
    <Link
      href={`/gems/${gem.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-md transition hover:border-slate-700 hover:shadow-xl"
    >
      <div className="relative h-52 w-full overflow-hidden bg-slate-800">
        <Image
          src={displayImage}
          alt={gem.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
          {gem.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-emerald-400/90">{gem.location}</p>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-300">
          {gem.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {gem.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}