import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/track/conversion - Track conversions/sales
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
    const {
      referralCode,
      customerEmail,
      customerName,
      amount,
      currency,
      orderId,
      metadata,
      url,
      timestamp,
    } = body;

    let affiliate: any = null;
    let referral: any = null;

    // 1. First attempt: Look up affiliate by referralCode if provided
    if (referralCode) {
      affiliate = await prisma.affiliate.findUnique({
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
    }

    // 2. Second attempt: Lifetime customer attribution by customerEmail
    if (!affiliate && customerEmail) {
      const cleanEmail = customerEmail.toLowerCase().trim();
      referral = await prisma.referral.findFirst({
        where: {
          leadEmail: cleanEmail,
        },
        include: {
          affiliate: {
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
          },
        },
      });

      if (referral?.affiliate) {
        affiliate = referral.affiliate;
      }
    }

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'No matching affiliate found for referral code or customer email' },
        { status: 404 }
      );
    }

    if (affiliate.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Affiliate is not active' },
        { status: 403 }
      );
    }

    const customerPhone = body.customerPhone || (metadata as any)?.phone || null;
    const companyName = (metadata as any)?.company || (metadata as any)?.business_name || '';

    // Check if referral with this email already exists
    if (!referral && customerEmail) {
      referral = await prisma.referral.findFirst({
        where: {
          leadEmail: customerEmail.toLowerCase().trim(),
          affiliateId: affiliate.id,
        },
      });
    }

    // Create referral if doesn't exist
    if (!referral && customerEmail) {
      referral = await prisma.referral.create({
        data: {
          leadEmail: customerEmail.toLowerCase().trim(),
          leadName: customerName || companyName || 'Unknown Customer',
          leadPhone: customerPhone,
          affiliateId: affiliate.id,
          status: 'APPROVED',
          metadata: {
            ...(metadata || {}),
            company: companyName,
          },
        },
      });
    } else if (referral) {
      // Update referral status and attach phone/company info
      referral = await prisma.referral.update({
        where: { id: referral.id },
        data: {
          leadName: customerName || referral.leadName,
          leadPhone: customerPhone || referral.leadPhone,
          status: 'APPROVED',
          metadata: {
            ...(referral.metadata as object),
            ...metadata,
            company: companyName || (referral.metadata as any)?.company || '',
          },
        },
      });
    }

    // Create conversion record
    const amountCents = Math.round((amount || 0) * 100);
    const eventType = body.eventType === 'SIGNUP' ? 'SIGNUP' : (amountCents > 0 ? 'PURCHASE' : 'SIGNUP');

    const conversion = await prisma.conversion.create({
      data: {
        affiliateId: affiliate.id,
        referralId: referral?.id || null,
        eventType: eventType as any,
        amountCents,
        currency: currency || 'NGN',
        status: amountCents > 0 ? 'PENDING' : 'APPROVED',
        eventMetadata: {
          orderId: orderId || null,
          url: url || null,
          timestamp: timestamp || new Date().toISOString(),
          ...metadata,
        },
      },
    });

    // If purchase/payment with value, generate commission for affiliate
    let commission = null;
    if (amountCents > 0) {
      const program = affiliate.programId
        ? await prisma.program.findUnique({ where: { id: affiliate.programId } })
        : await prisma.program.findFirst({ where: { isDefault: true } });
      const commissionRate = program?.commissionRate || 10;
      const commissionAmount = Math.floor((amountCents * commissionRate) / 100);

      const settings = await prisma.programSettings.findFirst();
      const holdDays = (settings as any)?.commissionHoldDays ?? 30;
      const maturesAt = new Date();
      maturesAt.setDate(maturesAt.getDate() + holdDays);

      commission = await prisma.commission.create({
        data: {
          conversionId: conversion.id,
          affiliateId: affiliate.id,
          userId: affiliate.userId,
          amountCents: commissionAmount,
          rate: commissionRate,
          status: 'PENDING',
          maturesAt,
        },
      });
    }

    console.log('✅ Conversion tracked successfully:', {
      conversionId: conversion.id,
      affiliateId: affiliate.id,
      referralId: referral?.id,
      amount: amountCents / 100,
    });

    return NextResponse.json({
      success: true,
      message: 'Conversion tracked successfully',
      conversion: {
        id: conversion.id,
        amount: amountCents / 100,
        currency: conversion.currency,
      },
      affiliate: {
        name: affiliate.user.name,
        code: affiliate.referralCode,
      },
    });
  } catch (error) {
    console.error('POST /api/track/conversion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track conversion' },
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
