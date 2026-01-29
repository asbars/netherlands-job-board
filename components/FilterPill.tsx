/**
 * Filter Pill Component
 * Displays a single filter as a removable pill/tag
 */

'use client';

import { FilterCondition } from '@/types/filters';
import { OPERATOR_LABELS } from '@/lib/filterConfig';
import { Badge } from '@/components/ui/badge';

interface FilterPillProps {
  filter: FilterCondition;
  onRemove: () => void;
  onEdit: () => void;
}

export default function FilterPill({ filter, onRemove, onEdit }: FilterPillProps) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';

    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      if (value.length === 1) return String(value[0]);
      if (value.length === 2) return value.join(' or ');
      return `${value.slice(0, 2).join(', ')} or ${value.length - 2} more`;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
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

