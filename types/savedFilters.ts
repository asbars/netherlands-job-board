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
  // Notification fields
  notifications_enabled: boolean;
  last_checked_at: string;
  new_job_count?: number; // Calculated by API, not stored
  // Future email notification fields
  notification_email?: string | null;
  notification_frequency?: 'instant' | 'daily' | 'weekly' | null;
}
