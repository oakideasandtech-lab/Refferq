'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo-with-identity.png" alt="PulseISP" className="h-10 w-auto object-contain" />
            <span className="text-xs bg-muted px-2 py-1 rounded font-medium">Affiliate Program Terms</span>
          </div>
          <Link href="/register">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Register
            </Button>
          </Link>
        </div>

        {/* Content */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              PulseISP Affiliate Partner Agreement
            </CardTitle>
            <p className="text-xs text-muted-foreground">Last updated: August 29, 2026</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-foreground leading-relaxed">
            
            <section className="space-y-2">
              <h3 className="text-base font-semibold">1. Enrollment in the Partner Network</h3>
              <p className="text-muted-foreground">
                By registering as an Affiliate Partner with PulseISP ("Company"), you agree to abide by these terms. PulseISP reserves the right to review, approve, or reject any affiliate application at its sole discretion.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">2. Referral Links & Tracking</h3>
              <p className="text-muted-foreground">
                Affiliates will be provided with unique referral links and codes. Tracking cookies are valid for <strong>30 days</strong> from the initial visitor click. Commissions are assigned to the referral link active during registration or purchase.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">3. Commission Structure & Eligibility</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Commissions are earned on qualifying paid subscriptions as defined by your active program terms (e.g. 10% - 15%).</li>
                <li>Self-referrals (signing up for PulseISP using your own referral link) are strictly prohibited and will result in commission forfeiture and account suspension.</li>
                <li>Commissions mature after a standard verification period to allow for refund windows.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">4. Minimum Payout Thresholds & Payments</h3>
              <p className="text-muted-foreground">
                Payouts are issued monthly once your available balance reaches your active program’s minimum threshold (e.g., ₦5,000 for Nigeria, KSh 2,500 for Kenya, or $50 for Global). Payment details must be accurately entered in your partner settings.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">5. Ethical Promotion & Conduct</h3>
              <p className="text-muted-foreground">
                Affiliates must not engage in spam, misleading advertising, bidding on PulseISP trademarked terms on search engines, or unauthorized impersonation of PulseISP representatives.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">6. Termination</h3>
              <p className="text-muted-foreground">
                Either party may terminate this agreement at any time. PulseISP reserves the right to suspend or terminate accounts engaging in fraudulent activity without prior notice.
              </p>
            </section>

            <div className="pt-4 border-t text-xs text-muted-foreground flex items-center justify-between">
              <span>For corporate terms, visit <a href="https://www.pulseisp.com/terms" target="_blank" rel="noreferrer" className="text-primary underline">pulseisp.com/terms</a></span>
              <span>PulseISP Partner Network</span>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
