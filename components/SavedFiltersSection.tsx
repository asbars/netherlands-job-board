/**
 * Saved Filters Section Component
 * Container for the list of saved filters
 */

'use client';

import { SavedFilter } from '@/types/savedFilters';
import { FilterCondition } from '@/types/filters';
import SavedFilterItem from './SavedFilterItem';
import { DynamicOptions } from '@/lib/dynamicFilterOptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SavedFiltersSectionProps {
  savedFilters: SavedFilter[];
  onApply: (filters: FilterCondition[], filterId: number) => void;
  onRename: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggleNotifications: (id: number, enabled: boolean) => Promise<void>;
  isLoading?: boolean;
  dynamicOptions?: DynamicOptions;
  disabled?: boolean;
}

export default function SavedFiltersSection({
  savedFilters,
  onApply,
  onRename,
  onDelete,
  onToggleNotifications,
  isLoading,
  dynamicOptions,
  disabled = false,
}: SavedFiltersSectionProps) {
  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saved Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading saved filters...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (savedFilters.length === 0) {
    return null;
  }

  return (
    <Card className={`mt-4 border-primary/10 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <CardTitle className={`text-base ${disabled ? 'text-muted-foreground' : ''}`}>Saved Filters</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {savedFilters.map((filter) => (
          <SavedFilterItem
            key={filter.id}
            filter={filter}
            onApply={onApply}
            onRename={onRename}
            onDelete={onDelete}
            onToggleNotifications={onToggleNotifications}
            dynamicOptions={dynamicOptions}
          />
        ))}
      </CardContent>
    </Card>
  );
}
