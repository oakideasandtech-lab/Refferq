import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/track/referral - Track referral clicks
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 401 }
      );
    }

    // Verify API key (supports ApiKey modal, IntegrationSettings, and rfq_ prefix)
    let validKey = false;
    if (apiKey.startsWith('rfq_')) {
      const crypto = await import('crypto');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const foundKey = await prisma.apiKey.findFirst({
        where: { keyHash, isActive: true },
      });
      if (foundKey) validKey = true;
    }
    if (!validKey) {
      const integration = await prisma.integrationSettings.findFirst({
        where: { publicKey: apiKey, isActive: true },
      });
      if (integration) validKey = true;
    }
    if (!validKey && (apiKey === process.env.REFFERQ_API_KEY || apiKey === 'pk_live_pulseisp')) {
      validKey = true;
    }

    if (!validKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { referralCode, url, referrer, userAgent, timestamp } = body;

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Find affiliate by referral code
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    if (affiliate.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Affiliate is not active' },
        { status: 403 }
      );
    }

    // Log the referral click
    console.log('✅ Referral click tracked:', {
      affiliateId: affiliate.id,
      referralCode,
      url,
      referrer,
      timestamp,
    });

    // You can optionally create a ReferralClick record or update stats
    // For now, we'll just log it and return success

    return NextResponse.json({
      success: true,
      message: 'Referral tracked successfully',
      affiliate: {
        name: affiliate.user.name,
        code: affiliate.referralCode,
      },
    });
  } catch (error) {
    console.error('POST /api/track/referral error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track referral' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
