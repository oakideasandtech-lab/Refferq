/* eslint-disable @typescript-eslint/no-explicit-any */

interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

interface SlackAttachment {
  color?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: SlackField[];
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export async function sendSlackMessage({
  channel,
  text,
  attachments,
  blocks,
}: {
  channel: string;
  text?: string;
  attachments?: SlackAttachment[];
  blocks?: any[];
}): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.warn('[Slack] SLACK_BOT_TOKEN is not configured.');
    return false;
  }

  // Remove leading '#' if provided, Slack API accepts channel names or IDs
  const cleanChannel = channel.replace(/^#/, '');

  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: cleanChannel,
        text: text || '',
        attachments: attachments || undefined,
        blocks: blocks || undefined,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('[Slack] Failed to post message:', data.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Slack] Network error posting to Slack:', err);
    return false;
  }
}

/**
 * 📢 Notify #pending-approval when a new affiliate partner registers
 */
export async function notifyPendingPartnerApproval(data: {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  promotionMethod?: string;
  programName?: string;
  referralCode?: string;
  affiliateId?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://affiliate.pulseisp.com';
  const adminPartnerUrl = data.affiliateId
    ? `${appUrl}/admin/partners/${data.affiliateId}`
    : `${appUrl}/admin/partners`;

  const fields: SlackField[] = [
    { title: '👤 Partner Name', value: data.name, short: true },
    { title: '📧 Email', value: data.email, short: true },
    { title: '📱 WhatsApp / Phone', value: data.phone || 'N/A', short: true },
    { title: '🏷️ Referral Code', value: data.referralCode ? `\`${data.referralCode}\`` : 'Generated on Approval', short: true },
    { title: '📦 Applied Program', value: data.programName || 'Standard Partner Program', short: true },
    { title: '🌐 Promotion Channel', value: data.promotionMethod || data.website || 'Direct Referral / Community', short: true },
  ];

  return sendSlackMessage({
    channel: 'pending-approval',
    text: `⏳ *[New Partner Awaiting Approval]* *${data.name}* (${data.email})`,
    attachments: [
      {
        color: '#F59E0B', // Amber / Warning
        title: `⏳ New Partner Application: ${data.name}`,
        title_link: adminPartnerUrl,
        text: `A new partner has registered on PulseISP Affiliate and is awaiting activation.\n👉 *<${adminPartnerUrl}|Review & Approve Partner>*`,
        fields,
        footer: 'PulseISP Affiliate Platform • Partner Onboarding',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

/**
 * 💳 Notify #pending-payout when a payout request is created
 */
export async function notifyPendingPayout(data: {
  partnerName: string;
  email: string;
  amountCents: number;
  currency?: string;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  commissionCount?: number;
  payoutId?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://affiliate.pulseisp.com';
  const adminPayoutUrl = `${appUrl}/admin/payouts`;

  const cur = data.currency || 'NGN';
  const formattedAmount = cur === 'NGN'
    ? `₦${(data.amountCents / 100).toLocaleString()}`
    : `$${(data.amountCents / 100).toFixed(2)}`;

  const bankInfo = data.bankName && data.accountNumber
    ? `${data.bankName} • \`${data.accountNumber}\` (${data.accountName || data.partnerName})`
    : 'Bank details pending in profile';

  const fields: SlackField[] = [
    { title: '👤 Partner', value: `${data.partnerName} (${data.email})`, short: true },
    { title: '💵 Payout Amount', value: `*${formattedAmount}*`, short: true },
    { title: '🏦 Bank Account', value: bankInfo, short: false },
    { title: '📊 Commissions Included', value: `${data.commissionCount || 1} conversions`, short: true },
    { title: '⏱️ Status', value: '🟡 PENDING REVIEW', short: true },
  ];

  return sendSlackMessage({
    channel: 'pending-payout',
    text: `💳 *[Payout Request Pending]* *${formattedAmount}* for *${data.partnerName}*`,
    attachments: [
      {
        color: '#3B82F6', // Blue
        title: `💳 Commission Payout Request: ${formattedAmount}`,
        title_link: adminPayoutUrl,
        text: `Partner requested payout. Please verify bank information and transfer status.\n👉 *<${adminPayoutUrl}|Review & Process Payout>*`,
        fields,
        footer: 'PulseISP Affiliate Platform • Payout Processor',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

/**
 * 🚨 Notify #flagged-or-large-commission when high value or suspicious conversions occur
 */
export async function notifyFlaggedOrLargeCommission(data: {
  partnerName: string;
  email: string;
  customerEmail: string;
  orderValueCents: number;
  commissionCents: number;
  currency?: string;
  isFlagged?: boolean;
  reason?: string;
  conversionId?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://affiliate.pulseisp.com';
  const adminConversionUrl = `${appUrl}/admin/conversions`;

  const cur = data.currency || 'NGN';
  const formattedOrder = cur === 'NGN'
    ? `₦${(data.orderValueCents / 100).toLocaleString()}`
    : `$${(data.orderValueCents / 100).toFixed(2)}`;
  const formattedCommission = cur === 'NGN'
    ? `₦${(data.commissionCents / 100).toLocaleString()}`
    : `$${(data.commissionCents / 100).toFixed(2)}`;

  const isFlagged = !!data.isFlagged;
  const color = isFlagged ? '#EF4444' : '#10B981'; // Red if flagged, Green if high-value win
  const icon = isFlagged ? '🚨' : '💎';
  const tag = isFlagged ? '[FLAGGED CONVERSION]' : '[HIGH-VALUE COMMISSION]';

  const fields: SlackField[] = [
    { title: '👤 Affiliate Partner', value: `${data.partnerName} (${data.email})`, short: true },
    { title: '🏢 Converted Customer', value: data.customerEmail, short: true },
    { title: '💵 Order Value', value: formattedOrder, short: true },
    { title: '💰 Commission Earned', value: `*${formattedCommission}*`, short: true },
  ];

  if (data.reason) {
    fields.push({ title: '⚠️ Note / Reason', value: data.reason, short: false });
  }

  return sendSlackMessage({
    channel: 'flagged-or-large-commission',
    text: `${icon} *${tag}* ${formattedCommission} commission from *${data.partnerName}*`,
    attachments: [
      {
        color,
        title: `${icon} ${isFlagged ? 'Flagged Activity Detected' : 'Large Commission Conversion'}: ${formattedCommission}`,
        title_link: adminConversionUrl,
        text: isFlagged
          ? `⚠️ Suspicious attribution or refund flag detected.\n👉 *<${adminConversionUrl}|Audit Conversion Details>*`
          : `🎉 A major customer conversion was credited to partner.\n👉 *<${adminConversionUrl}|View Conversion Details>*`,
        fields,
        footer: 'PulseISP Affiliate Platform • Fraud & Revenue Monitor',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}
