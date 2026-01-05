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

export interface FilterCondition {
  id: string;
  field: string;
  fieldLabel: string;
  operator: FilterOperator;
  value: any; // Can be string, number, array, boolean, etc.
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  operators: FilterOperator[];
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
}

export interface FilterState {
  conditions: FilterCondition[];
}

