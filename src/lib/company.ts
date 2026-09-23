export const COMPANY_NAME = 
  process.env.NEXT_PUBLIC_PULSEISP_COMPANY_NAME || 
  process.env.NEXT_PUBLIC_COMPANY_NAME || 
  'PulseISP Technologies Ltd';

export const getAppUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  // Allow localhost during local development
  if (process.env.NODE_ENV === 'development' && envUrl && envUrl.includes('localhost')) {
    return envUrl;
  }
  // In production, force official domain if missing or pointing to default vercel/refferq URLs
  if (!envUrl || envUrl.includes('vercel.app') || envUrl.includes('refferq.com')) {
    return 'https://affiliate.pulseisp.com';
  }
  return envUrl.replace(/\/+$/, '');
};

export const APP_URL = getAppUrl();
