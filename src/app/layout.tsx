import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from './providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'USDC PayLink',
  description: 'Create pay links that accept USDC on testnet.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ maxWidth: 820, margin: '40px auto', padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>USDC PayLink</h1>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}