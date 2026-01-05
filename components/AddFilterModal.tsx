/**
 * Add Filter Modal Component
 * Guided 3-step process: Select Field → Select Operator → Enter Value
 */

'use client';

import { useState, useEffect } from 'react';
import { FilterField, FilterCondition, FilterOperator } from '@/types/filters';
import { getFilterFields, OPERATOR_LABELS } from '@/lib/filterConfig';
import { DynamicOptions } from '@/lib/dynamicFilterOptions';

interface AddFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (filter: FilterCondition) => void;
  dynamicOptions?: DynamicOptions;
}

export default function AddFilterModal({ isOpen, onClose, onAdd, dynamicOptions }: AddFilterModalProps) {
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator | null>(null);
  const [value, setValue] = useState<any>(null);
  
  // Get filter fields with dynamic options
  const filterFields = getFilterFields(dynamicOptions);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedField(null);
      setSelectedOperator(null);
      setValue(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!selectedField || !selectedOperator) return;
    
    // Validate value based on operator
    if (selectedOperator !== 'is_empty' && selectedOperator !== 'is_not_empty') {
      if (value === null || value === undefined || value === '') return;
      if (Array.isArray(value) && value.length === 0) return;
    }

    onAdd({
      id: `${Date.now()}-${Math.random()}`,
      field: selectedField.key,
      fieldLabel: selectedField.label,
      operator: selectedOperator,
      value: value,
    });

    onClose();
  };

  const canAdd = () => {
    if (!selectedField || !selectedOperator) return false;
    
    // Empty/not empty operators don't need a value
    if (selectedOperator === 'is_empty' || selectedOperator === 'is_not_empty') {
      return true;
    }
    
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
        <div className="text-sm text-gray-500 italic">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
              />
              <span className="text-gray-500">and</span>
              <input
                type="number"
                value={max || ''}
                onChange={(e) => setValue([min, Number(e.target.value)])}
                placeholder="Max"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
            autoFocus
          />
        );

      case 'select':
        if (selectedOperator === 'is_any_of') {
          // Multi-select for is_any_of operator
          return (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {selectedField.options?.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          );
        }
        
        return (
          <select
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
        return (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
            {selectedField.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <select
            value={value === null ? '' : String(value)}
            onChange={(e) => setValue(e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={end || ''}
                onChange={(e) => setValue([start, e.target.value])}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          );
        }
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add Filter</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Select Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
              <p className="mt-1 text-xs text-gray-500">{selectedField.description}</p>
            )}
          </div>

          {/* Step 2: Select Operator */}
          {selectedField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. How do you want to filter?
              </label>
              <select
                value={selectedOperator || ''}
                onChange={(e) => {
                  setSelectedOperator(e.target.value as FilterOperator);
                  setValue(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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

          {/* Step 3: Enter Value */}
          {selectedOperator && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3. What value?
              </label>
              {renderValueInput()}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!canAdd()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Add Filter
          </button>
        </div>
      </div>
    </div>
  );
}

