import { NextRequest, NextResponse } from 'next/server';
import { UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';


// GET single affiliate details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = request.headers.get('x-user-id');
    
    let adminUser = null;
    if (userId) {
      adminUser = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!adminUser || adminUser.role !== 'ADMIN') {
      adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        partnerGroup: true,
        program: true,
        _count: {
          select: {
            referrals: true,
            conversions: true,
            commissions: true,
            payouts: true,
          },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const details = (affiliate.payoutDetails as any) || {};

    return NextResponse.json({
      success: true,
      partner: {
        id: affiliate.id,
        userId: affiliate.userId,
        name: affiliate.user.name,
        email: affiliate.user.email,
        referralCode: affiliate.referralCode,
        status: affiliate.user.status,
        partnerGroup: affiliate.partnerGroup?.name || null,
        commissionRate: (affiliate.program?.commissionRate || 10) / 100,
        balanceCents: affiliate.balanceCents,
        bankName: affiliate.bankName || details.bankName || null,
        accountName: affiliate.accountName || details.accountName || null,
        accountNumber: affiliate.accountNumber || details.accountNumber || null,
        phone: details.phone || null,
        website: details.website || null,
        promotionMethod: details.promotionMethod || null,
        payoutDetails: details,
        createdAt: affiliate.createdAt,
        totalLeads: affiliate._count.referrals,
        totalConversions: affiliate._count.conversions,
      },
    });
  } catch (error) {
    console.error('GET affiliate detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliate' }, { status: 500 });
  }
}

// Update affiliate status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = request.headers.get('x-user-id')!;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get affiliate to find userId
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: affiliate.userId },
      data: {
        status: status as UserStatus
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'UPDATE_AFFILIATE_STATUS',
        objectType: 'AFFILIATE',
        objectId: params.id,
        payload: {
          oldStatus: affiliate.user.status,
          newStatus: status,
          notes: notes || null,
          affiliateEmail: affiliate.user.email
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Affiliate status updated to ${status}`,
      affiliate: {
        id: affiliate.id,
        userId: updatedUser.id,
        status: updatedUser.status
      }
    });

  } catch (error) {
    console.error('Update affiliate status error:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate status' },
      { status: 500 }
    );
  }
}

// Delete affiliate
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = request.headers.get('x-user-id')!;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get affiliate to find userId
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Delete user (will cascade delete affiliate due to Prisma schema)
    await prisma.user.delete({
      where: { id: affiliate.userId }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'DELETE_AFFILIATE',
        objectType: 'AFFILIATE',
        objectId: params.id,
        payload: {
          affiliateName: affiliate.user.name,
          affiliateEmail: affiliate.user.email,
          referralCode: affiliate.referralCode
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Affiliate deleted successfully'
    });

  } catch (error) {
    console.error('Delete affiliate error:', error);
    return NextResponse.json(
      { error: 'Failed to delete affiliate' },
      { status: 500 }
    );
  }
}
