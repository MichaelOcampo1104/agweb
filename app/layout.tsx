import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  // Drives absolute URLs (canonical, OpenGraph images) for every route.
  // SITE_URL warns in production builds if NEXT_PUBLIC_SITE_URL is unset.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sourcify — B2B Data Aggregation Platform",
    template: "%s | Sourcify",
  },
  description:
    "B2B data aggregation platform. Search halal-certified manufacturers, track Singapore infrastructure projects, and more — built for importers, contractors, and sourcing teams.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sourcify — B2B Data Aggregation Platform",
    description:
      "One place to search halal-certified manufacturers and track government infrastructure projects worldwide.",
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
