/**
 * Save Filter Modal Component
 * Allows users to save current filter configuration with a custom name
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  currentCount: number;
  maxCount: number;
}

export default function SaveFilterModal({
  isOpen,
  onClose,
  onSave,
  currentCount,
  maxCount,
}: SaveFilterModalProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(name.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save filter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const remainingSlots = maxCount - currentCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Save Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {remainingSlots > 0 ? (
              <span>{remainingSlots} of {maxCount} slots remaining</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">
                Maximum number of saved filters reached
              </span>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !name.trim() || remainingSlots <= 0}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
