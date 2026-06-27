import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  // Drives absolute URLs (canonical, OpenGraph images) for every route.
  // Falls back to localhost so local dev never throws on a missing env var.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Halal Directory — Global Halal-Certified Manufacturers & Certifiers",
    template: "%s | Halal Directory",
  },
  description:
    "Search the global directory of halal-certified manufacturers and halal certification bodies. Filter by country, industry, and certifier — built for importers, distributors, and sourcing teams.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Halal Directory — Global Halal-Certified Manufacturers",
    description:
      "One place to find halal-certified manufacturers worldwide. Filter by country, industry, and certification body.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
