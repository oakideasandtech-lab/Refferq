import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | PulseISP Affiliate Program',
  description:
    'Learn how PulseISP protects affiliate partner data, handles tracking cookies, and secures payout information.',
  alternates: {
    canonical: 'https://affiliate.pulseisp.com/privacy',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
