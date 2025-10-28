import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Removed cn import

// Setup the Inter font
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "EchoGuard - Misinformation Analyzer",
  description: "Analyze text for misinformation and track its propagation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Removed cn() function and used template literal */}
      <body
        className={`min-h-screen bg-background font-sans antialiased dark ${fontSans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}

