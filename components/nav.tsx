import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-lg font-bold tracking-tight text-white">
            Project Sentinel
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
          >
            AI Planner
          </Link>
          <Link
            href="/explore"
            className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
          >
            Explore
          </Link>
        </nav>
      </div>
    </header>
  );
}