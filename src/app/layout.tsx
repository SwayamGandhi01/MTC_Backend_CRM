import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mobile Tyre Champions | Admin Portal",
  description:
    "Secure automotive dispatch and operations dashboard for Mobile Tyre Champions.",
  icons: {
    icon: "/images/mtc-logo.webp",
    shortcut: "/images/mtc-logo.webp",
    apple: "/images/mtc-logo.webp",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0C162D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
