import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrencySymbolForCode, getCurrencySymbol } from '@/lib/currency';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        affiliate: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json({ error: 'Access denied. Affiliate role required.' }, { status: 403 });
    }

    const affiliate = user.affiliate as any;
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 });
    }

    // Get affiliate statistics
    const referrals = await prisma.referral.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
    });

    const conversions = await prisma.conversion.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
    });

    const commissions = await prisma.commission.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
    });

    // Available earnings = COMPLETED (PAID) + APPROVED
    const availableEarnings = commissions
      .filter(c => c.status === 'PAID' || c.status === 'APPROVED')
      .reduce((sum, c) => sum + c.amountCents, 0);

    const pendingCommissionsList = commissions.filter(c => c.status === 'PENDING');
    const pendingEarningsCents = pendingCommissionsList.reduce((sum, c) => sum + c.amountCents, 0);

    const totalCommissions = commissions.length;
    const pendingCommissionsCount = pendingCommissionsList.length;
    const totalConversions = conversions.length;
    const totalClicks = referrals.reduce((sum, r) => {
      const metadata = r.metadata as any;
      return sum + (metadata?.clicks || 0);
    }, 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    const nextMaturesAt = pendingCommissionsList
      .filter(c => (c as any).maturesAt)
      .sort((a, b) => ((a as any).maturesAt.getTime() - (b as any).maturesAt.getTime()))[0]?.maturesAt || null;

    const stats = {
      totalEarnings: availableEarnings,
      pendingEarnings: pendingEarningsCents,
      pendingEarningsList: pendingCommissionsList.length,
      nextMaturesAt,
      totalCommissions,
      pendingCommissions: pendingCommissionsCount,
      totalConversions,
      totalClicks,
      conversionRate,
    };

    const mappedReferrals = referrals.map(ref => {
      const metadata = ref.metadata as any;
      return {
        ...ref,
        estimatedValue: Number(metadata?.estimated_value) || 0,
        company: metadata?.company || '',
      };
    });

    // Determine affiliate native program currency & country
    const currency = affiliate.program?.currency || 'NGN';
    const currencySymbol = getCurrencySymbolForCode(currency);
    const countryCode = affiliate.program?.countryCode || (currency === 'NGN' ? 'NG' : currency === 'KES' ? 'KE' : 'US');
    const countryName = affiliate.program?.countryName || (currency === 'NGN' ? 'Nigeria' : currency === 'KES' ? 'Kenya' : 'Global');

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      affiliate,
      stats,
      referrals: mappedReferrals,
      conversions,
      commissions,
      currency,
      currencySymbol,
      countryCode,
      countryName,
      program: affiliate.program,
    });
  } catch (error) {
    console.error('Affiliate profile API error:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliate profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        affiliate: {
          include: {
            program: true,
          },
        },
      },
    });

    if (!user || user.role !== 'AFFILIATE' || !user.affiliate) {
      return NextResponse.json({ error: 'Access denied or affiliate not found' }, { status: 403 });
    }

    const body = await request.json();
    const { name, company, email, country, paymentMethod, bankName, accountName, accountNumber } = body;

    const affiliate = user.affiliate as any;
    const currency = affiliate.program?.currency || 'NGN';

    // SERVER-SIDE VALIDATION FOR COMPULSORY PAYOUT FIELDS
    if (bankName !== undefined || accountName !== undefined || accountNumber !== undefined) {
      if (currency === 'NGN') {
        if (!bankName || !bankName.trim() || !accountName || !accountName.trim() || !accountNumber || !accountNumber.trim()) {
          return NextResponse.json(
            { error: 'Bank Name, Account Name, and Account Number are required for Nigerian bank payouts.' },
            { status: 400 }
          );
        }
      } else {
        if (!accountName || !accountName.trim() || !accountNumber || !accountNumber.trim()) {
          return NextResponse.json(
            { error: 'Account Holder Name and Account/Phone Number are required to save payment details.' },
            { status: 400 }
          );
        }
      }
    }

    // Update user info
    const userUpdateData: any = {};
    if (name && name.trim()) userUpdateData.name = name.trim();
    if (email && email.trim() && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      userUpdateData.email = email.trim().toLowerCase();
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
      });
    }

    // Update affiliate payout details
    const existingPayoutDetails = (affiliate.payoutDetails as any) || {};
    const updatedPayoutDetails = {
      ...existingPayoutDetails,
      company: company !== undefined ? company.trim() : existingPayoutDetails.company,
      country: country || existingPayoutDetails.country || 'Nigeria',
      paymentMethod: paymentMethod || existingPayoutDetails.paymentMethod || 'Bank Transfer',
    };

    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        payoutDetails: updatedPayoutDetails,
        ...(bankName !== undefined ? { bankName: bankName.trim() } : {}),
        ...(accountName !== undefined ? { accountName: accountName.trim() } : {}),
        ...(accountNumber !== undefined ? { accountNumber: accountNumber.trim() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile & payment settings updated successfully',
    });
  } catch (error) {
    console.error('Affiliate profile update API error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}