import SentinelChat from "../components/SentinelChat";
import { ContourLines } from "../components/ContourLines";

export default function Home() {
  return (
    <main className="h-[calc(100vh-64px)] bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col py-6 px-6">
      <div className="absolute top-0 left-0 w-full text-emerald-900/20 -z-10 pointer-events-none">
        <ContourLines className="w-full h-[400px]" />
      </div>

      <div className="max-w-4xl w-full mx-auto flex flex-col flex-1 min-h-0 z-10 pt-4">
        {/* The dynamic hero text is now managed inside the SentinelChat component */}
        <SentinelChat />
      </div>
    </main>
  );
}