import "./globals.css";
import { Nav } from "../components/nav";

export const metadata = {
  title: "Project Sentinel - J&K Travel Intelligence",
  description: "Geospatial travel planner and hidden gems directory for J&K",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col">
        <Nav />
        {children}
      </body>
    </html>
  );
}