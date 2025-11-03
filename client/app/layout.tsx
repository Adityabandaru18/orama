import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ORAMA - Secure NFT Event Ticketing",
  description:
    "Blockchain-powered NFT ticketing platform for secure, transparent event management",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://11155111.rpc.thirdweb.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://rpc.thirdweb.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://images.unsplash.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`font-sans ${inter.variable} ${GeistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
