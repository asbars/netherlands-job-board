/**
 * Formatting Utilities
 * Converts machine-readable values to human-readable labels
 */

/**
 * Format employment type for display
 * Converts: FULL_TIME → Full-time, PART_TIME → Part-time, etc.
 */
export function formatEmploymentType(value: string | undefined | null): string {
  if (!value) return '';
  
  const mapping: Record<string, string> = {
    'FULL_TIME': 'Full-time',
    'PART_TIME': 'Part-time',
    'CONTRACTOR': 'Contractor',
    'CONTRACT': 'Contract',
    'TEMPORARY': 'Temporary',
    'INTERN': 'Intern',
    'INTERNSHIP': 'Internship',
    'VOLUNTEER': 'Volunteer',
    'PER_DIEM': 'Per Diem',
    'OTHER': 'Other',
  };
  
  // Check if exact match exists
  if (mapping[value.toUpperCase()]) {
    return mapping[value.toUpperCase()];
  }
  
  // If it's already formatted (e.g., "Full-time"), return as-is
  if (value.includes('-') || value.includes(' ')) {
    return value;
  }
  
  // Otherwise, capitalize first letter and lowercase the rest
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Format work arrangement for display
 */
export function formatWorkArrangement(value: string | undefined | null): string {
  if (!value) return '';
  
  const mapping: Record<string, string> = {
    'REMOTE_SOLELY': 'Remote Only',
    'REMOTE_OK': 'Remote OK',
    'HYBRID': 'Hybrid',
    'ON_SITE': 'On-site',
    'ONSITE': 'On-site',
    'ON-SITE': 'On-site',
  };
  
  const upperValue = value.toUpperCase().replace(/\s+/g, '_');
  if (mapping[upperValue]) {
    return mapping[upperValue];
  }
  
  return value;
}

/**
 * Format experience level for display
 */
export function formatExperienceLevel(value: string | undefined | null): string {
  if (!value) return '';
  
  const mapping: Record<string, string> = {
    '0-2': '0-2 years (Entry Level)',
    '2-5': '2-5 years (Mid Level)',
    '5-10': '5-10 years (Senior)',
    '10+': '10+ years (Expert)',
    'ENTRY': 'Entry Level',
    'MID': 'Mid Level',
    'SENIOR': 'Senior',
    'EXPERT': 'Expert',
    'LEAD': 'Lead',
    'MANAGER': 'Manager',
    'DIRECTOR': 'Director',
  };
  
  if (mapping[value]) {
    return mapping[value];
  }
  
  return value;
}

/**
 * Format salary unit for display
 */
export function formatSalaryUnit(value: string | undefined | null): string {
  if (!value) return '';
  
  const mapping: Record<string, string> = {
    'HOUR': 'per hour',
    'DAY': 'per day',
    'WEEK': 'per week',
    'MONTH': 'per month',
    'YEAR': 'per year',
    'ANNUAL': 'per year',
    'YEARLY': 'per year',
    'MONTHLY': 'per month',
    'WEEKLY': 'per week',
    'DAILY': 'per day',
    'HOURLY': 'per hour',
  };
  
  const upperValue = value.toUpperCase();
  if (mapping[upperValue]) {
    return mapping[upperValue];
  }
  
  // If already formatted with "per", return as-is
  if (value.toLowerCase().startsWith('per ')) {
    return value.toLowerCase();
  }
  
  return `per ${value.toLowerCase()}`;
}

/**
 * Format boolean for display
 */
export function formatBoolean(value: boolean | undefined | null): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unknown';
}

/**
 * Format array of values with proper separators
 */
export function formatArray(
  values: string[] | undefined | null,
  formatter?: (value: string) => string,
  maxItems?: number
): string {
  if (!values || values.length === 0) return '';
  
  const formatted = values.map(v => formatter ? formatter(v) : v);
  const display = maxItems ? formatted.slice(0, maxItems) : formatted;
  const remaining = maxItems && formatted.length > maxItems ? formatted.length - maxItems : 0;
  
  return display.join(', ') + (remaining > 0 ? ` +${remaining} more` : '');
}

/**
 * Format date for relative display (e.g., "2 days ago")
 */
export function formatRelativeDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}

/**
 * Format salary range for display
 */
export function formatSalaryRange(
  minValue: number | undefined | null,
  maxValue: number | undefined | null,
  exactValue: number | undefined | null,
  currency: string | undefined | null = 'EUR',
  unit: string | undefined | null = null
): string {
  const currencySymbol = getCurrencySymbol(currency);
  const formattedUnit = unit ? ` ${formatSalaryUnit(unit)}` : '';
  
  if (minValue && maxValue) {
    return `${currencySymbol}${minValue.toLocaleString()} - ${currencySymbol}${maxValue.toLocaleString()}${formattedUnit}`;
  }
  
  if (exactValue) {
    return `${currencySymbol}${exactValue.toLocaleString()}${formattedUnit}`;
  }
  
  return '';
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string | undefined | null): string {
  const mapping: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'CHF': 'CHF ',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
  };
  
  if (!currency) return '€';
  return mapping[currency.toUpperCase()] || currency + ' ';
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

