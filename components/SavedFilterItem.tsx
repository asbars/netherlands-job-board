/**
 * Saved Filter Item Component
 * Displays a single saved filter with expand/collapse, rename, and delete functionality
 */

'use client';

import { useState } from 'react';
import { SavedFilter } from '@/types/savedFilters';
import { FilterCondition } from '@/types/filters';
import { Button } from '@/components/ui/button';
import { getFilterFields } from '@/lib/filterConfig';
import { DynamicOptions } from '@/lib/dynamicFilterOptions';

interface SavedFilterItemProps {
  filter: SavedFilter;
  onApply: (filters: FilterCondition[], filterId: number) => void;
  onRename: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggleNotifications: (id: number, enabled: boolean) => Promise<void>;
  dynamicOptions?: DynamicOptions;
}

export default function SavedFilterItem({
  filter,
  onApply,
  onRename,
  onDelete,
  onToggleNotifications,
  dynamicOptions,
}: SavedFilterItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(filter.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleApplyFilter = () => {
    onApply(filter.filters, filter.id);
  };

  const handleToggleNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTogglingNotifications(true);
    setError(null);

    try {
      await onToggleNotifications(filter.id, !filter.notifications_enabled);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle notifications');
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  const handleRename = async () => {
    if (!editName.trim() || editName === filter.name) {
      setIsEditing(false);
      setEditName(filter.name);
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      await onRename(filter.id, editName.trim());
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to rename filter');
      setEditName(filter.name);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${filter.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(filter.id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete filter');
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(filter.name);
    }
  };

  const getFieldLabel = (fieldKey: string): string => {
    const fields = getFilterFields(dynamicOptions);
    return fields.find((f) => f.key === fieldKey)?.label || fieldKey;
  };

  const getOperatorLabel = (operator: string): string => {
    const labels: Record<string, string> = {
      contains: 'contains',
      not_contains: 'does not contain',
      equals: 'is',
      not_equals: 'is not',
      is_any_of: 'is any of',
      is_not_any_of: 'is not any of',
      greater_than: 'is greater than',
      less_than: 'is less than',
      between: 'is between',
      is_empty: 'is empty',
      is_not_empty: 'is not empty',
    };
    return labels[operator] || operator;
  };

  const formatValue = (condition: FilterCondition): string => {
    if (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') {
      return '';
    }

    if (Array.isArray(condition.value)) {
      if (condition.operator === 'between') {
        return `${condition.value[0]} and ${condition.value[1]}`;
      }
      return condition.value.join(', ');
    }

    return String(condition.value);
  };

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {/* Header */}
      <div className="group flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Chevron button - only toggles expand/collapse */}
          <button
            onClick={handleToggleExpand}
            className="flex-shrink-0 p-1 hover:bg-muted-foreground/10 rounded transition-colors"
            disabled={isDeleting}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Filter name - applies filter when clicked */}
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRename}
              className="flex-1 min-w-0 px-2 py-1 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              disabled={isRenaming}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              onClick={handleApplyFilter}
              className="flex-1 min-w-0 text-left text-sm font-medium truncate hover:text-primary transition-colors flex items-center gap-2"
              disabled={isDeleting}
            >
              <span className="truncate">{filter.name}</span>
              {/* New job count badge */}
              {filter.new_job_count !== undefined && filter.new_job_count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-medium rounded-full flex-shrink-0 ${
                    filter.notifications_enabled
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {filter.new_job_count}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Bell toggle - notifications */}
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleNotifications}
              disabled={isDeleting || isTogglingNotifications}
              className="h-7 px-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              title={filter.notifications_enabled ? 'Disable notifications' : 'Enable notifications'}
            >
              {isTogglingNotifications ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : filter.notifications_enabled ? (
                // Filled bell icon when notifications enabled
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              ) : (
                // Outline bell icon when notifications disabled
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
            </Button>
          )}
          {/* Edit button */}
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              disabled={isDeleting}
              className="h-7 px-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Button>
          )}
          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-7 px-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
          >
            {isDeleting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-t border-border">
          {error}
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-3 border-t border-border space-y-2 bg-background">
          {filter.filters.length === 0 ? (
            <p className="text-xs text-muted-foreground">No filters saved</p>
          ) : (
            filter.filters.map((condition, index) => (
              <div key={index} className="text-xs">
                <span className="font-medium text-foreground">
                  {getFieldLabel(condition.field)}
                </span>
                {' '}
                <span className="text-muted-foreground">
                  {getOperatorLabel(condition.operator)}
                </span>
                {formatValue(condition) && (
                  <>
                    {' '}
                    <span className="font-medium text-foreground">
                      {formatValue(condition)}
                    </span>
                  </>
                )}
                {condition.salary_period && (
                  <span className="text-muted-foreground">
                    {' '}({condition.salary_period})
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
