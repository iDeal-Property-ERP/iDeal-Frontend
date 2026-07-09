import { apiFetch } from '@/libs/api';
import type { ExportTable } from '@/libs/management/exportFile';
import type { PnlOutput } from '@/types/management';

/**
 * P&L data adapter — the single isolation point between the report page and
 * `GET /management/pnl/`. The param-less default reproduces the legacy numbers;
 * `year`, `currency`, and `sources` drive the phase-6 filters.
 */

export type PnlParams = {
  year?: number;
  currency?: string;
  sources?: string[];
};

/**
 * Fetches the P&L report via `GET /management/pnl/` with optional filters.
 * @param params - Year, currency (USD|UZS), and included revenue/expense sources.
 * @returns The full P&L payload including the category breakdown.
 */
export async function getPnl(params?: PnlParams): Promise<PnlOutput> {
  const query: Record<string, string | number> = {};
  if (params?.year) {
    query.year = params.year;
  }
  if (params?.currency) {
    query.currency = params.currency;
  }
  if (params?.sources && params.sources.length > 0) {
    query.sources = params.sources.join(',');
  }
  return await apiFetch<PnlOutput>('/management/pnl/', { query });
}

/**
 * Builds the P&L export matrix for the shared ExportDialog engine — the summary
 * KPIs, the monthly breakdown, and the category composition, stacked into one
 * sheet. Labels come from the caller so no translation happens in this module.
 * @param data - The P&L payload.
 * @param labels - The translated section/column labels.
 * @returns The headers + cell matrix.
 */
export function buildPnlExportRows(
  data: PnlOutput,
  labels: {
    section: string;
    metric: string;
    value: string;
    month: string;
    revenue: string;
    payouts: string;
    profit: string;
    tax: string;
    grossRevenue: string;
    ownerPayouts: string;
    netProfit: string;
    taxAccrued: string;
    monthlyBreakdown: string;
    revenueBySource: string;
    expensesBySource: string;
    share: string;
    sourceLabel: (source: string) => string;
  },
): ExportTable {
  const rows: (string | number)[][] = [
    // Summary block
    [labels.grossRevenue, data.summary.gross_revenue, ''],
    [labels.ownerPayouts, data.summary.owner_payouts, ''],
    [labels.netProfit, data.summary.net_profit, ''],
    [labels.taxAccrued, data.summary.tax, ''],
    // Monthly block
    [labels.monthlyBreakdown, '', ''],
    ...data.monthly.map((m) => [m.month, m.revenue, m.profit]),
  ];
  if (data.breakdown) {
    rows.push(
      [labels.revenueBySource, '', ''],
      ...data.breakdown.revenue.map((r) => [labels.sourceLabel(r.source), r.amount, `${r.share}%`]),
      [labels.expensesBySource, '', ''],
      ...data.breakdown.expenses.map((r) => [
        labels.sourceLabel(r.source),
        r.amount,
        `${r.share}%`,
      ]),
    );
  }
  return { headers: [labels.metric, labels.value, labels.share], rows };
}
