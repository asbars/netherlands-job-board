/**
 * Metabase-Style Filter Panel Component
 * Main filter UI with pills, add button, and result count
 */

'use client';

import { useState } from 'react';
import { FilterCondition } from '@/types/filters';
import { SavedFilter } from '@/types/savedFilters';
import FilterPill from './FilterPill';
import AddFilterModal from './AddFilterModal';
import SavedFiltersSection from './SavedFiltersSection';
import { getFilterDescription } from '@/lib/filterEngine';
import { DynamicOptions } from '@/lib/dynamicFilterOptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MetabaseStyleFiltersProps {
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  resultCount: number;
  totalCount: number;
  dynamicOptions?: DynamicOptions;
  isSignedIn?: boolean;
  onSaveFilter?: () => void;
  savedFilters?: SavedFilter[];
  onApplySavedFilter?: (filters: FilterCondition[], filterId: number) => void;
  onRenameSavedFilter?: (id: number, name: string) => Promise<void>;
  onDeleteSavedFilter?: (id: number) => Promise<void>;
  onToggleNotifications?: (id: number, enabled: boolean) => Promise<void>;
  isLoadingSavedFilters?: boolean;
  disabled?: boolean;
}

export default function MetabaseStyleFilters({
  filters,
  onFiltersChange,
  resultCount,
  totalCount,
  dynamicOptions,
  isSignedIn = false,
  onSaveFilter,
  savedFilters = [],
  onApplySavedFilter,
  onRenameSavedFilter,
  onDeleteSavedFilter,
  onToggleNotifications,
  isLoadingSavedFilters = false,
  disabled = false,
}: MetabaseStyleFiltersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<FilterCondition | null>(null);

  const handleAddFilter = (filter: FilterCondition) => {
    onFiltersChange([...filters, filter]);
  };

  const handleUpdateFilter = (updatedFilter: FilterCondition) => {
    onFiltersChange(filters.map((f) => (f.id === updatedFilter.id ? updatedFilter : f)));
  };

  const handleRemoveFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const handleEditFilter = (filter: FilterCondition) => {
    setEditingFilter(filter);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFilter(null);
  };

  const handleClearAll = () => {
    onFiltersChange([]);
  };

  return (
    <>
      <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={disabled ? 'text-muted-foreground' : ''}>
                {disabled ? 'Filters (viewing favorites)' : 'Filters'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{getFilterDescription(filters)}</p>
            </div>
            <div className="flex items-center gap-2">
              {isSignedIn && filters.length > 0 && onSaveFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSaveFilter}
                >
                  Save
                </Button>
              )}
              {filters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

      {/* Filter Pills */}
      <CardContent className="pb-4">
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map((filter) => (
              <FilterPill
                key={filter.id}
                filter={filter}
                onRemove={() => handleRemoveFilter(filter.id)}
                onEdit={() => handleEditFilter(filter)}
                dynamicOptions={dynamicOptions}
              />
            ))}
          </div>
        )}

        {/* Add Filter Button */}
        <Button
          variant="ghost"
          onClick={() => setIsModalOpen(true)}
          className="text-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add filter
        </Button>
      </CardContent>

      {/* Result Count */}
      <div className="px-6 py-4 bg-muted border-t rounded-b-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{resultCount.toLocaleString()}</span>
            {' '}of{' '}
            <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> jobs
          </p>
          {filters.length > 0 && resultCount === 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              Try adjusting filters
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${totalCount > 0 ? (resultCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Add/Edit Filter Modal */}
      <AddFilterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddFilter}
        onUpdate={handleUpdateFilter}
        editingFilter={editingFilter}
        dynamicOptions={dynamicOptions}
      />
    </Card>

    {/* Saved Filters Section */}
    {isSignedIn && onApplySavedFilter && onRenameSavedFilter && onDeleteSavedFilter && onToggleNotifications && (
      <SavedFiltersSection
        savedFilters={savedFilters}
        onApply={onApplySavedFilter}
        onRename={onRenameSavedFilter}
        onDelete={onDeleteSavedFilter}
        onToggleNotifications={onToggleNotifications}
        isLoading={isLoadingSavedFilters}
        dynamicOptions={dynamicOptions}
        disabled={disabled}
      />
    )}
    </>
  );
}

