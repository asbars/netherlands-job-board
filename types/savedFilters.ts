/**
 * Saved Filter Types
 */

import { FilterCondition } from './filters';

export interface SavedFilter {
  id: number;
  name: string;
  filters: FilterCondition[];
  created_at: string;
  updated_at: string;
}
