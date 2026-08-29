'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Zap,
  TrendingUp,
  Percent,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useRecaptcha } from '@/hooks/useRecaptcha';

import { getCountryByCurrency, validateCountryPhone, formatAndTruncatePhone, WORLD_COUNTRIES } from '@/lib/countries';

type Step = 'details' | 'otp' | 'success';

interface ProgramItem {
  id: string;
  name: string;
  slug: string;
  currency: string;
  countryCode?: string;
  countryName?: string;
  commissionRate: number;
  isDefault: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const { verifyRecaptcha } = useRecaptcha('register');

  const [step, setStep] = useState<Step>('details');
  const [activePrograms, setActivePrograms] = useState<ProgramItem[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    promotionMethod: 'installers',
    agreeTerms: false,
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    async function loadActivePrograms() {
      try {
        const res = await fetch('/api/programs/public');
        const data = await res.json();
        if (data.success && data.programs) {
          setActivePrograms(data.programs);
          const defaultProg = data.programs.find((p: ProgramItem) => p.isDefault) || data.programs[0];
          if (defaultProg) {
            setSelectedProgramId(defaultProg.id);
            const countryConfig = getCountryByCurrency(defaultProg.currency);
            setFormData(prev => ({ ...prev, phone: `${countryConfig.phonePrefix} ` }));
          }
        }
      } catch (err) {
        console.error('Failed to load active programs:', err);
      }
    }
    loadActivePrograms();
  }, []);

  const selectedProg = activePrograms.find(p => p.id === selectedProgramId);
  const countryConfig = getCountryByCurrency(selectedProg?.currency || 'NGN');

  const handleCountryChange = (newProgramId: string) => {
    setSelectedProgramId(newProgramId);
    const newProg = activePrograms.find(p => p.id === newProgramId);
    const newConfig = getCountryByCurrency(newProg?.currency || 'NGN');

    setFormData(prev => {
      let currentPhone = prev.phone.trim();
      let localDigits = currentPhone;
      Object.values(WORLD_COUNTRIES).forEach(c => {
        if (localDigits.startsWith(c.phonePrefix)) {
          localDigits = localDigits.slice(c.phonePrefix.length).trim();
        }
      });

      return {
        ...prev,
        phone: localDigits ? `${newConfig.phonePrefix} ${localDigits}` : `${newConfig.phonePrefix} `,
      };
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!formData.promotionMethod || !formData.promotionMethod.trim()) {
      setError('Please select how you will promote PulseISP.');
      return;
    }

    const currentProg = activePrograms.find(p => p.id === selectedProgramId);
    const activeCountry = getCountryByCurrency(currentProg?.currency || 'NGN');
    const phoneValidation = validateCountryPhone(formData.phone, activeCountry);

    if (!phoneValidation.valid) {
      setError(phoneValidation.error || 'Invalid phone number format.');
      return;
    }

    if (!formData.agreeTerms) {
      setError('You must agree to the Affiliate Partner Terms & Conditions.');
      return;
    }

    setLoading(true);

    try {
      // 1. reCAPTCHA v3 Bot Protection Check
      const isHuman = await verifyRecaptcha();
      if (!isHuman) {
        setError('Security check failed. Please refresh and try again.');
        setLoading(false);
        return;
      }

      // 2. Register the user with partner details & assigned program
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim(),
          phone: phoneValidation.formatted || formData.phone.trim(),
          website: formData.website.trim(),
          promotionMethod: formData.promotionMethod,
          programId: selectedProgramId || undefined,
          role: 'AFFILIATE',
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.message || 'Registration failed');
        setLoading(false);
        return;
      }

      // 3. Send OTP
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() }),
      });

      const otpData = await otpRes.json();

      if (otpRes.ok) {
        setStep('otp');
        setMessage('Account created! A 6-digit verification code has been sent to your email.');
      } else {
        setStep('otp');
        setError(otpData.error || 'Failed to send code. Click resend to try again.');
      }
    } catch (_e) {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email.trim(), code: otp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStep('success');
        setTimeout(() => {
          const user = data.user;
          if (user.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/affiliate');
          }
        }, 1500);
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (_e) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() }),
      });

      if (res.ok) {
        setMessage('A new 6-digit code has been sent to your email.');
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } catch (_e) {
      setError('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Hero Panel: Value Proposition & Partner Benefits */}
        <div className="lg:col-span-5 space-y-6 text-foreground hidden lg:block">
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <img
                src="/logo-with-identity.png"
                alt="PulseISP"
                className="h-14 w-auto object-contain"
              />
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Partner with PulseISP & Grow Your Revenue 🚀
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Earn generous recurring commissions by referring ISPs, internet providers, and MikroTik operators to PulseISP.
            </p>
          </div>

          {/* Perks list */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">10% Recurring Commission</h4>
                <p className="text-xs text-muted-foreground">Earn on every subscriber plan renewal your referred ISPs make.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">30-Day Tracking Window</h4>
                <p className="text-xs text-muted-foreground">Clicks are tracked for 30 days — earn commissions even if they convert later.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Monthly Auto Payouts in Your Currency</h4>
                <p className="text-xs text-muted-foreground">Direct automated payouts straight to your local bank account or mobile wallet.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 space-y-1 text-xs">
            <p className="font-medium text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Built for Installers & Tech Consultants
            </p>
            <p className="text-muted-foreground">
              Ideal for MikroTik engineers, network installers, and tech agencies setting up ISP clients across Nigeria.
            </p>
          </div>
        </div>

        {/* Right Form Panel: Account Registration */}
        <div className="lg:col-span-7 w-full max-w-md mx-auto lg:max-w-none">
          <Card className="border shadow-lg">
            
            {/* Mobile Header Logo */}
            <div className="lg:hidden text-center pt-6 px-6">
              <img
                src="/logo-with-identity.png"
                alt="PulseISP"
                className="mx-auto h-12 w-auto object-contain"
              />
            </div>

            {step === 'details' && (
              <>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Create Partner Account</CardTitle>
                  <CardDescription>
                    Join the PulseISP affiliate network and start generating referral links
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="e.g. Samuel Adebayo"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="samuel@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    {/* Dynamic Country Selector (Mapped from Active Programs) */}
                    {activePrograms.length > 0 && (
                      <div className="space-y-1.5">
                        <Label htmlFor="program">Country / Regional Program *</Label>
                        <Select
                          value={selectedProgramId}
                          onValueChange={(v) => handleCountryChange(v)}
                        >
                          <SelectTrigger id="program">
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent>
                            {activePrograms.map((prog) => {
                              const meta = getCountryByCurrency(prog.currency);
                              return (
                                <SelectItem key={prog.id} value={prog.id}>
                                  {meta.flag} {meta.name} — {prog.name} ({prog.currency} • {prog.commissionRate}% Commission)
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Phone Number (WhatsApp) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number (WhatsApp) *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={countryConfig.placeholder}
                          value={formData.phone}
                          maxLength={countryConfig.phonePrefix.length + countryConfig.nationalDigits + 4}
                          onChange={(e) => {
                            // Strip letters & strictly truncate digits beyond country limit in real-time
                            const truncatedVal = formatAndTruncatePhone(e.target.value, countryConfig);
                            setFormData({ ...formData, phone: truncatedVal });
                          }}
                          className="pl-9 font-mono text-sm"
                          required
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                        <span>Standard format: <strong className="text-foreground">{countryConfig.sampleFormat}</strong></span>
                        {formData.phone.replace(/\D/g, '').length > 0 && (
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            formData.phone.replace(/\D/g, '').length === (formData.phone.trim().startsWith('+') ? (countryConfig.phonePrefix.replace(/\D/g, '').length + countryConfig.nationalDigits) : countryConfig.localDigitCount) ||
                            formData.phone.replace(/\D/g, '').length === countryConfig.nationalDigits
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {formData.phone.replace(/\D/g, '').length} digits
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Website / Social Channel / Company */}
                    <div className="space-y-1.5">
                      <Label htmlFor="website">Website / Social Channel / Company</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website"
                          type="text"
                          placeholder="e.g. www.mycompany.ng or @techchannel"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Promotion Method */}
                    <div className="space-y-1.5">
                      <Label htmlFor="promotionMethod">How will you promote PulseISP? *</Label>
                      <Select
                        value={formData.promotionMethod}
                        onValueChange={(v) => setFormData({ ...formData, promotionMethod: v })}
                      >
                        <SelectTrigger id="promotionMethod">
                          <SelectValue placeholder="Select primary promotion channel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="installers">Client Consultations & ISP Setup</SelectItem>
                          <SelectItem value="youtube">YouTube / Video Content</SelectItem>
                          <SelectItem value="blog">Tech Blog / Website</SelectItem>
                          <SelectItem value="social">Social Media (Twitter/X, LinkedIn, Facebook)</SelectItem>
                          <SelectItem value="email">Email List / Community</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Terms & Conditions Checkbox */}
                    <div className="flex items-start space-x-2 pt-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, agreeTerms: checked === true })
                        }
                      />
                      <label
                        htmlFor="terms"
                        className="text-xs text-muted-foreground leading-tight cursor-pointer"
                      >
                        I agree to the <Link href="/terms" target="_blank" className="text-primary underline">Affiliate Partner Terms & Conditions</Link> and <Link href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</Link>.
                      </label>
                    </div>

                  </CardContent>
                  <CardFooter className="flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={loading || !formData.name || !formData.email || !formData.phone || !formData.agreeTerms}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {loading ? 'Creating Partner Account...' : 'Join Partner Network'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Already have an account?{' '}
                      <Link href="/login" className="text-primary font-medium hover:underline">
                        Sign in here
                      </Link>
                    </p>
                  </CardFooter>
                </form>
              </>
            )}

            {step === 'otp' && (
              <>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Verify your email</CardTitle>
                  <CardDescription className="text-xs">
                    Enter the 6-digit verification code sent to <span className="font-medium text-foreground">{formData.email}</span>
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleVerifyOTP}>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription className="text-xs">{error}</AlertDescription>
                      </Alert>
                    )}
                    {message && (
                      <Alert>
                        <AlertDescription className="text-xs text-green-600">{message}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex justify-center py-2">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={loading || otp.length < 6}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      )}
                      {loading ? 'Verifying...' : 'Verify & Launch Portal'}
                    </Button>
                    <div className="flex items-center justify-between w-full pt-2 text-xs">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStep('details');
                          setOtp('');
                          setError('');
                          setMessage('');
                        }}
                      >
                        <ArrowLeft className="mr-1 h-3 w-3" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResendOTP}
                        disabled={loading}
                      >
                        Resend Code
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              </>
            )}

            {step === 'success' && (
              <CardContent className="py-12 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl">Account Verified!</CardTitle>
                <CardDescription className="text-sm">
                  Welcome to the PulseISP Partner Network. Redirecting to your affiliate dashboard...
                </CardDescription>
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mt-4" />
              </CardContent>
            )}

          </Card>
        </div>

      </div>
    </div>
  );
}
