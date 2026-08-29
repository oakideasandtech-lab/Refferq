export const DEFAULT_PROGRAM_LOGO = process.env.NEXT_PUBLIC_PROGRAM_LOGO || 'https://www.pulseisp.com/logo-with-identity.png';

export function getProgramLogo(logoUrl?: string | null): string {
  if (logoUrl && logoUrl.trim().length > 0) {
    return logoUrl.trim();
  }
  return DEFAULT_PROGRAM_LOGO;
}
