/**
 * Filter Configuration for Metabase-Style Filtering
 * Defines all available fields and their filter options
 */

import { FilterField, FilterOperator } from '@/types/filters';
import { DynamicOptions } from './dynamicFilterOptions';

/**
 * Get filter fields with dynamic options
 * Organized into logical groups for better UX
 */
export function getFilterFields(dynamicOptions?: DynamicOptions): FilterField[] {
  return [
    // ===== BASIC FILTERS =====
    {
      key: 'title',
      label: 'Job Title',
      type: 'text',
      operators: ['contains', 'not_contains', 'equals', 'not_equals'],
      placeholder: 'e.g., Software Engineer',
      description: 'Search by job title',
    },
    {
      key: 'organization',
      label: 'Company Name',
      type: 'text',
      operators: ['contains', 'not_contains', 'equals', 'not_equals'],
      placeholder: 'e.g., Google, Microsoft',
      description: 'Filter by company name',
    },
    {
      key: 'domain_derived',
      label: 'Company Domain',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains'],
      options: dynamicOptions?.domains || [],
      description: 'Filter by company website domain',
    },
    {
      key: 'date_posted',
      label: 'Posted Date',
      type: 'date',
      operators: ['greater_than', 'less_than', 'between', 'is_empty', 'is_not_empty'],
      description: 'Filter by when the job was posted',
    },

    // ===== LOCATION FILTERS =====
    {
      key: 'cities_derived',
      label: 'City',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.cities || [],
      description: 'Filter by city location',
    },
    {
      key: 'regions_derived',
      label: 'Region/Province',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.regions || [],
      description: 'Filter by region or province',
    },
    {
      key: 'remote_derived',
      label: 'Remote Job',
      type: 'boolean',
      operators: ['equals'],
      description: 'Show only remote-friendly jobs',
    },
    {
      key: 'ai_work_arrangement',
      label: 'Work Arrangement',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.workArrangements || [],
      description: 'On-site, Hybrid, Remote, etc.',
    },
    {
      key: 'ai_work_arrangement_office_days',
      label: 'Office Days per Week',
      type: 'number',
      operators: ['equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'],
      placeholder: 'e.g., 2, 3',
      description: 'Number of days in office per week (for hybrid)',
    },

    // ===== EMPLOYMENT FILTERS =====
    {
      key: 'employment_type',
      label: 'Employment Type',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.employmentTypes || [],
      description: 'Full Time, Contract, Internship, etc.',
    },
    {
      key: 'ai_employment_type',
      label: 'AI Employment Type',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.aiEmploymentTypes || [],
      description: 'AI-derived employment classification',
    },
    {
      key: 'ai_experience_level',
      label: 'Experience Level',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.experienceLevels || [],
      description: 'Entry, Mid, Senior, Expert',
    },
    {
      key: 'ai_working_hours',
      label: 'Working Hours per Week',
      type: 'number',
      operators: ['equals', 'greater_than', 'less_than', 'between', 'is_empty', 'is_not_empty'],
      placeholder: 'e.g., 40',
      description: 'Number of working hours per week',
    },

    // ===== SALARY FILTERS =====
    {
      key: 'ai_salary_minvalue',
      label: 'Minimum Salary',
      type: 'number',
      operators: ['greater_than', 'less_than', 'between', 'equals', 'is_empty', 'is_not_empty'],
      placeholder: 'e.g., 50000',
      description: 'Filter by minimum salary amount',
    },
    {
      key: 'ai_salary_maxvalue',
      label: 'Maximum Salary',
      type: 'number',
      operators: ['greater_than', 'less_than', 'between', 'equals', 'is_empty', 'is_not_empty'],
      placeholder: 'e.g., 80000',
      description: 'Filter by maximum salary amount',
    },
    {
      key: 'ai_salary_value',
      label: 'Exact Salary',
      type: 'number',
      operators: ['greater_than', 'less_than', 'between', 'equals', 'is_empty', 'is_not_empty'],
      placeholder: 'e.g., 65000',
      description: 'Filter by exact salary (when no range)',
    },
    {
      key: 'ai_salary_currency',
      label: 'Salary Currency',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.salaryCurrencies || [],
      description: 'Filter by currency (EUR, USD, etc.)',
    },
    {
      key: 'ai_salary_unittext',
      label: 'Salary Unit',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.salaryUnits || [],
      description: 'Per hour, day, month, year',
    },

    // ===== BENEFITS & COMPENSATION =====
    {
      key: 'ai_benefits',
      label: 'Benefits',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.benefits || [],
      description: 'Health insurance, pension, etc.',
    },
    {
      key: 'ai_visa_sponsorship',
      label: 'Visa Sponsorship',
      type: 'boolean',
      operators: ['equals'],
      description: 'Jobs offering visa sponsorship',
    },

    // ===== SKILLS & REQUIREMENTS =====
    {
      key: 'ai_key_skills',
      label: 'Skills',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.skills || [],
      placeholder: 'e.g., Python, React, AWS',
      description: 'Required skills for the job',
    },
    {
      key: 'ai_education_requirements',
      label: 'Education Requirements',
      type: 'text',
      operators: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
      placeholder: 'e.g., Bachelor, Master',
      description: 'Required education level',
    },
    {
      key: 'ai_keywords',
      label: 'Keywords',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.keywords || [],
      placeholder: 'e.g., leadership, agile',
      description: 'AI-extracted keywords from job description',
    },

    // ===== JOB CONTENT FILTERS =====
    {
      key: 'description_text',
      label: 'Job Description',
      type: 'text',
      operators: ['contains', 'not_contains'],
      placeholder: 'Search in full job description',
      description: 'Search within the full job description text',
    },
    {
      key: 'ai_core_responsibilities',
      label: 'Core Responsibilities',
      type: 'text',
      operators: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
      placeholder: 'Search in core responsibilities',
      description: 'AI-summarized core responsibilities',
    },
    {
      key: 'ai_requirements_summary',
      label: 'Requirements Summary',
      type: 'text',
      operators: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
      placeholder: 'Search in requirements',
      description: 'AI-summarized job requirements',
    },
    {
      key: 'ai_taxonomies_a',
      label: 'Job Categories',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.taxonomies || [],
      description: 'AI-assigned job categories/taxonomies',
    },
    {
      key: 'ai_job_language',
      label: 'Job Language',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.languages || [],
      description: 'Language of the job posting',
    },

    // ===== SOURCE & COMPANY FILTERS =====
    {
      key: 'source',
      label: 'Job Source',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.sources || [],
      description: 'ATS or job board source',
    },
    {
      key: 'linkedin_org_industry',
      label: 'Company Industry',
      type: 'multiselect',
      operators: ['is_any_of', 'is_not_any_of', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
      options: dynamicOptions?.industries || [],
      description: 'Industry classification from LinkedIn',
    },
  ];
}

/**
 * Static filter fields for fields that don't need dynamic options
 */
export const FILTER_FIELDS = getFilterFields();

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  contains: 'contains',
  not_contains: 'does not contain',
  equals: 'is',
  not_equals: 'is not',
  is_any_of: 'is any of',
  is_not_any_of: 'is not any of',
  greater_than: 'is greater than',
  less_than: 'is less than',
  between: 'is between',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};
