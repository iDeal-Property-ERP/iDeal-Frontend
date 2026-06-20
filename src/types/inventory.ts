import type { ConditionRating, InventoryActStatus, InventoryActType } from './enums';

export type InventoryActItemOutput = {
  id: number;
  area: string;
  condition: ConditionRating;
  notes: string | null;
  sort_order: number;
};

export type InventoryActPhotoOutput = {
  id: number;
  item_id: number | null;
  image_url: string | null;
  caption: string | null;
  created_at: string;
};

export type InventoryActListOutput = {
  id: number;
  property_id: number;
  property_name: string;
  lease_id: number | null;
  act_type: InventoryActType;
  status: InventoryActStatus;
  item_count: number;
  photo_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryActOutput = {
  id: number;
  property_id: number;
  property_name: string;
  lease_id: number | null;
  act_type: InventoryActType;
  status: InventoryActStatus;
  created_by_id: number;
  notes: string | null;
  finalized_at: string | null;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  items: InventoryActItemOutput[];
  photos: InventoryActPhotoOutput[];
  created_at: string;
  updated_at: string;
};

export type InventoryActItemInput = {
  area: string;
  condition?: ConditionRating;
  notes?: string;
  sort_order?: number;
};

export type InventoryActCreatePayload = {
  property_id: number;
  lease_id?: number;
  act_type?: InventoryActType;
  notes?: string;
};
