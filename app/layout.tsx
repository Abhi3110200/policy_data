import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Policy Data - Comprehensive Policy Information & Analysis",
  description: "Access comprehensive policy data, analysis, and insights. Stay informed with the latest policy updates and research.",
  keywords: ["policy data", "policy analysis", "government policies", "policy research", "public policy"],
  authors: [{ name: "Policy Data Team" }],
  creator: "Policy Data",
  publisher: "Policy Data",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://policydata.com'),
  openGraph: {
    title: "Policy Data - Comprehensive Policy Information & Analysis",
    description: "Access comprehensive policy data, analysis, and insights. Stay informed with the latest policy updates and research.",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://policydata.com',
    siteName: "Policy Data",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Policy Data",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Policy Data - Comprehensive Policy Information & Analysis",
    description: "Access comprehensive policy data, analysis, and insights. Stay informed with the latest policy updates and research.",
    images: ["/twitter-image.png"],
    creator: "@policydata",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://policydata.com',
    languages: {
      'en-US': '/en-US',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <Toaster />
        {children}
      </body>
    </html>
  );
}
