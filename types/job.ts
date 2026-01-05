export interface Job {
  // Core fields
  id: number;
  external_id: string;
  title: string;
  organization: string;
  url: string;
  description_html: string;
  
  // Job details
  location?: string;
  job_type?: string; // Full-time, Part-time, Contract, etc.
  experience_level?: string;
  salary_range?: string;
  remote_allowed?: boolean;
  
  // Company enrichment (from LinkedIn via Apify)
  company_size?: string;
  industry?: string;
  headquarters_location?: string;
  linkedin_org_slug?: string;
  linkedin_org_description?: string;
  
  // Tracking metadata
  source: 'feed' | 'api';
  first_seen_date: string;
  last_updated: string;
  status: 'active' | 'expired';
  expired_date?: string;
  
  // User engagement
  view_count?: number;
  bookmark_count?: number;
  application_count?: number;
}

export interface FilterState {
  title: string;
  organization: string;
  location: string;
  job_type: string;
  experience_level: string;
  remote_allowed: boolean | null;
  description: string;
}

export interface UserJobAlert {
  user_id: string;
  email: string;
  keywords: string[];
  locations: string[];
  job_types: string[];
  experience_levels: string[];
  remote_only: boolean;
  frequency: 'daily' | 'weekly';
  is_active: boolean;
  last_sent?: string;
}

export interface ApifyJobData {
  // Raw data structure from Apify API
  external_id: string;
  title: string;
  organization: string;
  url: string;
  description_html: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  salary_range?: string;
  remote_allowed?: boolean;
  company_size?: string;
  industry?: string;
  headquarters_location?: string;
  linkedin_org_slug?: string;
  linkedin_org_description?: string;
  posted_date?: string;
}

