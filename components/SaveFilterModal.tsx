/**
 * Save Filter Modal Component
 * Allows users to save current filter configuration with a custom name,
 * update an active saved filter, or replace an existing filter by name.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActiveFilter {
  id: number;
  name: string;
}

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, updateId?: number) => Promise<void>;
  currentCount: number;
  maxCount: number;
  activeFilter?: ActiveFilter | null;
  savedFilterNames?: { id: number; name: string }[];
}

type SaveMode = 'update' | 'new';

export default function SaveFilterModal({
  isOpen,
  onClose,
  onSave,
  currentCount,
  maxCount,
  activeFilter,
  savedFilterNames = [],
}: SaveFilterModalProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<SaveMode>('update');
  const [confirmReplace, setConfirmReplace] = useState<{ id: number; name: string } | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSaveMode(activeFilter ? 'update' : 'new');
      setName('');
      setError(null);
      setIsSaving(false);
      setConfirmReplace(null);
    }
  }, [isOpen, activeFilter]);

  if (!isOpen) return null;

  const handleSave = async (overrideId?: number) => {
    const targetName = saveMode === 'update' && activeFilter ? activeFilter.name : name.trim();

    if (saveMode === 'new' && !name.trim()) {
      setError('Please enter a name');
      return;
    }

    // If saving as new, check for name conflict (unless we're already confirming a replace)
    if (saveMode === 'new' && !overrideId) {
      const existing = savedFilterNames.find(
        (f) => f.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (existing) {
        setConfirmReplace(existing);
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      if (saveMode === 'update' && activeFilter) {
        await onSave(activeFilter.name, activeFilter.id);
      } else if (overrideId) {
        // Replacing an existing filter by name
        await onSave(name.trim(), overrideId);
      } else {
        await onSave(name.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save filter');
      setConfirmReplace(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      if (confirmReplace) {
        handleSave(confirmReplace.id);
      } else {
        handleSave();
      }
    } else if (e.key === 'Escape') {
      if (confirmReplace) {
        setConfirmReplace(null);
      } else {
        onClose();
      }
    }
  };

  const remainingSlots = maxCount - currentCount;

  // Confirmation dialog for replacing existing filter
  if (confirmReplace) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Replace Existing Filter?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A filter named &ldquo;{confirmReplace.name}&rdquo; already exists. Do you want to replace it with the current filters?
            </p>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmReplace(null)}
                disabled={isSaving}
              >
                Back
              </Button>
              <Button
                onClick={() => handleSave(confirmReplace.id)}
                disabled={isSaving}
              >
                {isSaving ? 'Replacing...' : 'Replace'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Save Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode selector when there's an active filter */}
          {activeFilter && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setSaveMode('update'); setError(null); }}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                  saveMode === 'update'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-input text-muted-foreground hover:bg-muted'
                }`}
              >
                Update &ldquo;{activeFilter.name}&rdquo;
              </button>
              <button
                type="button"
                onClick={() => { setSaveMode('new'); setError(null); }}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                  saveMode === 'new'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-input text-muted-foreground hover:bg-muted'
                }`}
              >
                Save as New
              </button>
            </div>
          )}

          {/* Name input - only shown for new filters */}
          {saveMode === 'new' && (
            <div>
              <label htmlFor="filter-name" className="block text-sm font-medium mb-2">
                Filter Name
              </label>
              <input
                id="filter-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Remote React Jobs"
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                disabled={isSaving}
              />
            </div>
          )}

          {/* Update mode description */}
          {saveMode === 'update' && activeFilter && (
            <p className="text-sm text-muted-foreground">
              This will update &ldquo;{activeFilter.name}&rdquo; with your current filters.
            </p>
          )}

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {saveMode === 'new' && (
            <div className="text-xs text-muted-foreground">
              {remainingSlots > 0 ? (
                <span>{remainingSlots} of {maxCount} slots remaining</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">
                  Maximum number of saved filters reached
                </span>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSave()}
              disabled={
                isSaving ||
                (saveMode === 'new' && (
                  !name.trim() ||
                  (remainingSlots <= 0 && !savedFilterNames.some(f => f.name.toLowerCase() === name.trim().toLowerCase()))
                ))
              }
            >
              {isSaving ? 'Saving...' : saveMode === 'update' ? 'Update' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
