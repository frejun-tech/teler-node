/**
 * Core Types
 */

import { CursorFilters } from "./common";

export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive"
}

type LocationResponse = {
  id: string;
  name: string;
  region_code: string;
  country_code: string;
  country_name?: string | null;
}

export interface ListVNFilters extends CursorFilters {
  search?: string;
  location?: string[];
}

export interface VNListResponse {
  id: string;
  account_id: string;
  name: string;
  number: string;
  location: LocationResponse;
}