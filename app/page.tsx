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

const MAX_SAVED_FILTERS = 25;

export default function Home() {
  const { isSignedIn } = useAuth();
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [dynamicOptions, setDynamicOptions] = useState<DynamicOptions>(getEmptyOptions());
  const [isInitialized, setIsInitialized] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoadingSavedFilters, setIsLoadingSavedFilters] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Load filters from URL on mount (only once)
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

  // Handle applying a saved filter
  function handleApplySavedFilter(filterConditions: FilterCondition[]) {
    setFilters(filterConditions);
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Netherlands Job Opportunities
            </h1>
            <p className="text-muted-foreground">
              Find your dream job in the Netherlands with advanced filtering and notifications
            </p>
          </div>
          <div className="flex gap-4 items-center">
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
              onFiltersChange={setFilters}
              resultCount={filteredCount}
              totalCount={totalJobs}
              dynamicOptions={dynamicOptions}
              isSignedIn={isSignedIn}
              onSaveFilter={() => setIsSaveModalOpen(true)}
              savedFilters={savedFilters}
              onApplySavedFilter={handleApplySavedFilter}
              onRenameSavedFilter={handleRenameSavedFilter}
              onDeleteSavedFilter={handleDeleteSavedFilter}
              isLoadingSavedFilters={isLoadingSavedFilters}
            />
          </aside>

          {/* Right content - Job listings */}
          <div className="flex-1 min-w-0">
            <JobList filters={filters} />
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
