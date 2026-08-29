'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { COMPANY_NAME } from '@/lib/company';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo-with-identity.png" alt="PulseISP" className="h-10 w-auto object-contain" />
            <span className="text-xs bg-muted px-2 py-1 rounded font-medium">Affiliate Privacy Policy</span>
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
              <Shield className="h-6 w-6 text-primary" />
              PulseISP Partner Privacy Policy
            </CardTitle>
            <p className="text-xs text-muted-foreground">Last updated: August 29, 2026</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-foreground leading-relaxed">
            
            <section className="space-y-2">
              <h3 className="text-base font-semibold">1. Information We Collect</h3>
              <p className="text-muted-foreground">
                When you sign up as an Affiliate Partner with {COMPANY_NAME}, we collect your full name, email address, WhatsApp phone number, company/website details, and payout account details (such as bank details, M-Pesa phone number, or PayPal address).
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">2. How We Use Your Information</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>To manage your affiliate account, generate unique referral links, and track commissions.</li>
                <li>To process monthly bank and mobile money payouts accurately.</li>
                <li>To send important program notifications, payout confirmations, and policy updates via email or WhatsApp.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">3. Data Protection & Security</h3>
              <p className="text-muted-foreground">
                Your payment details and personal data are stored using industry-standard encryption protocols. {COMPANY_NAME} does not sell, rent, or trade your personal information to third parties.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">4. Referral Cookies</h3>
              <p className="text-muted-foreground">
                We use browser cookies to attribute referred sales to your affiliate account. These cookies expire after 30 days and store non-personal referral code identifiers.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">5. Your Rights & Contact</h3>
              <p className="text-muted-foreground">
                You may request access to, correction of, or deletion of your personal data at any time by contacting partner support at support@pulseisp.com.
              </p>
            </section>

            <div className="pt-4 border-t text-xs text-muted-foreground flex items-center justify-between">
              <span>For general corporate privacy, visit <a href="https://www.pulseisp.com/privacy" target="_blank" rel="noreferrer" className="text-primary underline">pulseisp.com/privacy</a></span>
              <span>© {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</span>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
