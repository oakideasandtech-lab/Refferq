/**
 * Client-side Google Analytics 4 (GA4) helper for PulseISP Affiliate.
 *
 * Measurement ID: G-52Y526W53Z (configurable via NEXT_PUBLIC_GA_MEASUREMENT_ID)
 */
"use client";

import React, { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-52Y526W53Z";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Inject the gtag bootstrap script once (idempotent).
 */
export function initGa4(): void {
  if (typeof window === "undefined") return;
  if (!GA4_MEASUREMENT_ID) return;
  if (window.gtag) return;

  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    w.dataLayer.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  w.gtag("js", new Date());
  w.gtag("config", GA4_MEASUREMENT_ID, { send_page_view: false });
}

/**
 * Fire a GA4 custom event (e.g. sign_up, generate_lead, copy_referral_link).
 */
export function trackGa4Event(eventName: string, params: Record<string, any> = {}): void {
  if (typeof window === "undefined") return;
  initGa4();
  if (!GA4_MEASUREMENT_ID) return;
  try {
    window.gtag?.("event", eventName, params);
  } catch (e) {
    /* ignore */
  }
}

/**
 * Fire GA4 page_view on SPA route changes.
 */
export function trackGa4PageView(pagePath: string): void {
  if (typeof window === "undefined") return;
  initGa4();
  if (!GA4_MEASUREMENT_ID) return;
  try {
    window.gtag?.("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  } catch (e) {
    /* ignore */
  }
}

function GaTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA4_MEASUREMENT_ID) return;
    initGa4();
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackGa4PageView(url);
  }, [pathname, searchParams]);

  return null;
}

/**
 * Client component listener for automatic route-change page_view tracking.
 */
export function GoogleAnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <GaTrackerInner />
    </Suspense>
  );
}
