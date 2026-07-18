'use client';

import {
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Download,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ManagementPageContainer } from '@/components/management/ManagementPageContainer';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getBrokerageCommissionStats,
  listOneOffDeals,
  closeOneOffDealLost,
  closeOneOffDealWon,
  recordOneOffReceipt,
  uploadOneOffReceiptAttachments,
} from '@/libs/management/oneOffDealsAdapter';
import type { BrokerageCommissionStats, OneOffDeal } from '@/types/management';

const BROKERAGE_TAB_LABELS = {
  all: 'brokerage',
  pending: 'brokerage_unpaid',
  received: 'brokerage_received',
} as const;

/**
 * Formats a UZS amount for the management workbench.
 *
 * @param value The numeric value returned by the API.
 * @returns The localized whole-number amount.
 */
function formatUzbekSum(value: string): string {
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Number(value));
}

function commissionLabel(deal: OneOffDeal, t: ReturnType<typeof useTranslations>): string {
  if (deal.commission_amount) {
    return `${deal.commission_amount} ${deal.commission_currency}`;
  }
  if (deal.commission_type === 'none') {
    return t('brokerage_commission_none');
  }
  return '—';
}

function receiptCell(
  deal: OneOffDeal,
  t: ReturnType<typeof useTranslations>,
  onReceipt: (deal: OneOffDeal) => void,
): React.ReactNode {
  if (deal.receipt) {
    return <span className="text-xs text-muted-foreground">{deal.receipt.method}</span>;
  }
  if (deal.status === 'closed_won') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 rounded-md px-2 text-xs"
        onClick={() => onReceipt(deal)}
      >
        {t('brokerage_receipt')}
      </Button>
    );
  }
  return <Badge variant="warning">{t('brokerage_pending_badge')}</Badge>;
}

function actionCell(
  deal: OneOffDeal,
  t: ReturnType<typeof useTranslations>,
  onClose: (deal: OneOffDeal) => void,
): React.ReactNode {
  if (deal.status === 'active' || deal.status === 'paused') {
    return (
      <Button size="sm" onClick={() => onClose(deal)}>
        {t('brokerage_close_deal')}
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="icon" className="size-7">
      <MoreHorizontal className="size-4" />
    </Button>
  );
}

function renderDealTable(
  loading: boolean,
  deals: OneOffDeal[],
  t: ReturnType<typeof useTranslations>,
  onReceipt: (deal: OneOffDeal) => void,
  onClose: (deal: OneOffDeal) => void,
): React.ReactNode {
  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">{t('loading')}</div>;
  }
  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <CircleDollarSign className="size-8 text-muted-foreground" />
        <h2 className="font-semibold text-foreground">{t('brokerage_no_deals')}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t('brokerage_no_deals_desc')}</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
          <tr>
            <th className="w-10 px-4 py-3" />
            <th className="px-3 py-3">{t('brokerage_deal')}</th>
            <th className="px-3 py-3">{t('brokerage_property')}</th>
            <th className="px-3 py-3">{t('brokerage_closed_date')}</th>
            <th className="px-3 py-3">{t('brokerage_amount')}</th>
            <th className="px-5 py-3">{t('brokerage_receipt')}</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="h-14 border-b last:border-0 hover:bg-primary-subtle/40">
              <td className="px-4 py-2">
                <span className="grid size-4 place-items-center rounded border border-border" />
              </td>
              <td className="px-3 py-2 font-medium text-foreground">{deal.seller_name}</td>
              <td className="px-3 py-2 font-medium text-foreground">{deal.property_name}</td>
              <td className="px-3 py-2 text-muted-foreground">{deal.close_date ?? '—'}</td>
              <td className="px-3 py-2 font-medium text-foreground">{commissionLabel(deal, t)}</td>
              <td className="px-5 py-2">{receiptCell(deal, t, onReceipt)}</td>
              <td className="px-4 py-2 text-right">{actionCell(deal, t, onClose)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders the finance workbench for staff-operated one-off brokerage revenue.
 *
 * @returns The brokerage commissions page.
 */
export default function BrokerageCommissionsPage() {
  const t = useTranslations('Management');
  const [deals, setDeals] = useState<OneOffDeal[]>([]);
  const [stats, setStats] = useState<BrokerageCommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiptTarget, setReceiptTarget] = useState<OneOffDeal | null>(null);
  const [closeTarget, setCloseTarget] = useState<OneOffDeal | null>(null);
  const [closeOutcome, setCloseOutcome] = useState<'won' | 'lost'>('won');
  const [renterName, setRenterName] = useState('');
  const [renterPhone, setRenterPhone] = useState('');
  const [agreedRent, setAgreedRent] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [savingClose, setSavingClose] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [receiptMethod, setReceiptMethod] = useState('cash');
  const [receiptReference, setReceiptReference] = useState('');
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'received'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const [dealResult, nextStats] = await Promise.all([
        listOneOffDeals(),
        getBrokerageCommissionStats(),
      ]);
      setDeals(dealResult.page.object_list);
      setStats(nextStats);
    } catch {
      toast.error(t('error_title'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [dealResult, nextStats] = await Promise.all([
          listOneOffDeals(),
          getBrokerageCommissionStats(),
        ]);
        setDeals(dealResult.page.object_list);
        setStats(nextStats);
      } catch {
        toast.error(t('error_title'));
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, [t]);

  const openReceipt = (deal: OneOffDeal) => {
    setReceiptTarget(deal);
    setReceiptAmount(deal.commission_amount ?? '');
    setReceiptDate(new Date().toISOString().slice(0, 10));
    setReceiptMethod('cash');
    setReceiptReference('');
    setReceiptFiles([]);
  };

  const openClose = (deal: OneOffDeal) => {
    setCloseTarget(deal);
    setCloseOutcome('won');
    setRenterName('');
    setRenterPhone('');
    setAgreedRent('');
    setCloseDate(new Date().toISOString().slice(0, 10));
    setCloseNotes('');
  };

  const saveClose = async () => {
    if (
      !closeTarget ||
      !closeDate ||
      (closeOutcome === 'won' && (!renterName || !renterPhone || !agreedRent))
    ) {
      return;
    }
    setSavingClose(true);
    try {
      const closed =
        closeOutcome === 'won'
          ? await closeOneOffDealWon(closeTarget.id, {
              renter: { name: renterName, phone: renterPhone },
              agreed_monthly_rent: agreedRent,
              agreed_currency: closeTarget.commission_currency,
              close_date: closeDate,
              notes: closeNotes,
            })
          : await closeOneOffDealLost(closeTarget.id, { close_date: closeDate, notes: closeNotes });
      setCloseTarget(null);
      if (closed.status === 'closed_won') {
        openReceipt(closed);
      }
      await load();
    } catch {
      toast.error(t('error_title'));
    } finally {
      setSavingClose(false);
    }
  };

  const saveReceipt = async () => {
    if (!receiptTarget || !receiptAmount || !receiptDate) {
      return;
    }
    setSavingReceipt(true);
    try {
      const receiptDeal = await recordOneOffReceipt(receiptTarget.id, {
        amount: receiptAmount,
        currency: receiptTarget.commission_currency,
        received_date: receiptDate,
        method: receiptMethod,
        reference: receiptReference,
      });
      if (receiptFiles.length > 0) {
        await uploadOneOffReceiptAttachments(receiptDeal.id, receiptFiles);
      }
      setReceiptTarget(null);
      await load();
    } catch {
      toast.error(t('error_title'));
    } finally {
      setSavingReceipt(false);
    }
  };

  const summary = [
    {
      key: 'received',
      label: t('brokerage_received'),
      value: stats?.received_uzs ?? '0',
      icon: CheckCircle2,
    },
    {
      key: 'expected',
      label: t('brokerage_expected'),
      value: stats?.expected_uzs ?? '0',
      icon: CircleDollarSign,
    },
    {
      key: 'unpaid',
      label: t('brokerage_unpaid'),
      value: stats?.unpaid_uzs ?? '0',
      icon: ReceiptText,
    },
    {
      key: 'free',
      label: t('brokerage_free_deals'),
      value: String(stats?.free_deals ?? 0),
      icon: CircleDollarSign,
    },
  ];

  const dealTable = renderDealTable(loading, deals, t, openReceipt, openClose);

  return (
    <ManagementPageContainer>
      <div className="flex flex-col gap-4">
        <ManagementPageHeader
          title={t('brokerage')}
          subtitle={t('brokerage_subtitle')}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" className="h-10 gap-2 rounded-[10px] px-3">
                <Download className="size-4" />
                {t('brokerage_export')}
              </Button>
              <Button
                className="h-10 gap-2 rounded-[10px] px-3"
                disabled={!deals.some((deal) => deal.status === 'closed_won' && !deal.receipt)}
                onClick={() => {
                  const next = deals.find((deal) => deal.status === 'closed_won' && !deal.receipt);
                  if (next) {
                    openReceipt(next);
                  }
                }}
              >
                <Plus className="size-4" />
                {t('brokerage_receipt')}
              </Button>
            </div>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <Card key={item.key} className="h-[140px] rounded-2xl py-0 shadow-sm">
              <CardContent className="flex h-full items-start justify-between px-5 py-5">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {item.label}
                  </p>
                  <p className="mt-2 text-[26px] leading-8 font-semibold text-foreground">
                    {item.key === 'free' ? item.value : `${formatUzbekSum(item.value)} UZS`}
                  </p>
                </div>
                <item.icon className="mt-0.5 size-5 text-primary" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="border-b border-border">
          <div className="flex gap-6">
            {(['all', 'pending', 'received'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-0 pb-2 text-sm font-medium transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {t(BROKERAGE_TAB_LABELS[tab])}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <label className="flex h-[38px] items-center gap-2 rounded-[10px] border border-border bg-card px-3 sm:w-[210px]">
              <Search className="size-4 text-muted-foreground" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder={t('search_placeholder')}
              />
            </label>
            <Button variant="outline" className="h-[38px] gap-2 rounded-[10px] px-3 text-sm">
              <SlidersHorizontal className="size-4" />
              {t('brokerage_receipt_method')}
              <ChevronDown className="size-3.5" />
            </Button>
            <Button variant="outline" className="h-[38px] gap-2 rounded-[10px] px-3 text-sm">
              {t('brokerage_property')}
              <ChevronDown className="size-3.5" />
            </Button>
            <Button variant="outline" className="h-[38px] gap-2 rounded-[10px] px-3 text-sm">
              {t('brokerage_date_range')}
              <ChevronDown className="size-3.5" />
            </Button>
          </div>
          <Button variant="ghost" className="h-[38px] gap-1.5 text-xs text-muted-foreground">
            {t('brokerage_sort_most_overdue')}
            <ChevronDown className="size-3.5" />
          </Button>
        </div>
        <Card className="overflow-hidden rounded-2xl py-0">{dealTable}</Card>
      </div>
      <Dialog
        open={receiptTarget !== null}
        onOpenChange={(open) => !open && setReceiptTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('brokerage_receipt')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="receipt-amount">{t('brokerage_commission_amount')}</Label>
              <Input
                id="receipt-amount"
                value={receiptAmount}
                onChange={(event) => setReceiptAmount(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receipt-date">{t('brokerage_received_date')}</Label>
              <Input
                id="receipt-date"
                type="date"
                value={receiptDate}
                onChange={(event) => setReceiptDate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('brokerage_payment_method')}</Label>
              <Select value={receiptMethod} onValueChange={setReceiptMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('method_cash')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('method_bank_transfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receipt-reference">{t('brokerage_reference')}</Label>
              <Input
                id="receipt-reference"
                value={receiptReference}
                onChange={(event) => setReceiptReference(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receipt-files">{t('brokerage_attachments')}</Label>
              <Input
                id="receipt-files"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) =>
                  setReceiptFiles(event.target.files ? [...event.target.files] : [])
                }
              />
            </div>
            <Button
              disabled={savingReceipt || !receiptAmount || !receiptDate}
              onClick={() => void saveReceipt()}
            >
              {t('brokerage_receipt')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={closeTarget !== null} onOpenChange={(open) => !open && setCloseTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('brokerage_close_deal')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={closeOutcome === 'won' ? 'default' : 'outline'}
                onClick={() => setCloseOutcome('won')}
              >
                {t('brokerage_won')}
              </Button>
              <Button
                variant={closeOutcome === 'lost' ? 'default' : 'outline'}
                onClick={() => setCloseOutcome('lost')}
              >
                {t('brokerage_lost')}
              </Button>
            </div>
            {closeOutcome === 'won' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="renter-name">{t('brokerage_renter_name')}</Label>
                  <Input
                    id="renter-name"
                    value={renterName}
                    onChange={(event) => setRenterName(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="renter-phone">{t('brokerage_renter_phone')}</Label>
                  <Input
                    id="renter-phone"
                    value={renterPhone}
                    onChange={(event) => setRenterPhone(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="agreed-rent">{t('brokerage_agreed_rent')}</Label>
                  <Input
                    id="agreed-rent"
                    inputMode="decimal"
                    value={agreedRent}
                    onChange={(event) => setAgreedRent(event.target.value)}
                  />
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label htmlFor="close-date">{t('brokerage_closed_date')}</Label>
              <Input
                id="close-date"
                type="date"
                value={closeDate}
                onChange={(event) => setCloseDate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="close-notes">{t('brokerage_notes')}</Label>
              <Input
                id="close-notes"
                value={closeNotes}
                onChange={(event) => setCloseNotes(event.target.value)}
              />
            </div>
            <Button
              disabled={
                savingClose ||
                !closeDate ||
                (closeOutcome === 'won' && (!renterName || !renterPhone || !agreedRent))
              }
              onClick={() => void saveClose()}
            >
              {t('brokerage_confirm_close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ManagementPageContainer>
  );
}
