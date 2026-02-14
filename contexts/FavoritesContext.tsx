'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { FavoriteJob } from '@/types/favorites';

interface FavoritesContextType {
  favoriteIds: Set<number>;
  isLoading: boolean;
  toggleFavorite: (jobId: number) => Promise<void>;
  isFavorited: (jobId: number) => boolean;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<number | null>(null);

  // Fetch favorites when user signs in
  useEffect(() => {
    if (isSignedIn) {
      fetchFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [isSignedIn]);

  async function fetchFavorites() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data: FavoriteJob[] = await response.json();
        setFavoriteIds(new Set(data.map((f) => f.job_id)));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleFavorite = useCallback(async (jobId: number) => {
    if (!isSignedIn || pendingToggle === jobId) return;

    setPendingToggle(jobId);
    const wasFavorited = favoriteIds.has(jobId);

    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });

    try {
      if (wasFavorited) {
        const response = await fetch(`/api/favorites/${jobId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to remove favorite');
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobId }),
        });
        if (!response.ok) {
          throw new Error('Failed to add favorite');
        }
      }
    } catch (error) {
      // Revert on error
      console.error('Error toggling favorite:', error);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.add(jobId);
        } else {
          next.delete(jobId);
        }
        return next;
      });
    } finally {
      setPendingToggle(null);
    }
  }, [isSignedIn, favoriteIds, pendingToggle]);

  const isFavorited = useCallback((jobId: number) => {
    return favoriteIds.has(jobId);
  }, [favoriteIds]);

  const value: FavoritesContextType = {
    favoriteIds,
    isLoading,
    toggleFavorite,
    isFavorited,
    favoritesCount: favoriteIds.size,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
