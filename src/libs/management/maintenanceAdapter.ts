import { apiFetch, apiUpload } from '@/libs/api';
import type { ExportTable } from '@/libs/management/exportFile';
import type { PaginatedData } from '@/types/api';
import type {
  ManagementServiceRequestOutput,
  MaintenanceStats,
  ServiceRequestComment,
  ServiceRequestCreatePayload,
  ServiceRequestResolvePayload,
} from '@/types/management';

/**
 * Maintenance data adapter — the single isolation point between the Maintenance
 * workbench and the backend. Reads go through `GET /management/service-requests/`
 * (+ `/stats/`, `/comments/`); mutations through `/maintenance/requests/…`
 * (create / assign / resolve) and `/management/service-requests/…` (cancel /
 * comments / photos).
 */

export type MaintenanceListParams = {
  page: number;
  perPage?: number;
  status?: string;
  priority?: string;
  propertyId?: number | string;
  assignedToId?: number | string;
  unassigned?: boolean;
  search?: string;
  order?: string;
};

export type MaintenanceListResult = {
  items: ManagementServiceRequestOutput[];
  total: number;
  totalPages: number;
};

/**
 * Lists service requests for the workbench via `GET /management/service-requests/`.
 * @param params - Page and filter parameters.
 * @returns The page of rows plus totals.
 */
export async function listServiceRequests(
  params: MaintenanceListParams,
): Promise<MaintenanceListResult> {
  const query: Record<string, string | number> = { page: params.page };
  if (params.perPage) {
    query.per_page = params.perPage;
  }
  if (params.status) {
    query.status = params.status;
  }
  if (params.priority) {
    query.priority = params.priority;
  }
  if (params.propertyId) {
    query.property_id = params.propertyId;
  }
  if (params.assignedToId) {
    query.assigned_to_id = params.assignedToId;
  }
  if (params.unassigned) {
    query.unassigned = 'true';
  }
  if (params.search) {
    query.search = params.search;
  }
  if (params.order) {
    query.order = params.order;
  }
  const res = await apiFetch<PaginatedData<ManagementServiceRequestOutput>>(
    '/management/service-requests/',
    { query },
  );
  return { items: res.page.object_list, total: res.count, totalPages: res.num_pages };
}

/**
 * KPI strip + tab counts via `GET /management/service-requests/stats/`.
 * @returns The maintenance stats bundle.
 */
export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  return await apiFetch<MaintenanceStats>('/management/service-requests/stats/');
}

/**
 * Creates a service request via `POST /maintenance/requests/`.
 * @param payload - Property, tenant, title, description and priority.
 * @returns The created request.
 */
export async function createServiceRequest(
  payload: ServiceRequestCreatePayload,
): Promise<ManagementServiceRequestOutput> {
  return await apiFetch<ManagementServiceRequestOutput>('/maintenance/requests/', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Assigns a technician via `POST /maintenance/requests/{id}/assign/`.
 * @param id - The request id.
 * @param assignedToId - The user id to assign.
 */
export async function assignServiceRequest(id: number, assignedToId: number): Promise<void> {
  await apiFetch(`/maintenance/requests/${id}/assign/`, {
    method: 'POST',
    body: { assigned_to_id: assignedToId },
  });
}

/**
 * Resolves a request via `POST /maintenance/requests/{id}/resolve/`.
 * @param id - The request id.
 * @param payload - Cost, resolution notes, and who bears the cost.
 */
export async function resolveServiceRequest(
  id: number,
  payload: ServiceRequestResolvePayload,
): Promise<void> {
  await apiFetch(`/maintenance/requests/${id}/resolve/`, { method: 'POST', body: payload });
}

/**
 * Cancels a request via `POST /management/service-requests/{id}/cancel/`.
 * @param id - The request id.
 * @param reason - Optional cancellation reason.
 */
export async function cancelServiceRequest(id: number, reason?: string): Promise<void> {
  await apiFetch(`/management/service-requests/${id}/cancel/`, {
    method: 'POST',
    body: reason ? { reason } : {},
  });
}

/**
 * Lists a request's comments via `GET /management/service-requests/{id}/comments/`.
 * @param id - The request id.
 * @returns The ordered comment thread.
 */
export async function listServiceRequestComments(id: number): Promise<ServiceRequestComment[]> {
  return await apiFetch<ServiceRequestComment[]>(`/management/service-requests/${id}/comments/`);
}

/**
 * Adds a comment via `POST /management/service-requests/{id}/comments/`.
 * @param id - The request id.
 * @param body - The comment body.
 * @returns The created comment.
 */
export async function addServiceRequestComment(
  id: number,
  body: string,
): Promise<ServiceRequestComment> {
  return await apiFetch<ServiceRequestComment>(`/management/service-requests/${id}/comments/`, {
    method: 'POST',
    body: { body },
  });
}

/**
 * Uploads photos via `POST /management/service-requests/{id}/photos/` (multipart).
 * @param id - The request id.
 * @param files - The image files.
 * @returns The updated request.
 */
export async function uploadServiceRequestPhotos(
  id: number,
  files: File[],
): Promise<ManagementServiceRequestOutput> {
  const form = new FormData();
  for (const file of files) {
    form.append('images', file);
  }
  return await apiUpload<ManagementServiceRequestOutput>(
    `/management/service-requests/${id}/photos/`,
    form,
  );
}

/**
 * Builds the export matrix for the shared ExportDialog engine.
 * @param rows - The service-request rows to export.
 * @returns The headers + cell matrix.
 */
export function buildServiceRequestExportRows(rows: ManagementServiceRequestOutput[]): ExportTable {
  return {
    headers: ['ID', 'Title', 'Property', 'Tenant', 'Priority', 'Status', 'Assignee', 'Cost'],
    rows: rows.map((row) => [
      row.id,
      row.title,
      row.property_name,
      row.tenant_name,
      row.priority,
      row.status,
      row.assigned_to_name ?? '',
      row.cost ?? '',
    ]),
  };
}
