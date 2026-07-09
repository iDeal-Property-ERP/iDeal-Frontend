import { apiFetch } from '@/libs/api';
import type { ExportTable } from '@/libs/management/exportFile';
import type { PaginatedData } from '@/types/api';
import type {
  ServiceCatalogItemCreatePayload,
  ServiceCatalogItemOutput,
  ServiceOrderCreatePayload,
  ServiceOrderOutput,
  VasOrderStats,
  VasPartnerRow,
} from '@/types/vas';

/**
 * Services (VAS) data adapter — the single isolation point between the Services
 * workbench and the backend. Orders go through `/management/vas-orders/…`
 * (list / detail / create / stats / status); the catalog and partners through
 * `/vas/catalog/…` and `/management/vas-partners/`.
 */

export type VasOrdersListParams = {
  page: number;
  perPage?: number;
  status?: string;
  serviceType?: string;
  propertyId?: number | string;
  tenantId?: number | string;
  search?: string;
  order?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type VasOrdersListResult = {
  items: ServiceOrderOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists service orders for the workbench via `GET /management/vas-orders/`.
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listVasOrders(params: VasOrdersListParams): Promise<VasOrdersListResult> {
  const query: Record<string, string | number> = { page: params.page };
  if (params.perPage) {
    query.per_page = params.perPage;
  }
  if (params.status) {
    query.status = params.status;
  }
  if (params.serviceType) {
    query.service_type = params.serviceType;
  }
  if (params.propertyId) {
    query.property_id = params.propertyId;
  }
  if (params.tenantId) {
    query.tenant_id = params.tenantId;
  }
  if (params.search) {
    query.search = params.search;
  }
  if (params.order) {
    query.order = params.order;
  }
  if (params.dateFrom) {
    query.date_from = params.dateFrom;
  }
  if (params.dateTo) {
    query.date_to = params.dateTo;
  }
  const res = await apiFetch<PaginatedData<ServiceOrderOutput>>('/management/vas-orders/', {
    query,
  });
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

/**
 * Fetches one order via `GET /management/vas-orders/{id}/`.
 * @param id - The order id.
 * @returns The enriched order row.
 */
export async function getVasOrder(id: number): Promise<ServiceOrderOutput> {
  return await apiFetch<ServiceOrderOutput>(`/management/vas-orders/${id}/`);
}

/**
 * Places a management-initiated order via `POST /management/vas-orders/`.
 * Cost defaults to the catalog base price server-side.
 * @param payload - Catalog item, tenant, property, and optional cost/schedule/notes.
 * @returns The created order.
 */
export async function createVasOrder(
  payload: ServiceOrderCreatePayload,
): Promise<ServiceOrderOutput> {
  return await apiFetch<ServiceOrderOutput>('/management/vas-orders/', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Moves an order through its workflow via `POST /management/vas-orders/{id}/status/`.
 * @param id - The order id.
 * @param status - The next status.
 * @param reason - Required by the UI when cancelling; stored on the order.
 * @returns The updated order.
 */
export async function setVasOrderStatus(
  id: number,
  status: string,
  reason?: string,
): Promise<ServiceOrderOutput> {
  return await apiFetch<ServiceOrderOutput>(`/management/vas-orders/${id}/status/`, {
    method: 'POST',
    body: reason ? { status, reason } : { status },
  });
}

/**
 * KPI strip + tab counts via `GET /management/vas-orders/stats/`.
 * @returns The services stats bundle.
 */
export async function getVasStats(): Promise<VasOrderStats> {
  return await apiFetch<VasOrderStats>('/management/vas-orders/stats/');
}

/**
 * Lists the service catalog via `GET /vas/catalog/`.
 * @param params - Optional search and active filters.
 * @returns All matching catalog items.
 */
export async function listCatalog(params?: {
  search?: string;
  isActive?: boolean;
}): Promise<ServiceCatalogItemOutput[]> {
  const query: Record<string, string> = {};
  if (params?.search) {
    query.search = params.search;
  }
  if (params?.isActive !== undefined) {
    query.is_active = String(params.isActive);
  }
  return await apiFetch<ServiceCatalogItemOutput[]>('/vas/catalog/', { query });
}

/**
 * Creates a catalog item via `POST /vas/catalog/`.
 * @param payload - The item fields.
 * @returns The created item.
 */
export async function createCatalogItem(
  payload: ServiceCatalogItemCreatePayload,
): Promise<ServiceCatalogItemOutput> {
  return await apiFetch<ServiceCatalogItemOutput>('/vas/catalog/', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Updates a catalog item via `PATCH /vas/catalog/{id}/`.
 * @param id - The item id.
 * @param payload - The changed fields only.
 * @returns The updated item.
 */
export async function updateCatalogItem(
  id: number,
  payload: Partial<ServiceCatalogItemCreatePayload>,
): Promise<ServiceCatalogItemOutput> {
  return await apiFetch<ServiceCatalogItemOutput>(`/vas/catalog/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Lists partner aggregates via `GET /management/vas-partners/`.
 * @returns One row per distinct catalog partner.
 */
export async function listVasPartners(): Promise<VasPartnerRow[]> {
  return await apiFetch<VasPartnerRow[]>('/management/vas-partners/');
}

/**
 * Builds the orders export matrix for the shared ExportDialog engine.
 * Labels come from the caller so no translation happens in this module.
 * @param rows - The order rows to export.
 * @param headers - The translated column headers.
 * @returns The headers + cell matrix.
 */
export function buildVasOrdersExportRows(
  rows: ServiceOrderOutput[],
  headers: string[],
): ExportTable {
  return {
    headers,
    rows: rows.map((row) => [
      row.id,
      row.catalog_item_name,
      row.tenant_name,
      row.property_name,
      row.cost,
      row.commission_earned,
      row.status,
      row.scheduled_for ?? '',
    ]),
  };
}
