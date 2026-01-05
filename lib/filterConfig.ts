/**
 * Filter Configuration for Metabase-Style Filtering
 * Defines all available fields and their filter options
 */

import { FilterField, FilterOperator } from '@/types/filters';
import { DynamicOptions } from './dynamicFilterOptions';

/**
 * Get filter fields with dynamic options
 */
export function getFilterFields(dynamicOptions?: DynamicOptions): FilterField[] {
  return [
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
    label: 'Company',
    type: 'text',
    operators: ['contains', 'not_contains', 'equals', 'not_equals'],
    placeholder: 'e.g., Google',
    description: 'Search by company name',
  },
  {
    key: 'cities_derived',
    label: 'City',
    type: 'multiselect',
    operators: ['is_any_of', 'is_not_any_of'],
    options: dynamicOptions?.cities || [],
    description: 'Filter by city location',
  },
  {
    key: 'employment_type',
    label: 'Employment Type',
    type: 'multiselect',
    operators: ['is_any_of', 'is_not_any_of'],
    options: dynamicOptions?.employmentTypes || [],
    description: 'Filter by employment type',
  },
  {
    key: 'ai_experience_level',
    label: 'Experience Level',
    type: 'select',
    operators: ['equals', 'not_equals', 'is_any_of'],
    options: dynamicOptions?.experienceLevels || [],
    description: 'Filter by required experience',
  },
  {
    key: 'remote_derived',
    label: 'Remote Work',
    type: 'boolean',
    operators: ['equals'],
    description: 'Filter remote jobs',
  },
  {
    key: 'ai_visa_sponsorship',
    label: 'Visa Sponsorship',
    type: 'boolean',
    operators: ['equals'],
    description: 'Jobs offering visa sponsorship',
  },
  {
    key: 'ai_work_arrangement',
    label: 'Work Arrangement',
    type: 'select',
    operators: ['equals', 'not_equals', 'is_any_of'],
    options: dynamicOptions?.workArrangements || [],
    description: 'Work location arrangement',
  },
  {
    key: 'ai_salary_minvalue',
    label: 'Minimum Salary (€)',
    type: 'number',
    operators: ['greater_than', 'less_than', 'between', 'equals'],
    placeholder: 'e.g., 50000',
    description: 'Filter by minimum salary',
  },
  {
    key: 'ai_key_skills',
    label: 'Skills',
    type: 'text',
    operators: ['contains', 'not_contains'],
    placeholder: 'e.g., Python, React, AWS',
    description: 'Search by required skills',
  },
  {
    key: 'source',
    label: 'Source',
    type: 'multiselect',
    operators: ['is_any_of', 'is_not_any_of'],
    options: dynamicOptions?.sources || [],
    description: 'Job posting source/ATS',
  },
  {
    key: 'linkedin_org_industry',
    label: 'Industry',
    type: 'multiselect',
    operators: ['is_any_of', 'is_not_any_of'],
    options: dynamicOptions?.industries || [],
    description: 'Company industry',
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

