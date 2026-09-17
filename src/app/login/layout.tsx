import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Login | Access Your Affiliate Dashboard',
  description:
    'Sign in to your PulseISP Partner Dashboard. View real-time ISP referrals, check your pending commissions, and request payouts.',
  alternates: {
    canonical: 'https://affiliate.pulseisp.com/login',
  },
  openGraph: {
    title: 'Partner Login | PulseISP Affiliate Portal',
    description: 'Sign in to access your PulseISP partner statistics, referral codes, and payouts.',
    url: 'https://affiliate.pulseisp.com/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
