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

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // CRITICAL: Prevents zooming on inputs, makes it feel native
  themeColor: "#ffffff",
};

import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "Hussain Invoice",
  description: "Manage your truck repair shop easily",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hussain Invoice",
  },
  formatDetection: {
    telephone: false, // Prevents iOS styling numbers as links
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="fixed inset-0 flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none md:select-auto">
        <Navbar />
        <main className="flex-1 w-full max-w-full overflow-y-auto overscroll-y-contain pb-16 md:pb-0 relative scroll-smooth">{children}</main>
      </body>
    </html>
  );
}
