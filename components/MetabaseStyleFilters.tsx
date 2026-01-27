/**
 * Metabase-Style Filter Panel Component
 * Main filter UI with pills, add button, and result count
 */

'use client';

import { useState } from 'react';
import { FilterCondition } from '@/types/filters';
import FilterPill from './FilterPill';
import AddFilterModal from './AddFilterModal';
import { getFilterDescription } from '@/lib/filterEngine';
import { DynamicOptions } from '@/lib/dynamicFilterOptions';

interface MetabaseStyleFiltersProps {
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  resultCount: number;
  totalCount: number;
  dynamicOptions?: DynamicOptions;
}

export default function MetabaseStyleFilters({
  filters,
  onFiltersChange,
  resultCount,
  totalCount,
  dynamicOptions,
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <p className="text-xs text-gray-500 mt-0.5">{getFilterDescription(filters)}</p>
          </div>
          {filters.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="px-6 py-4">
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map((filter) => (
              <FilterPill
                key={filter.id}
                filter={filter}
                onRemove={() => handleRemoveFilter(filter.id)}
                onEdit={() => handleEditFilter(filter)}
              />
            ))}
          </div>
        )}

        {/* Add Filter Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add filter
        </button>
      </div>

      {/* Result Count */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{resultCount.toLocaleString()}</span> 
            {' '}of{' '}
            <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span> jobs
          </p>
          {filters.length > 0 && resultCount === 0 && (
            <span className="text-xs text-amber-600 font-medium">
              Try adjusting filters
            </span>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
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
    </div>
  );
}

