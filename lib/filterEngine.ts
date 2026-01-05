/**
 * Filter Engine - Applies filters to job data
 */

import { Job } from '@/types/job';
import { FilterCondition } from '@/types/filters';

/**
 * Apply all filters to jobs array
 * Uses AND logic between different filters
 * Uses OR logic for multiselect values within the same filter
 */
export function applyFilters(jobs: Job[], filters: FilterCondition[]): Job[] {
  if (filters.length === 0) return jobs;

  return jobs.filter((job) => {
    // ALL filters must match (AND logic between filters)
    return filters.every((filter) => matchesFilter(job, filter));
  });
}

/**
 * Check if a job matches a specific filter condition
 */
function matchesFilter(job: Job, filter: FilterCondition): boolean {
  const fieldValue = getFieldValue(job, filter.field);

  switch (filter.operator) {
    case 'contains':
      if (!fieldValue) return false;
      if (Array.isArray(fieldValue)) {
        // For array fields, check if any element contains the value
        return fieldValue.some((v) => 
          String(v).toLowerCase().includes(String(filter.value).toLowerCase())
        );
      }
      return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());

    case 'not_contains':
      if (!fieldValue) return true;
      if (Array.isArray(fieldValue)) {
        return !fieldValue.some((v) => 
          String(v).toLowerCase().includes(String(filter.value).toLowerCase())
        );
      }
      return !String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());

    case 'equals':
      return fieldValue === filter.value;

    case 'not_equals':
      return fieldValue !== filter.value;

    case 'is_any_of':
      if (!Array.isArray(filter.value) || filter.value.length === 0) return true;
      
      if (Array.isArray(fieldValue)) {
        // Field is array (e.g., cities_derived), check if any match
        return fieldValue.some((v) => filter.value.includes(v));
      }
      // Field is single value, check if it's in filter values
      return filter.value.includes(fieldValue);

    case 'is_not_any_of':
      if (!Array.isArray(filter.value) || filter.value.length === 0) return true;
      
      if (Array.isArray(fieldValue)) {
        return !fieldValue.some((v) => filter.value.includes(v));
      }
      return !filter.value.includes(fieldValue);

    case 'greater_than':
      if (fieldValue === null || fieldValue === undefined) return false;
      return Number(fieldValue) > Number(filter.value);

    case 'less_than':
      if (fieldValue === null || fieldValue === undefined) return false;
      return Number(fieldValue) < Number(filter.value);

    case 'between':
      if (fieldValue === null || fieldValue === undefined) return false;
      if (!Array.isArray(filter.value) || filter.value.length !== 2) return false;
      const [min, max] = filter.value;
      return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);

    case 'is_empty':
      return !fieldValue || 
             fieldValue === '' || 
             (Array.isArray(fieldValue) && fieldValue.length === 0);

    case 'is_not_empty':
      return !!fieldValue && 
             fieldValue !== '' && 
             (!Array.isArray(fieldValue) || fieldValue.length > 0);

    default:
      return true;
  }
}

/**
 * Get field value from job object, supporting nested paths
 */
function getFieldValue(job: any, field: string): any {
  // Support nested fields with dot notation (e.g., "company.name")
  return field.split('.').reduce((obj, key) => obj?.[key], job);
}

/**
 * Get a human-readable description of active filters
 */
export function getFilterDescription(filters: FilterCondition[]): string {
  if (filters.length === 0) return 'No filters applied';
  if (filters.length === 1) return '1 filter applied';
  return `${filters.length} filters applied`;
}

