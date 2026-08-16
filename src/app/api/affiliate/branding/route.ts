import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrencySymbol } from '@/lib/currency';

// CURRENCY_SYMBOLS lives in @/lib/currency; reuse via getCurrencySymbol for consistency.
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.programSettings.findFirst({
      select: {
        companyName: true,
        programName: true,
        productName: true,
        companyLogo: true,
        websiteUrl: true,
        portalSubdomain: true,
        currency: true,
        minimumPayoutThreshold: true,
        payoutTerm: true,
        commissionHoldDays: true,
        brandBackgroundColor: true,
        brandButtonColor: true,
        brandTextColor: true,
      },
    });

    const currencySymbol = settings?.currency ? await getCurrencySymbol() : '$';

    return NextResponse.json({
      success: true,
      settings: {
        ...(settings || {}),
        currencySymbol,
      },
    });
  } catch (error) {
    console.error('Failed to fetch branding:', error);
    return NextResponse.json({
      success: true,
      settings: {},
    });
  }
}
