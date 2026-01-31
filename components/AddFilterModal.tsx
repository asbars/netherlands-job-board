/**
 * Add Filter Modal Component
 * Guided 3-step process: Select Field → Select Operator → Enter Value
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { FilterField, FilterCondition, FilterOperator, SalaryPeriod } from '@/types/filters';
import { getFilterFields, OPERATOR_LABELS } from '@/lib/filterConfig';
import { DynamicOptions } from '@/lib/dynamicFilterOptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SUPPORTED_CURRENCIES, getExchangeRate } from '@/lib/currencyConverter';

interface AddFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (filter: FilterCondition) => void;
  onUpdate?: (filter: FilterCondition) => void;
  editingFilter?: FilterCondition | null;
  dynamicOptions?: DynamicOptions;
}

export default function AddFilterModal({ isOpen, onClose, onAdd, onUpdate, editingFilter, dynamicOptions }: AddFilterModalProps) {
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator | null>(null);
  const [value, setValue] = useState<any>(null);
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod | null>(null);
  const [salaryCurrency, setSalaryCurrency] = useState<string>('EUR'); // Default to EUR
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Get filter fields with dynamic options - memoized to prevent re-renders
  const filterFields = useMemo(() => getFilterFields(dynamicOptions), [dynamicOptions]);

  const isEditing = !!editingFilter;

  // Initialize state when modal opens (for editing or new)
  useEffect(() => {
    if (isOpen && editingFilter) {
      // Pre-populate fields when editing
      const field = filterFields.find((f) => f.key === editingFilter.field);
      setSelectedField(field || null);
      setSelectedOperator(editingFilter.operator);
      setValue(editingFilter.value);
      setSalaryPeriod(editingFilter.salary_period || null);
      setSalaryCurrency(editingFilter.salary_currency || 'EUR');
      setExchangeRate(editingFilter.exchange_rate || 1);
    } else if (!isOpen) {
      // Reset state when modal closes
      setSelectedField(null);
      setSelectedOperator(null);
      setValue(null);
      setSalaryPeriod(null);
      setSalaryCurrency('EUR');
      setExchangeRate(1);
      setLoadingRate(false);
      setRateError(null);
    }
  }, [isOpen, editingFilter?.id, filterFields]);

  // Fetch exchange rate when currency changes
  // Note: We'll fetch rates for all database currencies to the selected currency
  // This happens when user changes currency selection
  useEffect(() => {
    if (!selectedField?.isSalaryField || !salaryCurrency) return;

    // For now, we just set exchange rate to 1
    // The actual conversion will happen in the backend based on each job's currency
    setExchangeRate(1);
  }, [salaryCurrency, selectedField]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!selectedField || !selectedOperator) return;

    // For salary fields, validate that period and currency are selected
    if (selectedField.isSalaryField && selectedOperator !== 'is_empty' && selectedOperator !== 'is_not_empty') {
      if (!salaryPeriod || !salaryCurrency) return;
    }

    // Validate value based on operator
    if (selectedOperator !== 'is_empty' && selectedOperator !== 'is_not_empty') {
      if (value === null || value === undefined || value === '') return;
      if (Array.isArray(value) && value.length === 0) return;
    }

    // Auto-swap dates for 'between' operator if they're in reverse order
    let finalValue = value;
    if (selectedOperator === 'between' && Array.isArray(value) && value.length === 2) {
      const [start, end] = value;
      if (selectedField.type === 'date' && start && end && start > end) {
        finalValue = [end, start]; // Swap to ensure start <= end
      }
      if (selectedField.type === 'number' && start && end && start > end) {
        finalValue = [end, start]; // Swap to ensure min <= max
      }
    }

    const filterData: FilterCondition = {
      id: isEditing && editingFilter ? editingFilter.id : `${Date.now()}-${Math.random()}`,
      field: selectedField.key,
      fieldLabel: selectedField.label,
      operator: selectedOperator,
      value: finalValue,
      ...(selectedField.isSalaryField && salaryPeriod && { salary_period: salaryPeriod }),
      ...(selectedField.isSalaryField && salaryCurrency && { salary_currency: salaryCurrency }),
    };

    if (isEditing && onUpdate) {
      onUpdate(filterData);
    } else {
      onAdd(filterData);
    }

    onClose();
  };

  const canAdd = () => {
    if (!selectedField || !selectedOperator) return false;

    // Empty/not empty operators don't need a value
    if (selectedOperator === 'is_empty' || selectedOperator === 'is_not_empty') {
      return true;
    }

    // For salary fields, check that period and currency are selected
    if (selectedField.isSalaryField && (!salaryPeriod || !salaryCurrency)) return false;

    // Check if value is provided
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;

    return true;
  };

  const renderValueInput = () => {
    if (!selectedField || !selectedOperator) return null;

    // Empty operators don't need value input
    if (selectedOperator === 'is_empty' || selectedOperator === 'is_not_empty') {
      return (
        <div className="text-sm text-muted-foreground italic">
          No value needed for this condition
        </div>
      );
    }

    switch (selectedField.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder={selectedField.placeholder}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background placeholder-muted-foreground"
            autoFocus
          />
        );

      case 'number':
        if (selectedOperator === 'between') {
          const [min, max] = Array.isArray(value) ? value : [null, null];
          return (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={min || ''}
                onChange={(e) => setValue([Number(e.target.value), max])}
                placeholder="Min"
                className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground bg-background placeholder-muted-foreground"
              />
              <span className="text-muted-foreground">and</span>
              <input
                type="number"
                value={max || ''}
                onChange={(e) => setValue([min, Number(e.target.value)])}
                placeholder="Max"
                className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground bg-background placeholder-muted-foreground"
              />
            </div>
          );
        }
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => setValue(Number(e.target.value))}
            placeholder={selectedField.placeholder}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground bg-background placeholder-muted-foreground"
            autoFocus
          />
        );

      case 'select':
        if (selectedOperator === 'is_any_of') {
          // Multi-select for is_any_of operator
          return (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-input rounded-lg p-3">
              {selectedField.options?.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-accent p-1 rounded">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(opt.value)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        setValue([...currentValues, opt.value]);
                      } else {
                        setValue(currentValues.filter((v) => v !== opt.value));
                      }
                    }}
                    className="rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          );
        }

        return (
          <select
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground bg-background"
          >
            <option value="">Select...</option>
            {selectedField.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        // Text search operators show a text input
        if (selectedOperator === 'contains' || selectedOperator === 'not_contains') {
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => setValue(e.target.value)}
              placeholder={selectedField.placeholder || `Search in ${selectedField.label.toLowerCase()}...`}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background placeholder-muted-foreground"
              autoFocus
            />
          );
        }
        // Selection operators show checkbox list
        return (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-input rounded-lg p-3">
            {selectedField.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-accent p-1 rounded">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      setValue([...currentValues, opt.value]);
                    } else {
                      setValue(currentValues.filter((v) => v !== opt.value));
                    }
                  }}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <select
            value={value === null ? '' : String(value)}
            onChange={(e) => setValue(e.target.value === 'true')}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground bg-background"
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case 'date':
        if (selectedOperator === 'between') {
          const [start, end] = Array.isArray(value) ? value : ['', ''];
          return (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={start || ''}
                onChange={(e) => setValue([e.target.value, end])}
                className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground bg-background"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={end || ''}
                onChange={(e) => setValue([start, e.target.value])}
                className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground bg-background"
              />
            </div>
          );
        }
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground bg-background"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-card border-b px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle>{isEditing ? 'Edit Filter' : 'Add Filter'}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Step 1: Select Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              1. What do you want to filter?
            </label>
            <select
              value={selectedField?.key || ''}
              onChange={(e) => {
                const field = filterFields.find((f) => f.key === e.target.value);
                setSelectedField(field || null);
                setSelectedOperator(null);
                setValue(null);
              }}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
            >
              <option value="">Choose a field...</option>
              {filterFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                  {field.options && field.options.length > 0 && ` (${field.options.length} options)`}
                </option>
              ))}
            </select>
            {selectedField?.description && (
              <p className="mt-1 text-xs text-muted-foreground">{selectedField.description}</p>
            )}
          </div>

          {/* Step 2: Select Salary Period (for salary fields only) */}
          {selectedField?.isSalaryField && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                2. Select salary period
              </label>
              <select
                value={salaryPeriod || ''}
                onChange={(e) => setSalaryPeriod(e.target.value as SalaryPeriod)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
              >
                <option value="">Choose a period...</option>
                <option value="per hour">Per Hour</option>
                <option value="per month">Per Month</option>
                <option value="per year">Per Year</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                All salaries will be converted to this period for comparison
              </p>
            </div>
          )}

          {/* Step 3: Select Currency (for salary fields only) */}
          {selectedField?.isSalaryField && salaryPeriod && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                3. Select currency
              </label>
              <select
                value={salaryCurrency}
                onChange={(e) => setSalaryCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                All salaries will be converted to {salaryCurrency} using current exchange rates
              </p>
            </div>
          )}

          {/* Step 4 (or 2 for non-salary): Select Operator */}
          {selectedField && (!selectedField.isSalaryField || (salaryPeriod && salaryCurrency)) && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {selectedField.isSalaryField ? '4' : '2'}. How do you want to filter?
              </label>
              <select
                value={selectedOperator || ''}
                onChange={(e) => {
                  setSelectedOperator(e.target.value as FilterOperator);
                  setValue(null);
                }}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-background"
              >
                <option value="">Choose a condition...</option>
                {selectedField.operators.map((op) => (
                  <option key={op} value={op}>
                    {OPERATOR_LABELS[op]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 5 (or 3 for non-salary): Enter Value */}
          {selectedOperator && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {selectedField?.isSalaryField && selectedOperator !== 'is_empty' && selectedOperator !== 'is_not_empty' ? '5' : '3'}. What value?
              </label>
              {renderValueInput()}
            </div>
          )}
        </CardContent>

        <div className="sticky bottom-0 bg-muted px-6 py-4 flex gap-3 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canAdd()}
            className="flex-1"
          >
            {isEditing ? 'Update Filter' : 'Add Filter'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

