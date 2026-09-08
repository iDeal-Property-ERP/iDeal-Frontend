'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  MessageSquare,
  RotateCcw,
  Send,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiError_ } from '@/libs/api';
import { submitSupportInquiry } from '@/libs/support';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

/**
 * Public support and contact form with client validation, honeypot spam protection,
 * and localized success/error handling.
 * @returns The interactive support contact form.
 */
export function SupportContactForm() {
  const t = useTranslations('SupportPage');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setMessage('');
    setWebsiteUrl('');
    setErrorMessage(null);
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || trimmedName.length < 2) {
      const err = t('error_name_required');
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      const err = t('error_email_invalid');
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      const err = t('error_message_too_short');
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    if (trimmedMessage.length > 5000) {
      const err = t('error_message_too_long');
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSupportInquiry({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        website_url: websiteUrl.trim() || undefined,
      });

      setSubmittedEmail(trimmedEmail);
      setIsSuccess(true);
      toast.success(t('toast_success'));
    } catch (error: unknown) {
      if (error instanceof ApiError_ && error.status === 429) {
        const msg = t('error_too_many_requests');
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
      const msg = t('error_generic');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-success/30 bg-success/5 shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-8" />
          </div>
          <CardTitle className="font-display text-2xl font-bold text-foreground">
            {t('success_title')}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('success_desc', { email: submittedEmail })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-xs text-muted-foreground">{t('success_sla_notice')}</p>
          <Button type="button" variant="outline" onClick={resetForm} className="gap-2">
            <RotateCcw className="size-4" />
            {t('send_another')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-xl font-bold text-foreground sm:text-2xl">
          {t('form_title')}
        </CardTitle>
        <CardDescription>{t('form_subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Honeypot field for anti-bot trap */}
          <div className="hidden aria-hidden:hidden" aria-hidden="true">
            <label htmlFor="website-url-field">Leave empty</label>
            <input
              id="website-url-field"
              type="text"
              name="website_url"
              tabIndex={-1}
              autoComplete="off"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-name" className="text-sm font-medium text-foreground">
              {t('name_label')}
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="support-name"
                type="text"
                placeholder={t('name_placeholder')}
                value={name}
                onChange={(e) => {
                  setErrorMessage(null);
                  setName(e.target.value);
                }}
                className="pl-9"
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-email" className="text-sm font-medium text-foreground">
              {t('email_label')}
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="support-email"
                type="email"
                placeholder={t('email_placeholder')}
                value={email}
                onChange={(e) => {
                  setErrorMessage(null);
                  setEmail(e.target.value);
                }}
                className="pl-9"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="support-message" className="text-sm font-medium text-foreground">
                {t('message_label')}
              </Label>
              <span className="text-xs text-muted-foreground">{message.length} / 5000</span>
            </div>
            <div className="relative">
              <Textarea
                id="support-message"
                placeholder={t('message_placeholder')}
                value={message}
                onChange={(e) => {
                  setErrorMessage(null);
                  setMessage(e.target.value);
                }}
                maxLength={5000}
                className="min-h-32 resize-y"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <MessageSquare className="size-4 animate-pulse" />
                <span>{t('sending')}</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>{t('submit_button')}</span>
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
