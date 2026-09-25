import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Direction A's pairing: a characterful serif for display, a technical
// grotesque for everything else. Fraunces is variable, so no weight list is
// needed — next/font ships the wght axis by default and leaves the optical
// and "wonk" axes out to keep the file small.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// IBM Plex Sans is not variable on Google Fonts, so its weights are listed.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cargoxo — Nigerian Logistics Marketplace",
  description:
    "Cargoxo connects Nigerian exporters with verified logistics companies (cargo agents) for shipping, freight, and customs clearance.",
};

// Deliberately bare — no Navbar/Footer here. Marketing pages get those from
// (marketing)/layout.tsx; /admin and /dashboard/* build their own app-shell
// chrome instead, since neither wants the marketing site's header/footer.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
