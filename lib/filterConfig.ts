/**
 * Filter Configuration for Metabase-Style Filtering
 * Defines all available fields and their filter options
 */

import { FilterField, FilterOperator } from '@/types/filters';

export const FILTER_FIELDS: FilterField[] = [
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
    options: [
      { value: 'Amsterdam', label: 'Amsterdam' },
      { value: 'Rotterdam', label: 'Rotterdam' },
      { value: 'Utrecht', label: 'Utrecht' },
      { value: 'The Hague', label: 'The Hague' },
      { value: 'Eindhoven', label: 'Eindhoven' },
      { value: 'Groningen', label: 'Groningen' },
      { value: 'Tilburg', label: 'Tilburg' },
      { value: 'Almere', label: 'Almere' },
      { value: 'Breda', label: 'Breda' },
      { value: 'Nijmegen', label: 'Nijmegen' },
    ],
    description: 'Filter by city location',
  },
  {
    key: 'employment_type',
    label: 'Employment Type',
    type: 'multiselect',
    operators: ['is_any_of', 'is_not_any_of'],
    options: [
      { value: 'Full Time', label: 'Full Time' },
      { value: 'Part Time', label: 'Part Time' },
      { value: 'Contract', label: 'Contract' },
      { value: 'Internship', label: 'Internship' },
      { value: 'Temporary', label: 'Temporary' },
      { value: 'Volunteer', label: 'Volunteer' },
    ],
    description: 'Filter by employment type',
  },
  {
    key: 'ai_experience_level',
    label: 'Experience Level',
    type: 'select',
    operators: ['equals', 'not_equals', 'is_any_of'],
    options: [
      { value: '0-2', label: '0-2 years (Entry Level)' },
      { value: '2-5', label: '2-5 years (Mid Level)' },
      { value: '5-10', label: '5-10 years (Senior)' },
      { value: '10+', label: '10+ years (Expert)' },
    ],
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
    options: [
      { value: 'Remote Solely', label: 'Remote Only' },
      { value: 'Remote OK', label: 'Remote Optional' },
      { value: 'Hybrid', label: 'Hybrid' },
      { value: 'On-site', label: 'On-site' },
    ],
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
    type: 'text',
    operators: ['equals', 'not_equals', 'contains'],
    placeholder: 'e.g., greenhouse, lever',
    description: 'Job posting source/ATS',
  },
  {
    key: 'linkedin_org_industry',
    label: 'Industry',
    type: 'text',
    operators: ['contains', 'equals', 'not_equals'],
    placeholder: 'e.g., Technology, Finance',
    description: 'Company industry',
  },
];

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

