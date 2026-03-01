/**
 * Home Page - Netherlands Job Board
 * Features Metabase-style advanced filtering with URL persistence
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
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

interface SavedFilterContext {
  filterId: number;
  lastCheckedAt: string;
  expiresAt: number;
}

/**
 * Calculate badge expiry as the earlier of +12 hours or next 4am local time.
 */
function calculateBadgeExpiry(): Date {
  const now = new Date();
  const twelveHours = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  const next4am = new Date(now);
  next4am.setHours(4, 0, 0, 0);
  if (next4am <= now) {
    next4am.setDate(next4am.getDate() + 1);
  }

  return new Date(Math.min(twelveHours.getTime(), next4am.getTime()));
}

// localStorage functions (fallback for when server-side storage fails or user not signed in)
function saveSavedFilterContextLocal(filterId: number, lastCheckedAt: string) {
  const expiresAt = calculateBadgeExpiry();
  const context: SavedFilterContext = {
    filterId,
    lastCheckedAt,
    expiresAt: expiresAt.getTime(),
  };
  localStorage.setItem(SAVED_FILTER_CONTEXT_KEY, JSON.stringify(context));
}

function loadSavedFilterContextLocal(): SavedFilterContext | null {
  try {
    const stored = localStorage.getItem(SAVED_FILTER_CONTEXT_KEY);
    if (!stored) return null;
    const context: SavedFilterContext = JSON.parse(stored);
    if (Date.now() > context.expiresAt) {
      localStorage.removeItem(SAVED_FILTER_CONTEXT_KEY);
      return null;
    }
    return context;
  } catch {
    return null;
  }
}

function clearSavedFilterContextLocal() {
  localStorage.removeItem(SAVED_FILTER_CONTEXT_KEY);
}

// Server-side context functions
async function fetchFilterContextFromServer(): Promise<{ viewingSince: string } | null> {
  try {
    const response = await fetch('/api/filter-context');
    if (!response.ok) return null;
    const data = await response.json();
    if (!data) return null;
    return { viewingSince: data.viewing_since };
  } catch {
    return null;
  }
}

async function clearFilterContextOnServer(): Promise<void> {
  try {
    await fetch('/api/filter-context', { method: 'DELETE' });
  } catch {
    // Silently fail, localStorage will be cleared anyway
  }
}

function FavoritesButton({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 inline-flex items-center justify-center rounded-md transition-colors ${
        isActive
          ? 'text-red-500 hover:text-red-400'
          : 'text-foreground hover:text-primary'
      }`}
      aria-label={isActive ? 'Show all jobs' : 'View favorites'}
    >
      {isActive ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const [activeSavedFilterId, setActiveSavedFilterId] = useState<number | null>(null);
  const [showingFavorites, setShowingFavorites] = useState(false);
  // Track saved filter context for "New" badges - stores last_checked_at before it was updated
  const [savedFilterLastChecked, setSavedFilterLastChecked] = useState<string | null>(null);
  // Track scroll position for collapsing header
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Collapse header after scrolling past ~80px
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

      // Restore saved filter context - try server first (for cross-device), then localStorage (fallback)
      if (isSignedIn) {
        const serverContext = await fetchFilterContextFromServer();
        if (serverContext) {
          setSavedFilterLastChecked(serverContext.viewingSince);
          setIsInitialized(true);
          return;
        }
      }

      // Fallback to localStorage
      const storedContext = loadSavedFilterContextLocal();
      if (storedContext) {
        setSavedFilterLastChecked(storedContext.lastCheckedAt);
      }

      setIsInitialized(true);
    }

    loadFiltersFromUrl();
  }, [isSignedIn]);

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

  // Handle saving a filter (new or update existing)
  async function handleSaveFilter(name: string, updateId?: number) {
    try {
      if (updateId) {
        // Update existing filter
        const response = await fetch(`/api/saved-filters/${updateId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, filters }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update filter');
        }

        const updatedFilter = await response.json();
        setSavedFilters((prev) =>
          prev.map((f) => (f.id === updateId ? { ...f, ...updatedFilter } : f))
        );
        setActiveSavedFilterId(updateId);
      } else {
        // Create new filter
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
        setActiveSavedFilterId(newFilter.id);
      }
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
    setActiveSavedFilterId(filterId);
    const savedFilter = savedFilters.find((f) => f.id === filterId);

    // Check if this filter already has a valid (non-expired) badge
    const now = new Date();
    const hasValidBadge =
      savedFilter?.badge_count_expires_at &&
      new Date(savedFilter.badge_count_expires_at) > now &&
      savedFilter.new_jobs_since;

    if (hasValidBadge) {
      // Badge is still valid - use the stored new_jobs_since boundary
      // This preserves "New" badges on job cards across repeated clicks
      setSavedFilterLastChecked(savedFilter.new_jobs_since!);
      saveSavedFilterContextLocal(filterId, savedFilter.new_jobs_since!);
      setFilters(filterConditions);

      // Still call mark-checked to refresh context, but it will return early
      try {
        await fetch(`/api/saved-filters/${filterId}/mark-checked`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expires_at: savedFilter.badge_count_expires_at }),
        });
      } catch {
        // Non-critical, context refresh failed
      }
      return;
    }

    // Badge expired or never set - create new snapshot
    if (savedFilter?.last_checked_at) {
      setSavedFilterLastChecked(savedFilter.last_checked_at);
      saveSavedFilterContextLocal(filterId, savedFilter.last_checked_at);
    } else {
      setSavedFilterLastChecked(null);
      clearSavedFilterContextLocal();
    }

    setFilters(filterConditions);

    // Mark filter as checked (stores context, badge snapshot, and new_jobs_since)
    try {
      const expiresAt = calculateBadgeExpiry();
      const response = await fetch(`/api/saved-filters/${filterId}/mark-checked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_at: expiresAt.toISOString() }),
      });

      if (response.ok) {
        const result = await response.json();
        setSavedFilters((prev) =>
          prev.map((f) =>
            f.id === filterId
              ? {
                  ...f,
                  new_job_count: result.badge_count_snapshot ?? f.new_job_count,
                  last_checked_at: result.last_checked_at,
                  badge_count_snapshot: result.badge_count_snapshot,
                  badge_count_expires_at: result.badge_count_expires_at,
                  new_jobs_since: result.new_jobs_since,
                }
              : f
          )
        );
      }
    } catch (error) {
      console.error('Error marking filter as checked:', error);
    }
  }

  // Clear saved filter context when filters change manually
  function handleFiltersChange(newFilters: FilterCondition[]) {
    // Keep activeSavedFilterId so the user can still "Update" the filter they started from.
    // Only clear it when filters are fully removed (e.g. "Clear all").
    if (newFilters.length === 0) {
      setActiveSavedFilterId(null);
    }
    setSavedFilterLastChecked(null);
    clearSavedFilterContextLocal();
    // Clear server-side context too (fire and forget)
    if (isSignedIn) {
      clearFilterContextOnServer();
    }
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

  // Determine if the current filters differ from the active saved filter
  const isFilterModified = useMemo(() => {
    if (!activeSavedFilterId) return true; // No saved filter active — always show Save
    const active = savedFilters.find(f => f.id === activeSavedFilterId);
    if (!active) return true;
    return JSON.stringify(filters) !== JSON.stringify(active.filters);
  }, [filters, activeSavedFilterId, savedFilters]);

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* === HEADER === */}
        {/* On mobile: always visible, never collapses. On desktop: collapses on scroll. */}
        <header
          className={`pt-6 pb-4 transition-all duration-300 ease-in-out lg:overflow-hidden ${
            isScrolled
              ? 'lg:max-h-0 lg:opacity-0 lg:pt-0 lg:pb-0'
              : 'lg:max-h-32 lg:opacity-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3 lg:pr-14">
            <div className="flex items-start sm:items-end gap-3 min-w-0">
              <a href="/" className="flex-shrink-0">
                <img src="/logo.png" alt="Logo" className="w-16 sm:w-20" />
              </a>
              <div className="min-w-0">
              <a href="/" className="no-underline hover:no-underline">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-1 bg-background px-3 py-1 w-fit rounded-md">
                  Netherlands Job Opportunities
                </h1>
              </a>
              <p className="text-muted-foreground bg-background px-3 py-1 w-fit rounded-md text-xs sm:text-sm">
                Find your dream job in the Netherlands with advanced filtering and notifications
              </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center flex-shrink-0">
              <SignedIn>
                <FavoritesButton
                  isActive={showingFavorites}
                  onClick={() => setShowingFavorites(!showingFavorites)}
                />
              </SignedIn>
              <ThemeToggle />
              <SignedOut>
                <SignInButton mode="modal" appearance={clerkAppearance}>
                  <button className="p-2 sm:px-4 sm:py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    <span className="hidden sm:inline">Sign In</span>
                    <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton appearance={userButtonAppearance} />
              </SignedIn>
            </div>
          </div>
        </header>

        {/* === MAIN CONTENT (3-column when scrolled, 2-column at top) === */}
        <div className="flex flex-col lg:flex-row gap-6 pb-6 pt-2">
          {/* Left sidebar - Compact branding (when scrolled) + Filters (always sticky) */}
          <aside className={`w-full lg:w-96 flex-shrink-0 lg:sticky lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overflow-x-hidden scrollbar-hidden transition-all duration-300 ${
            isScrolled ? 'lg:top-4' : 'lg:top-4'
          }`}>
            {/* Compact branding - slides in when scrolled (desktop only) */}
            <div
              className={`hidden lg:block transition-all duration-300 ease-in-out overflow-hidden ${
                isScrolled
                  ? 'max-h-28 opacity-100 mb-4'
                  : 'max-h-0 opacity-0 mb-0'
              }`}
            >
              <h1 className="text-2xl font-heading font-bold text-foreground leading-tight mb-1">
                Netherlands Job Opportunities
              </h1>
              <p className="text-sm text-muted-foreground leading-snug">
                Find your dream job with advanced filtering and notifications
              </p>
            </div>

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
              activeSavedFilterName={
                activeSavedFilterId
                  ? savedFilters.find(f => f.id === activeSavedFilterId)?.name ?? null
                  : null
              }
              onNewFilter={() => setActiveSavedFilterId(null)}
              isFilterModified={isFilterModified}
            />
          </aside>

          {/* Center content - Job listings */}
          <div className="flex-1 min-w-0">
            <JobList
              filters={filters}
              showFavorites={showingFavorites}
              savedFilterLastChecked={savedFilterLastChecked}
            />
          </div>

          {/* Right toolbar - appears when scrolled (desktop only) */}
          <div
            className={`hidden lg:flex flex-col gap-2 lg:sticky lg:top-4 lg:self-start transition-all duration-300 ease-in-out ${
              isScrolled
                ? 'opacity-100 translate-x-0 w-auto'
                : 'opacity-0 translate-x-4 w-0 overflow-hidden'
            }`}
          >
            <SignedIn>
              <FavoritesButton
                isActive={showingFavorites}
                onClick={() => setShowingFavorites(!showingFavorites)}
              />
            </SignedIn>
            <ThemeToggle />
            <SignedOut>
              <SignInButton mode="modal" appearance={clerkAppearance}>
                <button className="p-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors" title="Sign In">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton appearance={userButtonAppearance} />
            </SignedIn>
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
        activeFilter={activeSavedFilterId ? savedFilters.find(f => f.id === activeSavedFilterId) ?? null : null}
        savedFilterNames={savedFilters.map(f => ({ id: f.id, name: f.name }))}
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
