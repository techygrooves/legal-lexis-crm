import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LegalCRM",
  description: "Case and client management for a solo attorney practice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-svh">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col bg-zinc-50 dark:bg-background">
            <Header />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
