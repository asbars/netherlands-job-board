/**
 * Filter URL Utilities
 * 
 * Handles serialization and deserialization of filter state to/from URL query parameters.
 * This enables:
 * - Filter persistence across page refreshes
 * - Shareable filtered search URLs
 * - Browser back/forward navigation
 */

import { FilterCondition } from '@/types/filters';

/**
 * Serialize filters to URL query string
 */
export function serializeFiltersToUrl(filters: FilterCondition[]): string {
  if (filters.length === 0) return '';
  
  // Compress the filters into a JSON string and encode it
  const compressed = filters.map(f => ({
    i: f.id,
    f: f.field,
    l: f.fieldLabel,
    o: f.operator,
    v: f.value,
  }));
  
  return encodeURIComponent(JSON.stringify(compressed));
}

/**
 * Deserialize filters from URL query string
 */
export function deserializeFiltersFromUrl(urlParam: string | null): FilterCondition[] {
  if (!urlParam) return [];
  
  try {
    const decoded = decodeURIComponent(urlParam);
    const compressed = JSON.parse(decoded);
    
    if (!Array.isArray(compressed)) return [];
    
    return compressed.map(c => ({
      id: c.i,
      field: c.f,
      fieldLabel: c.l,
      operator: c.o,
      value: c.v,
    }));
  } catch (error) {
    console.error('Error deserializing filters from URL:', error);
    return [];
  }
}

/**
 * Update URL with new filters without page reload
 */
export function updateUrlWithFilters(filters: FilterCondition[]): void {
  const params = new URLSearchParams(window.location.search);
  
  if (filters.length > 0) {
    params.set('filters', serializeFiltersToUrl(filters));
  } else {
    params.delete('filters');
  }
  
  const newUrl = params.toString() 
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  
  window.history.replaceState({}, '', newUrl);
}

/**
 * Get filters from current URL
 */
export function getFiltersFromUrl(): FilterCondition[] {
  if (typeof window === 'undefined') return [];
  
  const params = new URLSearchParams(window.location.search);
  return deserializeFiltersFromUrl(params.get('filters'));
}

