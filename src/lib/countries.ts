export interface CountryConfig {
  code: string;           // ISO 2-letter country code (NG, KE, GH, etc.)
  name: string;           // Country display name
  currency: string;       // Currency code (NGN, KES, GHS, ZAR, USD, EUR, GBP)
  symbol: string;         // Currency symbol (₦, KSh, ₵, R, $, €, £)
  flag: string;           // Emoji flag
  phonePrefix: string;    // e.g. +234
  placeholder: string;    // e.g. +234 801 234 5678 or 08012345678
  localDigitCount: number; // Standard local 0-prefixed length (11 for Nigeria, 10 for Kenya)
  nationalDigits: number;  // Without leading zero (10 for Nigeria, 9 for Kenya)
  sampleFormat: string;    // Clear human instruction
}

export const WORLD_COUNTRIES: Record<string, CountryConfig> = {
  NG: {
    code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦', flag: '🇳🇬',
    phonePrefix: '+234', placeholder: '+234 801 234 5678 or 08012345678',
    localDigitCount: 11, nationalDigits: 10,
    sampleFormat: '11 digits starting with 0 (e.g. 08012345678) or +234 801 234 5678',
  },
  KE: {
    code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', flag: '🇰🇪',
    phonePrefix: '+254', placeholder: '+254 712 345 678 or 0712345678',
    localDigitCount: 10, nationalDigits: 9,
    sampleFormat: '10 digits starting with 0 (e.g. 0712345678) or +254 712 345 678',
  },
  GH: {
    code: 'GH', name: 'Ghana', currency: 'GHS', symbol: '₵', flag: '🇬🇭',
    phonePrefix: '+233', placeholder: '+233 24 123 4567 or 0241234567',
    localDigitCount: 10, nationalDigits: 9,
    sampleFormat: '10 digits starting with 0 (e.g. 0241234567) or +233 24 123 4567',
  },
  ZA: {
    code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', flag: '🇿🇦',
    phonePrefix: '+27', placeholder: '+27 82 123 4567 or 0821234567',
    localDigitCount: 10, nationalDigits: 9,
    sampleFormat: '10 digits starting with 0 (e.g. 0821234567) or +27 82 123 4567',
  },
  UG: {
    code: 'UG', name: 'Uganda', currency: 'UGX', symbol: 'USh', flag: '🇺🇬',
    phonePrefix: '+256', placeholder: '+256 771 234 567 or 0771234567',
    localDigitCount: 10, nationalDigits: 9,
    sampleFormat: '10 digits starting with 0 (e.g. 0771234567)',
  },
  TZ: {
    code: 'TZ', name: 'Tanzania', currency: 'TZS', symbol: 'TSh', flag: '🇹🇿',
    phonePrefix: '+255', placeholder: '+255 712 345 678 or 0712345678',
    localDigitCount: 10, nationalDigits: 9,
    sampleFormat: '10 digits starting with 0 (e.g. 0712345678)',
  },
  RW: {
    code: 'RW', name: 'Rwanda', currency: 'RWF', symbol: 'FRw', flag: '🇷🇼',
    phonePrefix: '+250', placeholder: '+250 781 234 567 or 0781234567',
    localDigitCount: 10, nationalDigits: 9,
    sampleFormat: '10 digits starting with 0 (e.g. 0781234567)',
  },
  ET: {
    code: 'ET', name: 'Ethiopia', currency: 'ETB', symbol: 'Br', flag: '🇪🇹',
    phonePrefix: '+251', placeholder: '+251 91 123 4567 or 0911234567',
    localDigitCount: 10, nationalDigits: 9,
    sampleFormat: '10 digits starting with 0 (e.g. 0911234567)',
  },
  EG: {
    code: 'EG', name: 'Egypt', currency: 'EGP', symbol: 'E£', flag: '🇪🇬',
    phonePrefix: '+20', placeholder: '+20 101 234 5678 or 01012345678',
    localDigitCount: 11, nationalDigits: 10,
    sampleFormat: '11 digits starting with 0 (e.g. 01012345678)',
  },
  ZM: {
    code: 'ZM', name: 'Zambia', currency: 'ZMW', symbol: 'ZK', flag: '🇿🇲',
    phonePrefix: '+260', placeholder: '+260 97 123 4567 or 0971234567',
    localDigitCount: 10, nationalDigits: 9,
    sampleFormat: '10 digits starting with 0 (e.g. 0971234567)',
  },
  ZW: {
    code: 'ZW', name: 'Zimbabwe', currency: 'ZWG', symbol: 'Z$', flag: '🇿🇼',
    phonePrefix: '+263', placeholder: '+263 77 123 4567 or 0771234567',
    localDigitCount: 10, nationalDigits: 9,
    sampleFormat: '10 digits starting with 0 (e.g. 0771234567)',
  },
  US: {
    code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸',
    phonePrefix: '+1', placeholder: '+1 555 123 4567',
    localDigitCount: 10, nationalDigits: 10,
    sampleFormat: '10 digits (e.g. +1 555 123 4567)',
  },
  GB: {
    code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧',
    phonePrefix: '+44', placeholder: '+44 7911 123456 or 07911123456',
    localDigitCount: 11, nationalDigits: 10,
    sampleFormat: '11 digits starting with 0 (e.g. 07911123456)',
  },
};

// Helper lookup by currency code or country code
export function getCountryByCurrency(currencyCode: string): CountryConfig {
  const codeUpper = (currencyCode || 'NGN').toUpperCase();
  const found = Object.values(WORLD_COUNTRIES).find(c => c.currency === codeUpper || c.code === codeUpper);
  return found || WORLD_COUNTRIES.NG;
}

// Strict phone validation engine per country standard
export function validateCountryPhone(phoneInput: string, countryConfig: CountryConfig): { valid: boolean; error?: string; formatted?: string } {
  if (!phoneInput || !phoneInput.trim()) {
    return { valid: false, error: 'Phone number is required.' };
  }

  const raw = phoneInput.trim();

  // Check for letters or illegal symbols
  if (/[a-zA-Z]/.test(raw)) {
    return { valid: false, error: 'Phone number cannot contain letters.' };
  }

  const digitsOnly = raw.replace(/\D/g, '');
  const prefixDigits = countryConfig.phonePrefix.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return { valid: false, error: 'Phone number must contain digits.' };
  }

  // Case 1: Phone starts with international prefix (e.g. +234 8012345678 or 2348012345678)
  if (digitsOnly.startsWith(prefixDigits)) {
    const subscriberDigits = digitsOnly.slice(prefixDigits.length);
    if (subscriberDigits.length === countryConfig.nationalDigits) {
      return { valid: true, formatted: `${countryConfig.phonePrefix}${subscriberDigits}` };
    }
    // Handle case where user typed +23408012345678 (prefix + leading 0)
    if (subscriberDigits.startsWith('0') && subscriberDigits.slice(1).length === countryConfig.nationalDigits) {
      const cleanSub = subscriberDigits.slice(1);
      return { valid: true, formatted: `${countryConfig.phonePrefix}${cleanSub}` };
    }
  }

  // Case 2: Phone typed in local format (e.g. 08012345678 for NG [11 digits] or 0712345678 for KE [10 digits])
  if (raw.startsWith('0') && digitsOnly.length === countryConfig.localDigitCount) {
    const subscriberDigits = digitsOnly.slice(1); // remove leading 0
    return { valid: true, formatted: `${countryConfig.phonePrefix}${subscriberDigits}` };
  }

  // Case 3: Phone typed without leading zero (e.g. 8012345678 for NG [10 digits] or 712345678 for KE [9 digits])
  if (!raw.startsWith('+') && digitsOnly.length === countryConfig.nationalDigits) {
    return { valid: true, formatted: `${countryConfig.phonePrefix}${digitsOnly}` };
  }

  return {
    valid: false,
    error: `Invalid phone format for ${countryConfig.name}. Requires ${countryConfig.sampleFormat}. You entered ${digitsOnly.length} digits.`,
  };
}
