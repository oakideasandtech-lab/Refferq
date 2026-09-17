import React from 'react';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { db } from '@/lib/prisma';
import { GoogleAnalyticsTracker } from '@/lib/ga4';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'PulseISP Partner & Affiliate Program | Earn Recurring Revenue',
    template: '%s | PulseISP Partner Program',
  },
  description:
    'Join the official PulseISP Partner Network. Recommend the leading Cloud MikroTik ISP Billing & Hotspot Management platform and earn up to 20% recurring monthly commissions.',
  keywords: [
    'PulseISP affiliate',
    'ISP billing partner program',
    'MikroTik partner program Nigeria',
    'MikroTik partner program Kenya',
    'telecom affiliate Africa',
    'WISP billing software commission',
    'hotspot billing partner',
  ],
  metadataBase: new URL('https://affiliate.pulseisp.com'),
  alternates: {
    canonical: 'https://affiliate.pulseisp.com',
  },
  openGraph: {
    title: 'PulseISP Partner & Affiliate Program | Earn Recurring Revenue',
    description:
      'Earn recurring monthly commissions recommending PulseISP Cloud MikroTik ISP Billing & Hotspot Management Platform.',
    url: 'https://affiliate.pulseisp.com',
    siteName: 'PulseISP Partner Network',
    images: [
      {
        url: 'https://www.pulseisp.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PulseISP Partner Program',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseISP Partner & Affiliate Program',
    description:
      'Earn recurring monthly commissions recommending PulseISP Cloud MikroTik ISP Billing & Hotspot Management Platform.',
    images: ['https://www.pulseisp.com/og-image.jpg'],
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings = null;
  try {
    settings = await db.getPlatformSettings();
  } catch {
    // DB unavailable (e.g. during Docker build prerendering) — use defaults
  }

  // Create dynamic styles based on settings
  const dynamicStyles = {
    '--primary': settings?.brandButtonColor ? hexToHSL(settings.brandButtonColor) : undefined,
    '--radius': '0.5rem',
  } as React.CSSProperties;

  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${geistMono.variable} antialiased`}>
      <body className="font-sans antialiased" style={dynamicStyles}>
        <GoogleAnalyticsTracker />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

// Helper to convert hex to HSL for Tailwind compatibility
function hexToHSL(hex: string): string {
  // Remove hash if present
  const rHex = hex.replace('#', '');
  const r = parseInt(rHex.substring(0, 2), 16) / 255;
  const g = parseInt(rHex.substring(2, 4), 16) / 255;
  const b = parseInt(rHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}