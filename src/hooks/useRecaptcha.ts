"use client";

import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_GRECAPTCHA_SITEKEY_PULSEISP || "";

/**
 * Hook to load reCAPTCHA v3 and execute it on demand in affiliate app.
 */
export function useRecaptcha(action: string = "submit") {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || typeof window === "undefined") return;
    if (document.getElementById("recaptcha-script")) {
      loaded.current = true;
      return;
    }

    const script = document.createElement("script");
    script.id = "recaptcha-script";
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    loaded.current = true;
  }, []);

  const executeRecaptcha = useCallback(async (): Promise<string | null> => {
    if (!SITE_KEY) {
      console.warn("[RECAPTCHA] Missing NEXT_PUBLIC_GRECAPTCHA_SITEKEY_PULSEISP");
      return null;
    }

    return new Promise((resolve) => {
      if (!window.grecaptcha) {
        const check = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(check);
            window.grecaptcha.ready(async () => {
              try {
                const token = await window.grecaptcha!.execute(SITE_KEY, { action });
                resolve(token);
              } catch {
                resolve(null);
              }
            });
          }
        }, 200);
        setTimeout(() => {
          clearInterval(check);
          resolve(null);
        }, 10000);
      } else {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha!.execute(SITE_KEY, { action });
            resolve(token);
          } catch {
            resolve(null);
          }
        });
      }
    });
  }, [action]);

  const verifyRecaptcha = useCallback(async (): Promise<boolean> => {
    const token = await executeRecaptcha();
    if (!token) return true; // Graceful fallback if token not configured

    try {
      const res = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      return data.success === true;
    } catch {
      return true; // Fallback to true if network error
    }
  }, [executeRecaptcha]);

  return { executeRecaptcha, verifyRecaptcha };
}
