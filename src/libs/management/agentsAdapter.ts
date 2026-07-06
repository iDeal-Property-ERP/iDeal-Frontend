import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type {
  AgentCreatePayload,
  AgentDealCreatePayload,
  AgentDealOutput,
  AgentOutput,
  AgentUpdatePayload,
} from '@/types/management';

/**
 * Agents data adapter — the single isolation point between the Agents Workbench
 * and the backend. Real endpoints are used where they exist (`/agents/` for
 * reads and writes, `/agents/{id}/deals/` for the deal log); every fallback for
 * a missing capability is marked `BACKEND-GAP`. No UI component talks to the API
 * directly.
 */

/** Deal statuses the backend recognizes on an agent deal. */
export const AGENT_DEAL_STATUSES = ['closed', 'pending', 'cancelled'] as const;
export type AgentDealStatus = (typeof AGENT_DEAL_STATUSES)[number];

export type AgentListParams = {
  page: number;
  perPage?: number;
  isActive?: boolean;
};

export type AgentListResult = {
  items: AgentOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists agents for the workbench table via `GET /agents/`.
 * BACKEND-GAP: the endpoint has no `search` param — text search is applied
 * client-side over the loaded page in the page orchestrator.
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listAgents(params: AgentListParams): Promise<AgentListResult> {
  const query: Record<string, string | number | boolean> = { page: params.page };
  if (params.perPage) {
    query.per_page = params.perPage;
  }
  if (params.isActive !== undefined) {
    query.is_active = params.isActive;
  }
  const res = await apiFetch<PaginatedData<AgentOutput>>('/agents/', { query });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

export type AgentStatusCounts = {
  all: number;
  active: number;
  inactive: number;
};

/**
 * Fetches the record count for one agent view via a lightweight
 * (`per_page: 1`) list call.
 * @param extra - Extra query filters (e.g. `is_active`) merged into the call.
 * @returns The matching record count, or 0 on error.
 */
async function agentCountOf(extra: Record<string, string | number | boolean>): Promise<number> {
  try {
    const res = await apiFetch<PaginatedData<AgentOutput>>('/agents/', {
      query: { page: 1, per_page: 1, ...extra },
    });
    return res.count;
  } catch {
    return 0;
  }
}

/**
 * Per-tab record counts for the saved-view tabs.
 * BACKEND-GAP: no aggregate counts endpoint — counts are read from parallel
 * lightweight (`per_page: 1`) list calls using the returned `count`.
 * @returns Counts for the Active / Inactive / All views.
 */
export async function getAgentStatusCounts(): Promise<AgentStatusCounts> {
  const [all, active, inactive] = await Promise.all([
    agentCountOf({}),
    agentCountOf({ is_active: true }),
    agentCountOf({ is_active: false }),
  ]);
  return { all, active, inactive };
}

export type AgentKpis = {
  dealsYtd: number;
  commissionPaid: number;
  activeThisMonth: number;
  topAgent: string;
};

/**
 * The four KPI-strip metrics for the Agents workbench, computed from a sample
 * page (`per_page: 100`).
 * BACKEND-GAP: no aggregate metrics endpoint. `commissionPaid` is approximated
 * client-side as Σ(total_revenue × commission_rate ÷ 100) because there is no
 * settled-commission field; `topAgent` is the agent with the most total deals.
 * @returns The KPI bundle.
 */
export async function getAgentKpis(): Promise<AgentKpis> {
  const sample = await listAgents({ page: 1, perPage: 100 }).catch(
    () => ({ items: [], total: 0, totalPages: 1 }) as AgentListResult,
  );
  const dealsYtd = sample.items.reduce((sum, agent) => sum + agent.total_deals, 0);
  let commissionPaid = 0;
  for (const agent of sample.items) {
    const revenue = Number.parseFloat(agent.total_revenue) || 0;
    const rate = Number.parseFloat(agent.commission_rate) || 0;
    commissionPaid += (revenue * rate) / 100;
  }
  const activeThisMonth = sample.items.filter((agent) => agent.is_active).length;
  let top: AgentOutput | null = null;
  for (const agent of sample.items) {
    if (!top || agent.total_deals > top.total_deals) {
      top = agent;
    }
  }
  return {
    dealsYtd,
    commissionPaid: Math.round(commissionPaid),
    activeThisMonth,
    topAgent: top?.user_name ?? '—',
  };
}

/**
 * Lists the recent deals for one agent via `GET /agents/{id}/deals/`.
 * @param agentId - The agent id.
 * @returns The agent's deal rows (first page).
 */
export async function getAgentDeals(agentId: number): Promise<AgentDealOutput[]> {
  const res = await apiFetch<PaginatedData<AgentDealOutput>>(`/agents/${agentId}/deals/`, {
    query: { page: 1 },
  });
  return res.page.object_list;
}

/**
 * Records a deal for an agent via `POST /agents/{id}/deals/`.
 * @param agentId - The agent id.
 * @param payload - The deal fields.
 * @returns The created deal id.
 */
export async function recordDeal(
  agentId: number,
  payload: AgentDealCreatePayload,
): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>(`/agents/${agentId}/deals/`, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Creates an agent via `POST /agents/`.
 * @param payload - The agent fields (user, commission rate, active flag).
 * @returns The created agent id.
 */
export async function createAgent(payload: AgentCreatePayload): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>('/agents/', { method: 'POST', body: payload });
}

/**
 * Updates an agent via `PATCH /agents/{id}/`.
 * @param id - The agent id.
 * @param payload - The mutable fields (commission rate, active flag).
 * @returns The updated agent id.
 */
export async function updateAgent(
  id: number,
  payload: AgentUpdatePayload,
): Promise<{ id: number }> {
  return await apiFetch<{ id: number }>(`/agents/${id}/`, { method: 'PATCH', body: payload });
}

/**
 * Escapes one CSV cell.
 * @param value - The raw value.
 * @returns The escaped cell.
 */
function csvCell(value: string | number): string {
  const text = String(value);
  return /["\n,]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Exports the given agent rows as a downloaded CSV file.
 * BACKEND-GAP: no server export endpoint — the CSV is generated client-side.
 * @param rows - The agent rows to export.
 * @param filename - The download filename.
 */
export function exportAgentsCsv(rows: AgentOutput[], filename: string): void {
  const headers = ['ID', 'Agent', 'Total deals', 'Total revenue', 'Commission rate', 'Active'];
  const body = rows.map((row) =>
    [
      row.id,
      row.user_name,
      row.total_deals,
      row.total_revenue,
      row.commission_rate,
      row.is_active ? 'yes' : 'no',
    ]
      .map(csvCell)
      .join(','),
  );
  const csv = [headers.join(','), ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
