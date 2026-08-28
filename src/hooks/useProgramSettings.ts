import { useEffect, useState, useCallback } from 'react';

export interface ProgramSettings {
  companyName?: string;
  programName?: string;
  productName?: string;
  companyLogo?: string;
  websiteUrl?: string;
  portalSubdomain?: string;
  currency?: string;
  minimumPayoutThreshold?: number;
  payoutTerm?: string;
  commissionHoldDays?: number;
  brandBackgroundColor?: string;
  brandButtonColor?: string;
  brandTextColor?: string;
  currencySymbol?: string;
}

export function useProgramSettings() {
  const [settings, setSettings] = useState<ProgramSettings>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/branding');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch {
      // Fall back to defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const currencySymbol = '₦';

  const formatCurrency = useCallback(
    (cents: number) => `${currencySymbol}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    [currencySymbol]
  );

  return {
    settings,
    loading,
    refresh,
    currencySymbol,
    formatCurrency,
  };
}