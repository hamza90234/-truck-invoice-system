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
import AuthGuard from "./components/AuthGuard";

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
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="fixed inset-0 flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none md:select-auto print:static print:overflow-visible print:h-auto print:min-h-full print:bg-white">
        <AuthGuard>
          <Navbar />
          <main className="flex-1 w-full max-w-full overflow-y-auto overscroll-y-contain pb-16 md:pb-0 relative scroll-smooth print:overflow-visible print:h-auto print:pb-0 print:static print:m-0 print:p-0">{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}
