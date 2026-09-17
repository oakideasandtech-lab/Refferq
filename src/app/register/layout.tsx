import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply as an Affiliate Partner | Earn Up to 20% Commission',
  description:
    'Join the PulseISP Partner Network in Nigeria, Kenya, and across Africa. Earn recurring revenue by introducing ISPs, WISPs, and hotspot operators to PulseISP.',
  alternates: {
    canonical: 'https://affiliate.pulseisp.com/register',
  },
  openGraph: {
    title: 'Become a PulseISP Partner | High-Commission Affiliate Program',
    description:
      'Earn recurring monthly commissions on every ISP and MikroTik billing customer you refer to PulseISP. Fast approval & local bank payouts.',
    url: 'https://affiliate.pulseisp.com/register',
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
