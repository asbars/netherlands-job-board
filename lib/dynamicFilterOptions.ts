/**
 * Dynamic Filter Options
 * Extracts unique values from job data for filter dropdowns
 */

import { Job } from '@/types/job';

export interface DynamicOptions {
  cities: { value: string; label: string }[];
  employmentTypes: { value: string; label: string }[];
  experienceLevels: { value: string; label: string }[];
  workArrangements: { value: string; label: string }[];
  sources: { value: string; label: string }[];
  industries: { value: string; label: string }[];
}

/**
 * Extract unique values from an array field across all jobs
 */
function extractUniqueArrayValues(jobs: Job[], fieldGetter: (job: Job) => any[] | undefined | null): string[] {
  const valuesSet = new Set<string>();
  
  jobs.forEach(job => {
    const values = fieldGetter(job);
    if (Array.isArray(values)) {
      values.forEach(value => {
        if (value && typeof value === 'string') {
          valuesSet.add(value);
        } else if (value && typeof value === 'object') {
          // Handle objects like { city: "Amsterdam", admin: "North Holland", country: "Netherlands" }
          if ('city' in value && value.city) {
            valuesSet.add(value.city);
          }
        }
      });
    }
  });
  
  return Array.from(valuesSet).sort();
}

/**
 * Extract unique values from a regular field across all jobs
 */
function extractUniqueValues(jobs: Job[], fieldGetter: (job: Job) => any): string[] {
  const valuesSet = new Set<string>();
  
  jobs.forEach(job => {
    const value = fieldGetter(job);
    if (value && typeof value === 'string') {
      valuesSet.add(value);
    }
  });
  
  return Array.from(valuesSet).sort();
}

/**
 * Generate filter options from actual job data
 */
export function generateDynamicOptions(jobs: Job[]): DynamicOptions {
  // Extract cities from cities_derived array
  const cityValues = extractUniqueArrayValues(jobs, job => job.cities_derived);
  const cities = cityValues.map(city => ({
    value: city,
    label: city,
  }));

  // Extract employment types from employment_type array
  const employmentTypeValues = extractUniqueArrayValues(jobs, job => job.employment_type);
  const employmentTypes = employmentTypeValues.map(type => ({
    value: type,
    label: type,
  }));

  // Extract experience levels from ai_experience_level
  const experienceLevelValues = extractUniqueValues(jobs, job => job.ai_experience_level);
  const experienceLevels = experienceLevelValues.map(level => ({
    value: level,
    label: formatExperienceLevel(level),
  }));

  // Extract work arrangements from ai_work_arrangement
  const workArrangementValues = extractUniqueValues(jobs, job => job.ai_work_arrangement);
  const workArrangements = workArrangementValues.map(arrangement => ({
    value: arrangement,
    label: arrangement,
  }));

  // Extract sources
  const sourceValues = extractUniqueValues(jobs, job => job.source);
  const sources = sourceValues.map(source => ({
    value: source,
    label: source.charAt(0).toUpperCase() + source.slice(1), // Capitalize
  }));

  // Extract industries from LinkedIn data
  const industryValues = extractUniqueValues(jobs, job => job.linkedin_org_industry);
  const industries = industryValues.map(industry => ({
    value: industry,
    label: industry,
  }));

  return {
    cities,
    employmentTypes,
    experienceLevels,
    workArrangements,
    sources,
    industries,
  };
}

/**
 * Format experience level for display
 */
function formatExperienceLevel(level: string): string {
  const mapping: Record<string, string> = {
    '0-2': '0-2 years (Entry Level)',
    '2-5': '2-5 years (Mid Level)',
    '5-10': '5-10 years (Senior)',
    '10+': '10+ years (Expert)',
  };
  return mapping[level] || level;
}

/**
 * Get empty options structure
 */
export function getEmptyOptions(): DynamicOptions {
  return {
    cities: [],
    employmentTypes: [],
    experienceLevels: [],
    workArrangements: [],
    sources: [],
    industries: [],
  };
}

