// ============================================
// MAIN JOB INTERFACE (matches Apify output + internal fields)
// ============================================

export interface Job {
  // Internal
  id: number;
  external_id: string;
  
  // Core fields
  title: string;
  organization: string;
  organization_url?: string;
  organization_logo?: string;
  url?: string;
  
  // Dates
  date_posted?: string;
  date_created?: string;
  date_validthrough?: string;
  date_modified?: string;
  
  // Descriptions
  description_text?: string;
  description_html?: string;
  
  // Location data (rich structure from Apify)
  locations_raw?: any[];
  locations_alt_raw?: string[];
  locations_derived?: string[];  // [{city, admin, country}]
  location_type?: string;  // 'TELECOMMUTE' for remote
  location_requirements_raw?: any[];
  
  // Derived locations
  cities_derived?: any[];
  regions_derived?: any[];
  countries_derived?: any[];
  timezones_derived?: any[];
  lats_derived?: any[];
  lngs_derived?: any[];
  remote_derived?: boolean;
  
  // Employment & Salary
  employment_type?: string[];
  salary_raw?: any;
  
  // Source info
  source: string;
  source_type?: string;
  source_domain?: string;
  domain_derived?: string;
  modified_fields?: string[];
  
  // ============================================
  // AI-ENHANCED FIELDS
  // ============================================
  
  // AI Salary
  ai_salary_currency?: string;
  ai_salary_value?: number;
  ai_salary_minvalue?: number;
  ai_salary_maxvalue?: number;
  ai_salary_unittext?: string;
  ai_benefits?: string[];
  
  // AI Classification
  ai_experience_level?: string;
  ai_work_arrangement?: string;
  ai_work_arrangement_office_days?: number;
  ai_remote_location?: string[];
  ai_remote_location_derived?: string[];
  
  // AI Skills & Requirements
  ai_key_skills?: string[];
  ai_education_requirements?: string[];
  ai_keywords?: string[];
  ai_taxonomies_a?: string[];
  
  // AI Details
  ai_core_responsibilities?: string;
  ai_requirements_summary?: string;
  ai_working_hours?: number;
  ai_employment_type?: string[];
  ai_job_language?: string;
  ai_visa_sponsorship?: boolean;
  
  // AI Hiring Manager
  ai_hiring_manager_name?: string;
  ai_hiring_manager_email_address?: string;
  
  // ============================================
  // LINKEDIN COMPANY DATA
  // ============================================
  
  linkedin_org_employees?: number;
  linkedin_org_url?: string;
  linkedin_org_size?: string;
  linkedin_org_slogan?: string;
  linkedin_org_industry?: string;
  linkedin_org_followers?: number;
  linkedin_org_headquarters?: string;
  linkedin_org_type?: string;
  linkedin_org_foundeddate?: string;
  linkedin_org_specialties?: string[];
  linkedin_org_locations?: string[];
  linkedin_org_description?: string;
  linkedin_org_recruitment_agency_derived?: boolean;
  linkedin_org_slug?: string;
  
  // ============================================
  // INTERNAL TRACKING
  // ============================================
  
  data_source: 'feed' | 'api';
  first_seen_date: string;
  last_updated: string;
  status: 'active' | 'expired';
  expired_date?: string;
  
  // Engagement
  view_count?: number;
  bookmark_count?: number;
  application_count?: number;
  
  created_at?: string;
}

// ============================================
// FILTER STATE FOR UI
// ============================================

export interface FilterState {
  // Text search
  title: string;
  organization: string;
  description: string;
  
  // Location filters
  city: string;
  country: string;
  
  // Job type filters
  employment_type: string;
  experience_level: string;
  remote_only: boolean | null;
  work_arrangement: string;
  
  // Salary filters
  min_salary?: number;
  max_salary?: number;
  
  // Skills
  skills: string[];
  
  // Other filters
  visa_sponsorship: boolean | null;
  posted_within_days?: number;
}

// ============================================
// USER JOB ALERTS
// ============================================

export interface UserJobAlert {
  id?: number;
  user_id: string;
  email: string;
  
  // Preferences
  keywords: string[];
  locations: string[];
  job_types: string[];
  experience_levels: string[];
  skills: string[];
  min_salary?: number;
  max_salary?: number;
  remote_only: boolean;
  visa_sponsorship_required: boolean;
  
  // Settings
  frequency: 'daily' | 'weekly' | 'immediate';
  is_active: boolean;
  last_sent?: string;
  
  created_at?: string;
  updated_at?: string;
}

// ============================================
// APIFY RAW DATA TYPES
// ============================================

export interface ApifyJobData {
  // Core fields from Apify API
  id: string;
  title: string;
  organization: string;
  organization_url?: string;
  organization_logo?: string;
  date_posted?: string;
  date_created?: string;
  date_validthrough?: string;
  locations_raw?: any[];
  locations_alt_raw?: string[];
  locations_derived?: string[];
  location_type?: string;
  location_requirements_raw?: any[];
  salary_raw?: any;
  employment_type?: string[];
  url?: string;
  source?: string;
  source_type?: string;
  source_domain?: string;
  description_text?: string;
  description_html?: string;
  cities_derived?: any[];
  regions_derived?: any[];
  countries_derived?: any[];
  timezones_derived?: any[];
  lats_derived?: any[];
  lngs_derived?: any[];
  remote_derived?: boolean;
  date_modified?: string;
  modified_fields?: string[];
  domain_derived?: string;
  
  // AI fields (if include_ai=true)
  ai_salary_currency?: string;
  ai_salary_value?: number;
  ai_salary_minvalue?: number;
  ai_salary_maxvalue?: number;
  ai_salary_unittext?: string;
  ai_benefits?: string[];
  ai_experience_level?: string;
  ai_work_arrangement?: string;
  ai_work_arrangement_office_days?: number;
  ai_remote_location?: string[];
  ai_remote_location_derived?: string[];
  ai_key_skills?: string[];
  ai_hiring_manager_name?: string;
  ai_hiring_manager_email_address?: string;
  ai_core_responsibilities?: string;
  ai_requirements_summary?: string;
  ai_working_hours?: number;
  ai_employment_type?: string[];
  ai_job_language?: string;
  ai_visa_sponsorship?: boolean;
  ai_keywords?: string[];
  ai_taxonomies_a?: string[];
  ai_education_requirements?: string[];
  
  // LinkedIn fields (if include_li=true)
  linkedin_org_employees?: number;
  linkedin_org_url?: string;
  linkedin_org_size?: string;
  linkedin_org_slogan?: string;
  linkedin_org_industry?: string;
  linkedin_org_followers?: number;
  linkedin_org_headquarters?: string;
  linkedin_org_type?: string;
  linkedin_org_foundeddate?: string;
  linkedin_org_specialties?: string[];
  linkedin_org_locations?: string[];
  linkedin_org_description?: string;
  linkedin_org_recruitment_agency_derived?: boolean;
  linkedin_org_slug?: string;
}

// ============================================
// APIFY CONFIGURATION
// ============================================

export interface ApifyRunConfig {
  timeframe?: '1hour' | '24hours' | '7days';
  locationSearch?: string[]; // Array of location terms to search (e.g., ['Netherlands'])
  locationExclusionSearch?: string[]; // Array of location terms to exclude
  titleSearch?: string[]; // Array of terms to search in job titles
  titleExclusionSearch?: string[]; // Array of terms to exclude from job titles
  organizationSearch?: string[]; // Array of terms to search in organization names
  organizationExclusionSearch?: string[]; // Array of terms to exclude from organization names
  limit?: number;
  include_ai?: boolean;
  include_li?: boolean;
}

// ============================================
// USAGE TRACKING
// ============================================

export interface ApifyUsageLog {
  id?: number;
  date: string;
  actor: string;
  job_count: number;
  cost: number;
  notes?: string;
  run_status?: 'success' | 'failed' | 'partial';
  error_message?: string;
  created_at?: string;
}

// ============================================
// HELPER TYPES
// ============================================

export interface LocationDerived {
  city?: string;
  admin?: string;  // state/province
  country?: string;
}

export interface SalaryRaw {
  '@type'?: string;
  currency?: string;
  value?: number;
  minValue?: number;
  maxValue?: number;
  unitText?: string;
}

export type ExperienceLevel = '0-2' | '2-5' | '5-10' | '10+';
export type WorkArrangement = 'Remote Solely' | 'Remote OK' | 'Hybrid' | 'On-site';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY' | 'INTERN' | 'VOLUNTEER' | 'PER_DIEM' | 'OTHER';
