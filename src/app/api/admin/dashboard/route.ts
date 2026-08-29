import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrencySymbol } from '@/lib/currency';


export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Calculate platform stats
    const totalAffiliates = await prisma.affiliate.count();
    const totalUsers = await prisma.user.count();
    const totalReferrals = await prisma.referral.count();
    const totalConversions = await prisma.conversion.count();
    
    const pendingReferrals = await prisma.referral.count({
      where: { status: 'PENDING' }
    });
    
    const approvedReferrals = await prisma.referral.count({
      where: { status: 'APPROVED' }
    });
    
    // Calculate ACTUAL transaction revenue from conversions
    const totalRevenue = await prisma.conversion.aggregate({
      _sum: { amountCents: true }
    });
    
    // Calculate ESTIMATED revenue from referrals (leads)
    const referrals = await prisma.referral.findMany({
      include: {
        affiliate: true
      }
    });
    
    // Get all partner groups for commission rate lookup
    const partnerGroups = await prisma.partnerGroup.findMany();
    const partnerGroupMap = new Map(
      partnerGroups.map(pg => [pg.id, pg.commissionRate])
    );
    
    let totalEstimatedRevenue = 0;
    let totalEstimatedCommission = 0;
    
    referrals.forEach((ref) => {
      const metadata = ref.metadata as any;
      const estimatedValue = Number(metadata?.estimated_value) || 0;
      const valueInCents = estimatedValue * 100;
      
      // Get commission rate from partner group or default to 20%
      const affiliate = ref.affiliate as any;
      const partnerGroupId = affiliate.partnerGroupId;
      const commissionRate = partnerGroupId 
        ? (partnerGroupMap.get(partnerGroupId) || 0.20)
        : 0.20;
      const commissionInCents = Math.floor(valueInCents * commissionRate);
      
      totalEstimatedRevenue += valueInCents;
      totalEstimatedCommission += commissionInCents;
    });

    // Calculate program-by-program regional multi-currency stats
    const programs = await prisma.program.findMany({
      where: { isActive: true },
      include: {
        affiliates: {
          select: { id: true },
        },
      },
    });

    const programStats = await Promise.all(
      programs.map(async (p) => {
        const affiliateIds = p.affiliates.map((a) => a.id);

        const [convSum, commSum] = await Promise.all([
          prisma.conversion.aggregate({
            where: affiliateIds.length > 0 ? { affiliateId: { in: affiliateIds } } : { id: 'none' },
            _sum: { amountCents: true },
          }),
          prisma.commission.aggregate({
            where: affiliateIds.length > 0 ? { affiliateId: { in: affiliateIds } } : { id: 'none' },
            _sum: { amountCents: true },
          }),
        ]);

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          currency: p.currency,
          countryCode: p.countryCode || 'NG',
          countryName: p.countryName || 'Nigeria',
          commissionRate: p.commissionRate,
          affiliateCount: p.affiliates.length,
          revenueCents: convSum._sum.amountCents || 0,
          commissionCents: commSum._sum.amountCents || 0,
        };
      })
    );

    const stats = {
      totalAffiliates,
      totalUsers,
      totalReferrals,
      totalConversions,
      pendingReferrals,
      approvedReferrals,
      totalRevenue: totalRevenue._sum?.amountCents || 0,
      totalEstimatedRevenue,
      totalEstimatedCommission,
      programStats,
    };

    const currencySymbol = await getCurrencySymbol();

    return NextResponse.json({ success: true, stats, currencySymbol });

  } catch (error) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}