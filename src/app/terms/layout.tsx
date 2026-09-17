import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Program Terms & Conditions',
  description:
    'Read the official Terms and Conditions for the PulseISP Affiliate & Partner Program, including commission structures, hold periods, and payout terms.',
  alternates: {
    canonical: 'https://affiliate.pulseisp.com/terms',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
