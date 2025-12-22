import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Abu Dhabi Real Estate Dashboard",
  description: "Comprehensive analytics dashboard for Abu Dhabi real estate transactions from 2019 to 2025",
  keywords: ["Abu Dhabi", "Real Estate", "Property", "Analytics", "Dashboard", "Investment"],
  authors: [{ name: "RE Analytics" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-slate-950 text-slate-100`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
