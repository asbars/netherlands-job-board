/**
 * Filter Pill Component
 * Displays a single filter as a removable pill/tag
 */

'use client';

import { FilterCondition } from '@/types/filters';
import { OPERATOR_LABELS, getFilterFields } from '@/lib/filterConfig';
import { DynamicOptions } from '@/lib/dynamicFilterOptions';
import { Badge } from '@/components/ui/badge';

interface FilterPillProps {
  filter: FilterCondition;
  onRemove: () => void;
  onEdit: () => void;
  dynamicOptions?: DynamicOptions;
}

export default function FilterPill({ filter, onRemove, onEdit, dynamicOptions }: FilterPillProps) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';

    if (Array.isArray(value)) {
      if (value.length === 0) return '';

      // Get field configuration to look up labels
      const filterFields = getFilterFields(dynamicOptions);
      const field = filterFields.find(f => f.key === filter.field);

      // Format each value by looking up its label from field options
      const formattedValues = value.map((val) => {
        if (field && field.options) {
          const option = field.options.find(opt => opt.value === val);
          if (option) {
            return option.label;
          }
        }
        return String(val);
      });

      if (formattedValues.length === 1) return formattedValues[0];
      if (formattedValues.length === 2) return formattedValues.join(' or ');
      return `${formattedValues.slice(0, 2).join(', ')} or ${formattedValues.length - 2} more`;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    // For single values, also look up label from field options
    const filterFields = getFilterFields(dynamicOptions);
    const field = filterFields.find(f => f.key === filter.field);
    if (field && field.options) {
      const option = field.options.find(opt => opt.value === value);
      if (option) {
        return option.label;
      }
    }

    return String(value);
  };

  return (
    <Badge variant="secondary" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm hover:bg-secondary/80 transition-colors">
      <button
        onClick={onEdit}
        className="flex items-center gap-1.5 hover:underline"
        title="Click to edit filter"
      >
        <span className="font-medium">{filter.fieldLabel}</span>
        <span className="text-muted-foreground text-xs">{OPERATOR_LABELS[filter.operator]}</span>
        <span className="font-medium">{formatValue(filter.value)}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        aria-label="Remove filter"
        title="Remove filter"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </Badge>
  );
}

