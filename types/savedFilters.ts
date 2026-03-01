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
  // Badge snapshot fields - persists the count for 12 hours (or until 4am) after clicking
  badge_count_snapshot?: number | null;
  badge_count_expires_at?: string | null;
  // Boundary for "new" job detection - stores the pre-click last_checked_at
  new_jobs_since?: string | null;
  // Future email notification fields
  notification_email?: string | null;
  notification_frequency?: 'instant' | 'daily' | 'weekly' | null;
}
