import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Public active programs for registration dropdown
export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
        countryCode: true,
        countryName: true,
        commissionRate: true,
        minPayoutCents: true,
        isDefault: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    if (programs.length === 0) {
      return NextResponse.json({
        success: true,
        programs: [
          {
            id: 'default',
            name: 'Nigeria Expansion',
            slug: 'ng-affiliate',
            currency: 'NGN',
            commissionRate: 10,
            minPayoutCents: 500000,
            isDefault: true,
          },
        ],
      });
    }

    return NextResponse.json({ success: true, programs });
  } catch (error) {
    console.error('Public programs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch active programs' }, { status: 500 });
  }
}
