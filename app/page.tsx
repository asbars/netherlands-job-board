/**
 * Home Page - Netherlands Job Board
 * Features Metabase-style advanced filtering with URL persistence
 */

'use client';

import { useState, useEffect } from 'react';
import { FilterCondition } from '@/types/filters';
import MetabaseStyleFilters from '@/components/MetabaseStyleFilters';
import JobList from '@/components/JobList';
import { fetchJobsCount, fetchJobsSample, countJobsWithOfficeDays } from '@/lib/supabase';
import { generateDynamicOptions, DynamicOptions, getEmptyOptions } from '@/lib/dynamicFilterOptions';
import { getFiltersFromUrl, updateUrlWithFilters } from '@/lib/filterUrl';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [dynamicOptions, setDynamicOptions] = useState<DynamicOptions>(getEmptyOptions());
  const [isInitialized, setIsInitialized] = useState(false);

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

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Netherlands Job Opportunities
            </h1>
            <p className="text-muted-foreground">
              Find your dream job in the Netherlands with advanced filtering and notification
            </p>
          </div>
          <ThemeToggle />
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
            />
          </aside>

          {/* Right content - Job listings */}
          <div className="flex-1 min-w-0">
            <JobList filters={filters} />
          </div>
        </div>
      </div>
    </main>
  );
}
