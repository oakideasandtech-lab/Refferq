'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NIGERIAN_BANKS } from '@/lib/nigeria-banks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Building2,
  Mail,
  Globe,
  CreditCard,
  Shield,
  CheckCircle2,
  AlertCircle,
  Key,
  Copy,
  Check,
  Smartphone,
  Landmark,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [programCurrency, setProgramCurrency] = useState('NGN');
  const [currencySymbol, setCurrencySymbol] = useState('₦');
  const [countryName, setCountryName] = useState('Nigeria');

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    company: '',
    email: '',
    country: 'Nigeria',
    paymentMethod: 'Bank Transfer',
    bankName: '',
    accountName: '',
    accountNumber: '',
  });

  useEffect(() => {
    if (!authLoading && user) loadProfile();
  }, [authLoading, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/affiliate/profile');
      const data = await res.json();
      if (data.success) {
        const pd = data.affiliate?.payoutDetails || {};
        const curr = data.currency || data.program?.currency || 'NGN';
        setReferralCode(data.affiliate?.referralCode || '');
        setProgramCurrency(curr);
        setCurrencySymbol(data.currencySymbol || '₦');
        setCountryName(data.countryName || (curr === 'NGN' ? 'Nigeria' : curr === 'KES' ? 'Kenya' : 'Global'));

        let defaultMethod = pd.paymentMethod || 'Bank Transfer';
        if (curr === 'KES' && !pd.paymentMethod) defaultMethod = 'M-Pesa';
        if (curr === 'GHS' && !pd.paymentMethod) defaultMethod = 'MTN Mobile Money';
        if (curr === 'USD' && !pd.paymentMethod) defaultMethod = 'PayPal';

        setSettingsForm({
          name: data.user?.name || user?.name || '',
          company: pd.company || '',
          email: data.user?.email || user?.email || '',
          country: data.countryName || 'Nigeria',
          paymentMethod: defaultMethod,
          bankName: data.affiliate?.bankName || pd.bankName || '',
          accountName: data.affiliate?.accountName || pd.accountName || '',
          accountNumber: data.affiliate?.accountNumber || pd.accountNumber || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // FRONTEND CONDITIONAL COMPULSORY VALIDATION
    if (programCurrency === 'NGN') {
      if (!settingsForm.bankName.trim()) {
        showNotification('error', 'Bank Name is required for Nigerian bank transfers');
        return;
      }
      if (!settingsForm.accountName.trim()) {
        showNotification('error', 'Account Name is required for Nigerian bank transfers');
        return;
      }
      if (!settingsForm.accountNumber.trim()) {
        showNotification('error', '10-Digit Account Number is required for Nigerian bank transfers');
        return;
      }
    } else if (programCurrency === 'KES') {
      if (settingsForm.paymentMethod === 'M-Pesa') {
        if (!settingsForm.accountNumber.trim()) {
          showNotification('error', 'M-Pesa Phone Number is required');
          return;
        }
        if (!settingsForm.accountName.trim()) {
          showNotification('error', 'Registered M-Pesa Name is required');
          return;
        }
      } else {
        if (!settingsForm.bankName.trim() || !settingsForm.accountName.trim() || !settingsForm.accountNumber.trim()) {
          showNotification('error', 'Bank Name, Account Name, and Account Number are required for KES Bank Transfer');
          return;
        }
      }
    } else {
      if (!settingsForm.accountName.trim() || !settingsForm.accountNumber.trim()) {
        showNotification('error', 'Account Holder Name and Account/PayPal ID are required');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/affiliate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'Payment & profile settings updated successfully!');
      } else {
        showNotification('error', data.error || 'Failed to update settings');
      }
    } catch (_e) {
      showNotification('error', 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const res = await fetch('/api/affiliate/generate-code', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Referral code generated!');
        loadProfile();
      } else {
        showNotification('error', 'Failed to generate code: ' + data.error);
      }
    } catch (_e) {
      showNotification('error', 'Failed to generate code');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
          {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account & Payout Settings</h1>
        <p className="text-muted-foreground text-sm">
          Target Program: <span className="font-semibold text-foreground">{countryName} ({programCurrency} • {currencySymbol})</span>
        </p>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            Referral Code
          </CardTitle>
          <CardDescription>Your unique affiliate tracking code</CardDescription>
        </CardHeader>
        <CardContent>
          {referralCode ? (
            <div className="flex items-center gap-2">
              <Input readOnly value={referralCode} className="font-mono max-w-xs" />
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No referral code generated yet.</p>
              <Button onClick={handleGenerateCode}>Generate Code</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Personal Details
          </CardTitle>
          <CardDescription>Manage your contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Full Name
              </Label>
              <Input
                value={settingsForm.name}
                onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                placeholder="Samuel Adebayo"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Company / Social Website
              </Label>
              <Input
                value={settingsForm.company}
                onChange={(e) => setSettingsForm({ ...settingsForm, company: e.target.value })}
                placeholder="e.g. Adebayo Tech Solutions"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </Label>
              <Input
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                placeholder="samuel@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Program Market
              </Label>
              <Input value={`${countryName} (${programCurrency})`} readOnly className="bg-muted font-semibold" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Payment & Payout Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Payout & Withdrawal Account
          </CardTitle>
          <CardDescription>
            Configure how you receive payouts in <span className="font-semibold text-foreground">{countryName} ({programCurrency})</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* NIGERIA (NGN) PAYOUT FIELDS */}
          {programCurrency === 'NGN' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Input value="NGN Direct Bank Transfer (NUBAN)" readOnly className="bg-muted font-medium" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Select
                    value={settingsForm.bankName}
                    onValueChange={(v) => setSettingsForm({ ...settingsForm, bankName: v })}
                  >
                    <SelectTrigger id="bankName">
                      <SelectValue placeholder="Select Nigerian Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    value={settingsForm.accountName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accountName: e.target.value })}
                    placeholder="e.g. Samuel Adebayo"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber">Account Number (NUBAN) *</Label>
                  <Input
                    id="accountNumber"
                    value={settingsForm.accountNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="10-digit NUBAN number"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* KENYA (KES) PAYOUT FIELDS */}
          {programCurrency === 'KES' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Payment Method *</Label>
                <Select
                  value={settingsForm.paymentMethod}
                  onValueChange={(v) => setSettingsForm({ ...settingsForm, paymentMethod: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Payment Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M-Pesa">Safaricom M-Pesa Mobile Money</SelectItem>
                    <SelectItem value="Bank Transfer">KES Direct Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settingsForm.paymentMethod === 'M-Pesa' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5 text-green-600" /> M-Pesa Registered Phone Number *
                    </Label>
                    <Input
                      value={settingsForm.accountNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                      placeholder="e.g. +254 712 345 678"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Registered M-Pesa Name *</Label>
                    <Input
                      value={settingsForm.accountName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, accountName: e.target.value })}
                      placeholder="e.g. Samuel Kamau"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Bank Name *</Label>
                    <Input
                      value={settingsForm.bankName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                      placeholder="e.g. Equity Bank / KCB"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account Name *</Label>
                    <Input
                      value={settingsForm.accountName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, accountName: e.target.value })}
                      placeholder="Account holder name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account Number *</Label>
                    <Input
                      value={settingsForm.accountNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                      placeholder="Bank account number"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GHANA (GHS) PAYOUT FIELDS */}
          {programCurrency === 'GHS' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Mobile Money / Payout Provider *</Label>
                <Select
                  value={settingsForm.paymentMethod}
                  onValueChange={(v) => setSettingsForm({ ...settingsForm, paymentMethod: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Provider" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN Mobile Money">MTN Mobile Money (MoMo)</SelectItem>
                    <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
                    <SelectItem value="AirtelTigo Money">AirtelTigo Money</SelectItem>
                    <SelectItem value="Bank Transfer">GHS Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Phone / Account Number *</Label>
                  <Input
                    value={settingsForm.accountNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                    placeholder="e.g. +233 24 123 4567"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Registered Account Name *</Label>
                  <Input
                    value={settingsForm.accountName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accountName: e.target.value })}
                    placeholder="e.g. Kwame Mensah"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* GLOBAL / USD PAYOUT FIELDS */}
          {programCurrency !== 'NGN' && programCurrency !== 'KES' && programCurrency !== 'GHS' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Payout Gateway *</Label>
                <Select
                  value={settingsForm.paymentMethod}
                  onValueChange={(v) => setSettingsForm({ ...settingsForm, paymentMethod: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Payout Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Wise">Wise Transfer</SelectItem>
                    <SelectItem value="Wire / IBAN">Bank Wire (IBAN/SWIFT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>PayPal / Wise Email or IBAN *</Label>
                  <Input
                    value={settingsForm.accountNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                    placeholder="email@example.com or IBAN"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Holder Full Name *</Label>
                  <Input
                    value={settingsForm.accountName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accountName: e.target.value })}
                    placeholder="Full legal name"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <Separator />

          <Alert>
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              Your payment information is encrypted securely. Payouts in {countryName} are processed in <span className="font-semibold text-foreground">{programCurrency} ({currencySymbol})</span> according to your program terms.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
          {saving ? 'Saving...' : 'Save Payout Details'}
        </Button>
      </div>
    </div>
  );
}
