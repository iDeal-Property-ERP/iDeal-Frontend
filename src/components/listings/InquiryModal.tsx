'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { postInquiry } from '@/libs/marketplace';

/**
 * "Message iDeal" general-inquiry dialog (public).
 * @param props - The listing id and the trigger element.
 * @returns The inquiry dialog.
 */
export function InquiryModal(props: { listingId: number; trigger: React.ReactNode }) {
  const { listingId, trigger } = props;
  const t = useTranslations('Inquiry');
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!(fullName && phone && message)) {
      toast.error(t('error_required'));
      return;
    }
    setSubmitting(true);
    try {
      await postInquiry({ listing_id: listingId, full_name: fullName, phone, message });
      toast.success(t('success'));
      setOpen(false);
      setFullName('');
      setPhone('');
      setMessage('');
    } catch {
      toast.error(t('error_generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder={t('full_name')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            placeholder={t('phone')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
          />
          <Textarea
            placeholder={t('message')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <Button className="w-full" disabled={submitting} onClick={submit}>
            {submitting ? t('submitting') : t('send')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
