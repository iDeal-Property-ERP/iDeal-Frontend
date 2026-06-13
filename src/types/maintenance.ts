import type { Priority, ServiceRequestStatus } from './enums';

export type ServiceRequestOutput = {
  id: number;
  property_id: number;
  tenant_id: number;
  assigned_to_id: number;
  title: string;
  description: string;
  priority: Priority;
  status: ServiceRequestStatus;
  cost: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceRequestCreatePayload = {
  property_id: number;
  tenant_id: number;
  title: string;
  description: string;
  priority?: Priority;
};

export type ServiceRequestUpdatePayload = {
  title?: string;
  description?: string;
  priority?: Priority;
};

export type ServiceRequestAssignPayload = {
  assigned_to_id: number;
};

export type ServiceRequestResolvePayload = {
  cost: string;
  resolution_notes: string;
};
