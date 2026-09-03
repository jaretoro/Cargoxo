import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
