import { NextRequest, NextResponse } from 'next/server';
import { UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';


// Batch update affiliates
export async function POST(request: NextRequest) {
  try {
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
    const { affiliateIds, action, status, group } = body;

    if (!affiliateIds || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
      return NextResponse.json(
        { error: 'affiliateIds array is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'action is required (changeStatus, changeGroup, delete)' },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    switch (action) {
      case 'changeStatus':
        if (!status) {
          return NextResponse.json(
            { error: 'status is required for changeStatus action' },
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

        // Get all affiliates to find their userIds and programs
        const affiliates = await prisma.affiliate.findMany({
          where: { id: { in: affiliateIds } },
          include: { user: true, program: true }
        });

        const newlyApproved = status === 'ACTIVE'
          ? affiliates.filter(aff => aff.user.status !== 'ACTIVE')
          : [];

        const userIds = affiliates.map(aff => aff.userId);

        // Update user statuses
        const result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: status as UserStatus }
        });

        updatedCount = result.count;

        // Send approval emails to newly activated partners
        if (newlyApproved.length > 0) {
          try {
            const { emailService } = await import('@/lib/email');
            const { getAppUrl } = await import('@/lib/company');
            const appUrl = getAppUrl();

            for (const aff of newlyApproved) {
              try {
                const commissionRate = aff.program?.commissionRate || 20;
                await emailService.sendAffiliateApprovedEmail({
                  name: aff.user.name,
                  email: aff.user.email,
                  referralCode: aff.referralCode,
                  referralLink: `${appUrl}/r/${aff.referralCode}`,
                  loginUrl: `${appUrl}/login`,
                  programName: aff.program?.name || 'PulseISP Partner Program',
                  commissionRate,
                });
                console.log(`[Approval Email] Batch approval email sent to ${aff.user.email}`);
              } catch (err) {
                console.error(`[Approval Email] Failed to send batch approval email to ${aff.user.email}:`, err);
              }
            }
          } catch (batchEmailErr) {
            console.error('[Approval Email] Failed to process batch approval emails:', batchEmailErr);
          }
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'BATCH_UPDATE_AFFILIATE_STATUS',
            objectType: 'AFFILIATE',
            objectId: 'BATCH',
            payload: {
              affiliateIds,
              newStatus: status,
              count: updatedCount
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: `Updated ${updatedCount} affiliate(s) status to ${status}`,
          count: updatedCount
        });

      case 'changeGroup':
        if (!group) {
          return NextResponse.json(
            { error: 'group is required for changeGroup action' },
            { status: 400 }
          );
        }

        // Update affiliate metadata with group
        for (const affiliateId of affiliateIds) {
          await prisma.affiliate.update({
            where: { id: affiliateId },
            data: {
              payoutDetails: {
                // Preserve existing data and add/update group
                ...(await prisma.affiliate.findUnique({
                  where: { id: affiliateId },
                  select: { payoutDetails: true }
                }).then(a => a?.payoutDetails as any) || {}),
                group
              }
            }
          });
          updatedCount++;
        }

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'BATCH_UPDATE_AFFILIATE_GROUP',
            objectType: 'AFFILIATE',
            objectId: 'BATCH',
            payload: {
              affiliateIds,
              newGroup: group,
              count: updatedCount
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: `Updated ${updatedCount} affiliate(s) group to ${group}`,
          count: updatedCount
        });

      case 'delete':
        // Get all affiliates to find their userIds
        const affiliatesToDelete = await prisma.affiliate.findMany({
          where: { id: { in: affiliateIds } },
          include: { user: true }
        });

        const userIdsToDelete = affiliatesToDelete.map(aff => aff.userId);

        // Delete users (will cascade delete affiliates)
        const deleteResult = await prisma.user.deleteMany({
          where: { id: { in: userIdsToDelete } }
        });

        updatedCount = deleteResult.count;

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'BATCH_DELETE_AFFILIATES',
            objectType: 'AFFILIATE',
            objectId: 'BATCH',
            payload: {
              affiliateIds,
              count: updatedCount,
              deletedEmails: affiliatesToDelete.map(a => a.user.email)
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: `Deleted ${updatedCount} affiliate(s)`,
          count: updatedCount
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: changeStatus, changeGroup, or delete' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Batch update affiliates error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch update' },
      { status: 500 }
    );
  }
}
