/**
 * Filter Types for Metabase-Style Filtering System
 */

export type FilterOperator = 
  | 'contains' 
  | 'not_contains'
  | 'equals' 
  | 'not_equals'
  | 'is_any_of'
  | 'is_not_any_of'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'is_empty'
  | 'is_not_empty';

export type SalaryPeriod = 'per hour' | 'per month' | 'per year';

export interface FilterCondition {
  id: string;
  field: string;
  fieldLabel: string;
  operator: FilterOperator;
  value: any; // Can be string, number, array, boolean, etc.
  salary_period?: SalaryPeriod; // For salary fields only
  salary_currency?: string; // For salary fields only (e.g., 'EUR', 'USD')
  exchange_rate?: number; // Exchange rate from job currency to selected currency
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  operators: FilterOperator[];
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
  isSalaryField?: boolean; // Indicates this field requires salary unit selection
}

export interface FilterState {
  conditions: FilterCondition[];
}

