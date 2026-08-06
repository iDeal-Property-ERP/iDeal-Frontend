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
import { DangerConfirmDialog } from '@/components/management/dialogs/DangerConfirmDialog';
import { ManagementPageContainer } from '@/components/management/ManagementPageContainer';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { BulkSelectionBar } from '@/components/management/workbench/BulkSelectionBar';
import { WorkbenchTable } from '@/components/management/workbench/WorkbenchTable';
import type { WorkbenchColumn } from '@/components/management/workbench/WorkbenchTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRowSelection } from '@/hooks/management/useRowSelection';
import { useRouter } from '@/libs/I18nNavigation';
import {
  getBrokerageCommissionStats,
  listOneOffDeals,
  closeOneOffDealLost,
  closeOneOffDealWon,
  recordOneOffReceipt,
  uploadOneOffReceiptAttachments,
  deleteOneOffDeal,
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

function commissionLabel(deal: OneOffDeal, noneLabel: string): string {
  if (deal.commission_amount) {
    return `${deal.commission_amount} ${deal.commission_currency}`;
  }
  if (deal.commission_type === 'none') {
    return noneLabel;
  }
  return '—';
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
  const [deleteTarget, setDeleteTarget] = useState<OneOffDeal | null>(null);
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

  const router = useRouter();
  const pageIds = deals.map((d) => d.id);
  const selection = useRowSelection(pageIds);
  const [keepPropertyActive, setKeepPropertyActive] = useState(false);
  const handleToggleRow = selection.toggle;
  const handleToggleAll = selection.toggleAll;

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
              keep_property_active: keepPropertyActive,
            })
          : await closeOneOffDealLost(closeTarget.id, {
              close_date: closeDate,
              notes: closeNotes,
              keep_property_active: keepPropertyActive,
            });
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

  const columns: WorkbenchColumn<OneOffDeal>[] = [
    {
      id: 'deal',
      header: t('brokerage_deal'),
      cell: (row) => <span className="font-medium text-foreground">{row.seller_name}</span>,
    },
    {
      id: 'property',
      header: t('brokerage_property'),
      cell: (row) => <span className="font-medium text-foreground">{row.property_name}</span>,
    },
    {
      id: 'close_date',
      header: t('brokerage_closed_date'),
      cell: (row) => <span className="text-muted-foreground">{row.close_date ?? '—'}</span>,
    },
    {
      id: 'amount',
      header: t('brokerage_amount'),
      cell: (row) => (
        <span className="font-medium text-foreground">
          {commissionLabel(row, t('brokerage_commission_none'))}
        </span>
      ),
    },
    {
      id: 'receipt',
      header: t('brokerage_receipt'),
      cell: (row) => {
        if (row.receipt) {
          return <span className="text-xs text-muted-foreground">{row.receipt.method}</span>;
        }
        if (row.status === 'closed_won') {
          return (
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded-md px-2 text-xs"
              onClick={() => openReceipt(row)}
            >
              {t('brokerage_receipt')}
            </Button>
          );
        }
        return <Badge variant="warning">{t('brokerage_pending_badge')}</Badge>;
      },
    },
  ];

  const rowActions = (row: OneOffDeal) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push(`/management/brokerage/${row.id}`)}>
          {t('action_details')}
        </DropdownMenuItem>
        {(row.status === 'active' || row.status === 'paused') && (
          <>
            <DropdownMenuItem onClick={() => router.push(`/management/brokerage/${row.id}/edit`)}>
              {t('action_edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openClose(row)}>
              {t('brokerage_close_deal')}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem
          className="text-danger focus:bg-danger/10 focus:text-danger"
          onClick={() => setDeleteTarget(row)}
        >
          {t('action_delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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

        <Card className="overflow-hidden rounded-2xl py-0">
          {(() => {
            if (loading) {
              return <div className="p-6 text-sm text-muted-foreground">{t('loading')}</div>;
            }
            if (deals.length === 0) {
              return (
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                  <CircleDollarSign className="size-8 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">{t('brokerage_no_deals')}</h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {t('brokerage_no_deals_desc')}
                  </p>
                </div>
              );
            }
            return (
              <div className="relative">
                <BulkSelectionBar
                  open={selection.count > 0}
                  countLabel={t('bulk_selected', { count: selection.count })}
                  onClear={() => selection.clear()}
                  clearLabel={t('bulk_clear')}
                  actions={
                    <button
                      type="button"
                      className="flex h-9 items-center rounded-full px-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger/60 focus-visible:outline-none"
                      onClick={() => {
                        void (async () => {
                          try {
                            await Promise.all(
                              [...selection.selected].map(async (id) => {
                                await deleteOneOffDeal(Number(id));
                              }),
                            );
                            toast.success(t('archive_success'));
                            selection.clear();
                            await load();
                          } catch {
                            toast.error(t('archive_failed'));
                          }
                        })();
                      }}
                    >
                      <CheckCircle2 className="mr-2 size-4" />
                      {t('action_delete')}
                    </button>
                  }
                />
                <WorkbenchTable
                  columns={columns}
                  rows={deals}
                  getRowId={(row) => row.id}
                  isSelected={selection.isSelected}
                  onToggleRow={handleToggleRow}
                  allChecked={selection.allChecked}
                  someChecked={selection.someChecked}
                  onToggleAll={handleToggleAll}
                  onOpenRecord={(row) => router.push(`/management/brokerage/${row.id}`)}
                  rowActions={rowActions}
                  labels={{
                    selectAll: t('select_all'),
                    selectRow: t('select_row'),
                  }}
                />
              </div>
            );
          })()}
        </Card>
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
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label>{t('brokerage_keep_active')}</Label>
                <p className="text-xs text-muted-foreground">{t('brokerage_keep_active_desc')}</p>
              </div>
              <Checkbox
                checked={keepPropertyActive}
                onCheckedChange={(checked) => setKeepPropertyActive(checked === true)}
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
      <DangerConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('action_delete')}
        description={t('brokerage_delete_desc')}
        confirmLabel={t('action_delete')}
        cancelLabel={t('action_cancel')}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }
          try {
            await deleteOneOffDeal(deleteTarget.id);
            toast.success(t('archive_success'));
            setDeleteTarget(null);
            await load();
          } catch {
            toast.error(t('archive_failed'));
          }
        }}
      />
    </ManagementPageContainer>
  );
}
