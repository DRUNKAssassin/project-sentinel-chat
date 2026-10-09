import { getGems } from "../../lib/gems";
import { GemCard } from "../../components/GemCard";
import { ContourLines } from "../../components/ContourLines";

export default async function ExplorePage() {
  const gems = await getGems();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-16">
      <div className="absolute top-0 left-0 w-full text-emerald-900/15 -z-10 pointer-events-none">
        <ContourLines className="w-full h-[350px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Verified Hidden Gems</h1>
            <p className="text-slate-400 text-sm mt-1">
              Curated locations across Jammu & Kashmir synced directly from live data.
            </p>
          </div>
          <span className="self-start md:self-auto bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-4 py-1.5 rounded-full text-xs font-semibold">
            {gems.length} {gems.length === 1 ? "Destination" : "Destinations"}
          </span>
        </div>

        {gems.length === 0 ? (
          <div className="p-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-sm">No destinations found in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gems.map((gem) => (
              <GemCard key={gem.slug} gem={gem} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}