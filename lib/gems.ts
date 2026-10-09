import Papa from "papaparse";
// If types.ts is inside lib, use "./types". If in src/ or root, use "@/lib/types" or "@/types"
import type { Gem } from "./types";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GEMS_TAB = process.env.GOOGLE_SHEET_GEMS_TAB ?? "Hidden_Gems";
const MUSTVISIT_TAB = process.env.GOOGLE_SHEET_MUSTVISIT_TAB ?? "MustVisit";

function tabCsvUrl(tabName: string) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    tabName
  )}`;
}

async function fetchTab(tabName: string): Promise<Record<string, string>[]> {
  const res = await fetch(tabCsvUrl(tabName), {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Could not fetch the "${tabName}" tab (HTTP ${res.status})`);
  }
  const csvText = await res.text();
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return data;
}

function splitList(value: string | undefined): string[] {
  if (!value || value.toLowerCase() === "not mentioned in video") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getGems(): Promise<Gem[]> {
  if (!SHEET_ID) {
    return [];
  }

  try {
    const [gemRows, mustVisitRows] = await Promise.all([
      fetchTab(GEMS_TAB),
      fetchTab(MUSTVISIT_TAB).catch(() => []),
    ]);
    
    console.log("RAW FIRST ROW:", gemRows[0]);

    const mustVisitBySlug = new Map<string, { name: string; description: string }[]>();
    for (const row of mustVisitRows) {
      const slug = row.slug?.trim();
      if (!slug) continue;
      const list = mustVisitBySlug.get(slug) ?? [];
      list.push({ name: row.name ?? "", description: row.description ?? "" });
      mustVisitBySlug.set(slug, list);
    }

    const gems: Gem[] = gemRows
      .filter((row) => row.Name?.trim() || row.name?.trim())
      .map((row) => {
        const rawName = row.Name ?? row.name ?? "";
        const slug = row.slug?.trim() || rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const baseDescription = row.Description ?? row.description ?? "";
        const miscInfo = row["Misc Info"] ? `\n\nExtra Notes: ${row["Misc Info"]}` : "";

        const inlineMustVisit = splitList(row["Must Visit"] ?? row.mustVisit).map((name) => ({
          name,
          description: "",
        }));

        return {
          name: rawName,
          location: row.Location ?? row.location ?? "",
          description: baseDescription + miscInfo,
          imageURL: row.imageURL ?? row.ImageURL ?? "",
          tags: splitList(row.Tags ?? row.tags),
          slug,
          details: {
            placesToStay: splitList(row["Places to Stay"] ?? row.placesToStay),
            food: splitList(row.Food ?? row.food),
            mustVisit: [...inlineMustVisit, ...(mustVisitBySlug.get(slug) ?? [])],
          },
        };
      });

    return gems;
  } catch (error) {
    console.error("[lib/gems] Error fetching sheet data:", error);
    return [];
  }
}

export async function getGemBySlug(slug: string): Promise<Gem | undefined> {
  const gems = await getGems();
  return gems.find((gem) => gem.slug === slug);
}