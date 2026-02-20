/**
 * Home Page - Netherlands Job Board
 * Features Metabase-style advanced filtering with URL persistence
 */

'use client';

import { useState, useEffect } from 'react';
import { FilterCondition } from '@/types/filters';
import { SavedFilter } from '@/types/savedFilters';
import MetabaseStyleFilters from '@/components/MetabaseStyleFilters';
import SaveFilterModal from '@/components/SaveFilterModal';
import JobList from '@/components/JobList';
import { fetchJobsCount, fetchJobsSample, countJobsWithOfficeDays } from '@/lib/supabase';
import { generateDynamicOptions, DynamicOptions, getEmptyOptions } from '@/lib/dynamicFilterOptions';
import { getFiltersFromUrl, updateUrlWithFilters } from '@/lib/filterUrl';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { clerkAppearance, userButtonAppearance } from '@/lib/clerk-appearance';
import { FavoritesProvider } from '@/contexts/FavoritesContext';

const MAX_SAVED_FILTERS = 25;
const SAVED_FILTER_CONTEXT_KEY = 'savedFilterNewJobsContext';
const NEW_BADGE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

interface SavedFilterContext {
  filterId: number;
  lastCheckedAt: string;
  expiresAt: number;
}

function saveSavedFilterContext(filterId: number, lastCheckedAt: string) {
  const context: SavedFilterContext = {
    filterId,
    lastCheckedAt,
    expiresAt: Date.now() + NEW_BADGE_DURATION_MS,
  };
  localStorage.setItem(SAVED_FILTER_CONTEXT_KEY, JSON.stringify(context));
}

function loadSavedFilterContext(): SavedFilterContext | null {
  try {
    const stored = localStorage.getItem(SAVED_FILTER_CONTEXT_KEY);
    if (!stored) return null;
    const context: SavedFilterContext = JSON.parse(stored);
    // Check if expired
    if (Date.now() > context.expiresAt) {
      localStorage.removeItem(SAVED_FILTER_CONTEXT_KEY);
      return null;
    }
    return context;
  } catch {
    return null;
  }
}

function clearSavedFilterContext() {
  localStorage.removeItem(SAVED_FILTER_CONTEXT_KEY);
}

function FavoritesButton({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md bg-background hover:bg-accent hover:text-accent-foreground transition-colors ${
        isActive ? 'text-red-500' : ''
      }`}
      aria-label={isActive ? 'Show all jobs' : 'View favorites'}
    >
      {isActive ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
}

function HomeContent() {
  const { isSignedIn } = useAuth();
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [dynamicOptions, setDynamicOptions] = useState<DynamicOptions>(getEmptyOptions());
  const [isInitialized, setIsInitialized] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoadingSavedFilters, setIsLoadingSavedFilters] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showingFavorites, setShowingFavorites] = useState(false);
  // Track saved filter context for "New" badges - stores last_checked_at before it was updated
  const [savedFilterLastChecked, setSavedFilterLastChecked] = useState<string | null>(null);

  // Load filters from URL on mount and restore saved filter context
  useEffect(() => {
    async function loadFiltersFromUrl() {
      const urlFilters = getFiltersFromUrl();
      if (urlFilters.length > 0) {
        setFilters(urlFilters);
        // Immediately fetch filtered count to avoid showing 0 while waiting
        try {
          const count = await fetchJobsCount(urlFilters);
          setFilteredCount(count);
        } catch (error) {
          console.error('Error fetching filtered count on load:', error);
        }
      }

      // Restore saved filter context from localStorage if valid
      const storedContext = loadSavedFilterContext();
      if (storedContext) {
        setSavedFilterLastChecked(storedContext.lastCheckedAt);
      }

      setIsInitialized(true);
    }

    loadFiltersFromUrl();
  }, []);

  // Update URL when filters change (after initialization)
  useEffect(() => {
    if (isInitialized) {
      updateUrlWithFilters(filters);
    }
  }, [filters, isInitialized]);

  // Load total count and sample for filter options on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Fetch total job count from database (unfiltered)
        const count = await fetchJobsCount();
        setTotalJobs(count);
        // Don't set filteredCount here - it will be set by the filters effect after URL filters are loaded

        // Fetch sample of jobs to generate filter dropdown options
        const sampleJobs = await fetchJobsSample(1000);
        const options = generateDynamicOptions(sampleJobs);

        // Fetch actual counts for office days information
        const { withOfficeDays, totalHybrid } = await countJobsWithOfficeDays();
        options.officeDaysWithInfo = withOfficeDays;
        options.totalHybridJobs = totalHybrid;

        setDynamicOptions(options);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    }

    loadInitialData();
  }, []);

  // Update filtered count when filters change
  useEffect(() => {
    async function updateFilteredCount() {
      try {
        const count = await fetchJobsCount(filters);
        setFilteredCount(count);
      } catch (error) {
        console.error('Error fetching filtered count:', error);
      }
    }

    updateFilteredCount();
  }, [filters]);

  // Fetch saved filters when user signs in
  useEffect(() => {
    if (isSignedIn) {
      fetchSavedFilters();
    } else {
      setSavedFilters([]);
    }
  }, [isSignedIn]);

  // Fetch saved filters from API
  async function fetchSavedFilters() {
    setIsLoadingSavedFilters(true);
    try {
      const response = await fetch('/api/saved-filters');
      if (response.ok) {
        const data = await response.json();
        setSavedFilters(data);
      } else {
        console.error('Failed to fetch saved filters');
      }
    } catch (error) {
      console.error('Error fetching saved filters:', error);
    } finally {
      setIsLoadingSavedFilters(false);
    }
  }

  // Handle saving a new filter
  async function handleSaveFilter(name: string) {
    try {
      const response = await fetch('/api/saved-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, filters }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save filter');
      }

      const newFilter = await response.json();
      setSavedFilters((prev) => [newFilter, ...prev]);
    } catch (error: any) {
      throw error;
    }
  }

  // Handle renaming a saved filter
  async function handleRenameSavedFilter(id: number, name: string) {
    try {
      const response = await fetch(`/api/saved-filters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rename filter');
      }

      const updatedFilter = await response.json();
      setSavedFilters((prev) =>
        prev.map((f) => (f.id === id ? updatedFilter : f))
      );
    } catch (error: any) {
      throw error;
    }
  }

  // Handle deleting a saved filter
  async function handleDeleteSavedFilter(id: number) {
    try {
      const response = await fetch(`/api/saved-filters/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete filter');
      }

      setSavedFilters((prev) => prev.filter((f) => f.id !== id));
    } catch (error: any) {
      throw error;
    }
  }

  // Handle applying a saved filter and mark it as checked
  async function handleApplySavedFilter(filterConditions: FilterCondition[], filterId: number) {
    // Find the filter to get its last_checked_at before updating
    const savedFilter = savedFilters.find((f) => f.id === filterId);
    if (savedFilter?.last_checked_at) {
      setSavedFilterLastChecked(savedFilter.last_checked_at);
      // Store in localStorage so it persists across page refreshes for 12 hours
      saveSavedFilterContext(filterId, savedFilter.last_checked_at);
    } else {
      setSavedFilterLastChecked(null);
      clearSavedFilterContext();
    }

    setFilters(filterConditions);

    // Mark filter as checked to reset new job count
    try {
      await fetch(`/api/saved-filters/${filterId}/mark-checked`, {
        method: 'POST',
      });

      // Update local state to reset new_job_count to 0
      setSavedFilters((prev) =>
        prev.map((f) =>
          f.id === filterId ? { ...f, new_job_count: 0, last_checked_at: new Date().toISOString() } : f
        )
      );
    } catch (error) {
      console.error('Error marking filter as checked:', error);
    }
  }

  // Clear saved filter context when filters change manually
  function handleFiltersChange(newFilters: FilterCondition[]) {
    setSavedFilterLastChecked(null);
    clearSavedFilterContext();
    setFilters(newFilters);
  }

  // Handle toggling notifications for a saved filter
  async function handleToggleNotifications(id: number, enabled: boolean) {
    try {
      const response = await fetch(`/api/saved-filters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications_enabled: enabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle notifications');
      }

      const updatedFilter = await response.json();
      setSavedFilters((prev) =>
        prev.map((f) => (f.id === id ? { ...f, notifications_enabled: updatedFilter.notifications_enabled } : f))
      );
    } catch (error: any) {
      throw error;
    }
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 bg-background px-3 py-2 w-fit rounded-md">
              Netherlands Job Opportunities
            </h1>
            <p className="text-muted-foreground bg-background px-3 py-1.5 w-fit rounded-md">
              Find your dream job in the Netherlands with advanced filtering and notifications
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-end sm:items-center">
            <SignedIn>
              <FavoritesButton
                isActive={showingFavorites}
                onClick={() => setShowingFavorites(!showingFavorites)}
              />
            </SignedIn>
            <ThemeToggle />
            <SignedOut>
              <SignInButton mode="modal" appearance={clerkAppearance}>
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton appearance={userButtonAppearance} />
            </SignedIn>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar - Advanced Filters */}
          <aside className="w-full lg:w-96 flex-shrink-0">
            <MetabaseStyleFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              resultCount={filteredCount}
              totalCount={totalJobs}
              dynamicOptions={dynamicOptions}
              isSignedIn={isSignedIn}
              onSaveFilter={() => setIsSaveModalOpen(true)}
              savedFilters={savedFilters}
              onApplySavedFilter={handleApplySavedFilter}
              onRenameSavedFilter={handleRenameSavedFilter}
              onDeleteSavedFilter={handleDeleteSavedFilter}
              onToggleNotifications={handleToggleNotifications}
              isLoadingSavedFilters={isLoadingSavedFilters}
              disabled={showingFavorites}
            />
          </aside>

          {/* Right content - Job listings */}
          <div className="flex-1 min-w-0">
            <JobList
              filters={filters}
              showFavorites={showingFavorites}
              savedFilterLastChecked={savedFilterLastChecked}
            />
          </div>
        </div>
      </div>

      {/* Save Filter Modal */}
      <SaveFilterModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveFilter}
        currentCount={savedFilters.length}
        maxCount={MAX_SAVED_FILTERS}
      />
    </main>
  );
}

export default function Home() {
  return (
    <FavoritesProvider>
      <HomeContent />
    </FavoritesProvider>
  );
}
