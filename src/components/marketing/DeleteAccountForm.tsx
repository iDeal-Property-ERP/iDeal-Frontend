'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  MessageSquare,
  Phone,
  Send,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmAccountDeletion, requestDeletionOtp } from '@/libs/accountDeletion';
import { ApiError_ } from '@/libs/api';
import { cn } from '@/libs/utils';
import type { AccountDeletionChannel } from '@/types/accountDeletion';

type FormStep = 'phone' | 'otp' | 'success';

/**
 * Public account and data deletion form with phone OTP verification.
 * @returns The interactive deletion form component.
 */
export function DeleteAccountForm() {
  const t = useTranslations('DeleteAccountPage');
  const [step, setStep] = useState<FormStep>('phone');
  const [phone, setPhone] = useState('+998');
  const [channel, setChannel] = useState<AccountDeletionChannel>('telegram');
  const [code, setCode] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [resendCountdown]);

  const handlePhoneChange = (val: string) => {
    setErrorMessage(null);
    let cleaned = val.replaceAll(/[^\d+]/gu, '');
    if (!cleaned.startsWith('+998') && !cleaned.startsWith('+')) {
      if (cleaned.startsWith('998')) {
        cleaned = `+${cleaned}`;
      } else if (cleaned.length > 0) {
        cleaned = `+998${cleaned.replace(/^0+/u, '')}`;
      } else {
        cleaned = '+998';
      }
    }
    setPhone(cleaned);
  };

  const handleRequestOtp = async () => {
    setErrorMessage(null);
    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone === '+998' || trimmedPhone.length < 12) {
      const err = t('error_phone_required');
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    setIsRequestingOtp(true);
    try {
      const res = await requestDeletionOtp({ phone: trimmedPhone, channel });
      setResendCountdown(res.resend_after || 60);
      setStep('otp');
      toast.success(
        t('otp_sent_notice', {
          phone: trimmedPhone,
          channel: channel === 'telegram' ? t('channel_telegram') : t('channel_sms'),
        }),
      );
    } catch (error: unknown) {
      if (error instanceof ApiError_) {
        if (error.status === 404) {
          const msg = t('error_user_not_found');
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }
        if (error.status === 429) {
          const msg = t('error_too_many_attempts');
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }
      }
      const msg = t('error_generic');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleConfirmDeletion = async () => {
    setErrorMessage(null);
    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length !== 6) {
      const err = t('error_code_required');
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    setConfirmDialogOpen(false);
    setIsDeleting(true);
    try {
      const res = await confirmAccountDeletion({ phone: phone.trim(), code: trimmedCode });
      if (res.deleted) {
        setStep('success');
        toast.success(t('success_title'));
      }
    } catch (error: unknown) {
      if (error instanceof ApiError_) {
        if (error.status === 400) {
          const msg = t('error_invalid_code');
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }
        if (error.status === 429) {
          const msg = t('error_too_many_attempts');
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }
        if (error.status === 404) {
          const msg = t('error_user_not_found');
          setErrorMessage(msg);
          toast.error(msg);
          return;
        }
      }
      const msg = t('error_generic');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (step === 'success') {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-8" />
          </div>
          <CardTitle className="font-display text-2xl font-bold text-foreground">
            {t('success_title')}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {t('success_body')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-xl font-bold text-foreground sm:text-2xl">
          {t('form_title')}
        </CardTitle>
        <CardDescription>{t('intro')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'phone' ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone-input" className="text-sm font-medium text-foreground">
                {t('phone_label')}
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone-input"
                  type="tel"
                  placeholder={t('phone_placeholder')}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-9"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t('channel_label')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChannel('telegram')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition',
                    channel === 'telegram'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
                  )}
                >
                  <Send className="size-4" />
                  <span>{t('channel_telegram')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition',
                    channel === 'sms'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
                  )}
                >
                  <MessageSquare className="size-4" />
                  <span>{t('channel_sms')}</span>
                </button>
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={isRequestingOtp}
              onClick={handleRequestOtp}
            >
              {isRequestingOtp ? t('sending_code') : t('send_code')}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
              <p>
                {t('otp_sent_notice', {
                  phone,
                  channel: channel === 'telegram' ? t('channel_telegram') : t('channel_sms'),
                })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setErrorMessage(null);
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                <ArrowLeft className="size-3" />
                {t('change_phone')}
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp-input" className="text-sm font-medium text-foreground">
                {t('code_label')}
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder={t('code_placeholder')}
                  value={code}
                  onChange={(e) => {
                    setErrorMessage(null);
                    setCode(e.target.value.replaceAll(/\D/gu, ''));
                  }}
                  className="pl-9 font-mono tracking-widest"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              {resendCountdown > 0 ? (
                <span className="text-muted-foreground">
                  {t('resend_in', { seconds: resendCountdown })}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={isRequestingOtp}
                  className="font-medium text-primary hover:underline"
                >
                  {t('resend_code')}
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="destructive"
              className="w-full gap-2"
              disabled={isDeleting || code.trim().length !== 6}
              onClick={() => setConfirmDialogOpen(true)}
            >
              <Trash2 className="size-4" />
              {isDeleting ? t('deleting') : t('delete_button')}
            </Button>

            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="size-5" />
                    {t('confirm_dialog_title')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t('confirm_dialog_desc')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('confirm_dialog_cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleConfirmDeletion}
                    disabled={isDeleting}
                  >
                    {t('confirm_dialog_confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
