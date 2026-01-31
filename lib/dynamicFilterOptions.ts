/**
 * Dynamic Filter Options
 * Extracts unique values from job data for filter dropdowns
 */

import { Job } from '@/types/job';
import { formatEmploymentType, formatExperienceLevel, formatWorkArrangement } from './formatters';

export interface DynamicOptions {
  cities: { value: string; label: string }[];
  regions: { value: string; label: string }[];
  employmentTypes: { value: string; label: string }[];
  experienceLevels: { value: string; label: string }[];
  workArrangements: { value: string; label: string }[];
  sources: { value: string; label: string }[];
  industries: { value: string; label: string }[];
  domains: { value: string; label: string }[];
  salaryCurrencies: { value: string; label: string }[];
  salaryUnits: { value: string; label: string }[];
  languages: { value: string; label: string }[];
  skills: { value: string; label: string }[];
  keywords: { value: string; label: string }[];
  taxonomies: { value: string; label: string }[];
  benefits: { value: string; label: string }[];
  aiEmploymentTypes: { value: string; label: string }[];
  officeDaysCount?: number;
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

  // Extract regions from regions_derived array
  const regionValues = extractUniqueArrayValues(jobs, job => job.regions_derived);
  const regions = regionValues.map(region => ({
    value: region,
    label: region,
  }));

  // Extract employment types from employment_type array
  const employmentTypeValues = extractUniqueArrayValues(jobs, job => job.employment_type);
  const employmentTypes = employmentTypeValues.map(type => ({
    value: type,
    label: formatEmploymentType(type),
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
    label: formatWorkArrangement(arrangement),
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

  // Extract domains from domain_derived
  const domainValues = extractUniqueValues(jobs, job => job.domain_derived);
  const domains = domainValues.map(domain => ({
    value: domain,
    label: domain,
  }));

  // Extract salary currencies
  const currencyValues = extractUniqueValues(jobs, job => job.ai_salary_currency);
  const salaryCurrencies = currencyValues.map(currency => ({
    value: currency,
    label: currency,
  }));

  // Extract salary units
  const unitValues = extractUniqueValues(jobs, job => job.ai_salary_unittext);
  const salaryUnits = unitValues.map(unit => ({
    value: unit,
    label: unit,
  }));

  // Extract languages
  const languageValues = extractUniqueValues(jobs, job => job.ai_job_language);
  const languages = languageValues.map(lang => ({
    value: lang,
    label: lang,
  }));

  // Extract skills from ai_key_skills array
  const skillValues = extractUniqueArrayValues(jobs, job => job.ai_key_skills);
  const skills = skillValues.slice(0, 100).map(skill => ({ // Limit to top 100
    value: skill,
    label: skill,
  }));

  // Extract keywords from ai_keywords array
  const keywordValues = extractUniqueArrayValues(jobs, job => job.ai_keywords);
  const keywords = keywordValues.slice(0, 100).map(keyword => ({ // Limit to top 100
    value: keyword,
    label: keyword,
  }));

  // Extract taxonomies from ai_taxonomies_a array
  const taxonomyValues = extractUniqueArrayValues(jobs, job => job.ai_taxonomies_a);
  const taxonomies = taxonomyValues.map(taxonomy => ({
    value: taxonomy,
    label: taxonomy,
  }));

  // Extract benefits from ai_benefits array
  const benefitValues = extractUniqueArrayValues(jobs, job => job.ai_benefits);
  const benefits = benefitValues.map(benefit => ({
    value: benefit,
    label: benefit,
  }));

  // Extract AI employment types from ai_employment_type array
  const aiEmploymentTypeValues = extractUniqueArrayValues(jobs, job => job.ai_employment_type);
  const aiEmploymentTypes = aiEmploymentTypeValues.map(type => ({
    value: type,
    label: formatEmploymentType(type),
  }));

  return {
    cities,
    regions,
    employmentTypes,
    experienceLevels,
    workArrangements,
    sources,
    industries,
    domains,
    salaryCurrencies,
    salaryUnits,
    languages,
    skills,
    keywords,
    taxonomies,
    benefits,
    aiEmploymentTypes,
    // officeDaysCount will be added separately from database query
  };
}


/**
 * Get empty options structure
 */
export function getEmptyOptions(): DynamicOptions {
  return {
    cities: [],
    regions: [],
    employmentTypes: [],
    experienceLevels: [],
    workArrangements: [],
    sources: [],
    industries: [],
    domains: [],
    salaryCurrencies: [],
    salaryUnits: [],
    languages: [],
    skills: [],
    keywords: [],
    taxonomies: [],
    benefits: [],
    aiEmploymentTypes: [],
    officeDaysCount: 0,
  };
}

