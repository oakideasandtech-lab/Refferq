'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Layers, Plus, Star, Percent, Clock, Globe, Edit, Trash2,
} from 'lucide-react';
import { getCurrencySymbolForCode } from '@/lib/currency';
import { DEFAULT_PROGRAM_LOGO } from '@/lib/logo';

interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  commissionRate: number;
  commissionType: string;
  cookieDuration: number;
  currency: string;
  countryCode?: string;
  countryName?: string;
  isActive: boolean;
  isDefault: boolean;
  autoApprove: boolean;
  minPayoutCents: number;
  payoutFrequency: string;
  termsUrl?: string;
  logoUrl?: string;
  brandColor?: string;
  createdAt: string;
}

const CURRENCY_COUNTRY_MAP: Record<string, { countryCode: string; countryName: string; symbol: string; label: string }> = {
  NGN: { countryCode: 'NG', countryName: 'Nigeria', symbol: '₦', label: 'NGN (₦) - Nigeria' },
  KES: { countryCode: 'KE', countryName: 'Kenya', symbol: 'KSh', label: 'KES (KSh) - Kenya' },
  GHS: { countryCode: 'GH', countryName: 'Ghana', symbol: '₵', label: 'GHS (₵) - Ghana' },
  ZAR: { countryCode: 'ZA', countryName: 'South Africa', symbol: 'R', label: 'ZAR (R) - South Africa' },
  USD: { countryCode: 'US', countryName: 'Global', symbol: '$', label: 'USD ($) - Global' },
  EUR: { countryCode: 'EU', countryName: 'Europe', symbol: '€', label: 'EUR (€) - Europe' },
  GBP: { countryCode: 'GB', countryName: 'United Kingdom', symbol: '£', label: 'GBP (£) - UK' },
};

const emptyForm = {
  name: '', slug: '', description: '', commissionRate: '10', commissionType: 'PERCENTAGE',
  cookieDuration: '30', currency: 'NGN', autoApprove: false, minPayoutCents: '5000',
  payoutFrequency: 'MONTHLY', termsUrl: '', logoUrl: DEFAULT_PROGRAM_LOGO, brandColor: '#F97316',
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/admin/programs');
      const data = await res.json();
      if (data.success) setPrograms(data.programs || []);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Program) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      commissionRate: String(p.commissionRate), commissionType: p.commissionType,
      cookieDuration: String(p.cookieDuration), currency: p.currency || 'NGN',
      autoApprove: p.autoApprove,
      minPayoutCents: String(Math.round(p.minPayoutCents / 100)),
      payoutFrequency: p.payoutFrequency, termsUrl: p.termsUrl || '',
      logoUrl: p.logoUrl || DEFAULT_PROGRAM_LOGO, brandColor: p.brandColor || '#F97316',
    });
    setDialogOpen(true);
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setForm(prev => ({
      ...prev,
      currency: currencyCode,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const mapped = CURRENCY_COUNTRY_MAP[form.currency] || { countryCode: 'NG', countryName: 'Nigeria' };

      const body: any = {
        name: form.name, slug: form.slug, description: form.description || null,
        commissionRate: parseFloat(form.commissionRate), commissionType: form.commissionType,
        cookieDuration: parseInt(form.cookieDuration), currency: form.currency,
        countryCode: mapped.countryCode, countryName: mapped.countryName,
        autoApprove: form.autoApprove,
        minPayoutCents: Math.round(parseFloat(form.minPayoutCents) * 100),
        payoutFrequency: form.payoutFrequency,
        termsUrl: form.termsUrl || null, logoUrl: form.logoUrl || null,
        brandColor: form.brandColor || null,
      };
      if (editing) body.id = editing.id;

      const res = await fetch('/api/admin/programs', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPrograms();
        setDialogOpen(false);
      } else {
        alert(data.error || 'Failed to save program');
      }
    } catch (error) {
      console.error('Save program error:', error);
      alert('Failed to save program');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      if (res.ok) {
        setPrograms(prev => prev.map(p => p.id === id ? { ...p, isActive } : p));
      }
    } catch (error) {
      console.error('Failed to toggle program active state:', error);
    }
  };

  const setDefault = async (id: string) => {
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      });
      if (res.ok) await fetchPrograms();
    } catch (error) {
      console.error('Failed to set default program:', error);
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
      const res = await fetch(`/api/admin/programs?id=${id}`, { method: 'DELETE' });
      if (res.ok) await fetchPrograms();
    } catch (error) {
      console.error('Failed to delete program:', error);
    }
  };

  const stats = {
    total: programs.length,
    active: programs.filter(p => p.isActive).length,
    defaultProgram: programs.find(p => p.isDefault),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const currentSymbol = getCurrencySymbolForCode(form.currency);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Programs</h1>
          <p className="text-sm text-muted-foreground">Configure commission rates, cookie durations, and payout rules per program</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Program
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Default Program</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-lg font-bold truncate">{stats.defaultProgram?.name || 'Not set'}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Programs</CardTitle>
          <CardDescription>Configure commission rates, cookie durations, and payout rules per program</CardDescription>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No programs yet</h3>
              <p className="text-sm text-muted-foreground">Create your first affiliate program</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Cookie</TableHead>
                  <TableHead>Min Payout</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Auto-Approve</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.brandColor && (
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.brandColor }} />
                        )}
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">/{p.slug}</p>
                        </div>
                        {p.isDefault && <Badge variant="secondary" className="text-xs ml-1">Default</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-semibold">{p.commissionRate}%</span>
                        <span className="text-muted-foreground font-mono uppercase">({p.commissionType})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {p.cookieDuration}d
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {getCurrencySymbolForCode(p.currency)}{(p.minPayoutCents / 100).toLocaleString()}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs uppercase">{p.payoutFrequency}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={p.autoApprove ? 'default' : 'outline'} className="text-xs">
                        {p.autoApprove ? 'Yes' : 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={p.isActive} onCheckedChange={v => toggleActive(p.id, v)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!p.isDefault && (
                          <Button variant="ghost" size="sm" onClick={() => setDefault(p.id)}>
                            <Star className="h-3 w-3 mr-1" />Set Default
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!p.isDefault && (
                          <Button variant="ghost" size="icon" onClick={() => deleteProgram(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Program Dialog — Matches User Screenshot Layout */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Program' : 'Create Program'}</DialogTitle>
            <DialogDescription>{editing ? 'Update program configuration' : 'Set up a new affiliate program'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Program Name *</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nigeria Expansion" />
              </div>
              <div className="grid gap-2">
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} placeholder="ng-affiliate" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Affiliate Program for Nigerian Installers" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Commission Rate (%)</Label>
                <Input type="number" value={form.commissionRate} onChange={e => setForm({...form, commissionRate: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Commission Type</Label>
                <Select value={form.commissionType} onValueChange={v => setForm({...form, commissionType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cookie Duration (days)</Label>
                <Input type="number" value={form.cookieDuration} onChange={e => setForm({...form, cookieDuration: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_COUNTRY_MAP).map(([code, meta]) => (
                      <SelectItem key={code} value={code}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Min Payout ({currentSymbol})</Label>
                <Input type="number" min="0" value={form.minPayoutCents} onChange={e => setForm({...form, minPayoutCents: e.target.value})} placeholder="5000" />
              </div>
              <div className="grid gap-2">
                <Label>Payout Frequency</Label>
                <Select value={form.payoutFrequency} onValueChange={v => setForm({...form, payoutFrequency: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Brand Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={form.brandColor} onChange={e => setForm({...form, brandColor: e.target.value})} className="w-14 h-10 p-1" />
                  <Input value={form.brandColor} onChange={e => setForm({...form, brandColor: e.target.value})} className="flex-1 font-mono" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Logo URL</Label>
                <Input value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} placeholder="https://www.pulseisp.com/logo-with-identity.png" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Terms URL</Label>
              <Input value={form.termsUrl} onChange={e => setForm({...form, termsUrl: e.target.value})} placeholder="https://www.pulseisp.com/terms" />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch checked={form.autoApprove as boolean} onCheckedChange={v => setForm({...form, autoApprove: v})} />
              <Label>Auto-approve new affiliates</Label>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.slug}>
              {saving ? 'Saving...' : editing ? 'Update Program' : 'Create Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
