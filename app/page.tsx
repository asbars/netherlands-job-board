/**
 * Home Page - Netherlands Job Board
 * Features Metabase-style advanced filtering with URL persistence
 */

'use client';

import { useState, useEffect } from 'react';
import { FilterCondition } from '@/types/filters';
import MetabaseStyleFilters from '@/components/MetabaseStyleFilters';
import JobList from '@/components/JobList';
import { fetchJobsCount, fetchJobsSample } from '@/lib/supabase';
import { generateDynamicOptions, DynamicOptions, getEmptyOptions } from '@/lib/dynamicFilterOptions';
import { getFiltersFromUrl, updateUrlWithFilters } from '@/lib/filterUrl';

export default function Home() {
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [dynamicOptions, setDynamicOptions] = useState<DynamicOptions>(getEmptyOptions());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load filters from URL on mount (only once)
  useEffect(() => {
    const urlFilters = getFiltersFromUrl();
    if (urlFilters.length > 0) {
      setFilters(urlFilters);
    }
    setIsInitialized(true);
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
        setFilteredCount(count);

        // Fetch sample of jobs to generate filter dropdown options
        const sampleJobs = await fetchJobsSample(1000);
        const options = generateDynamicOptions(sampleJobs);
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
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Netherlands Job Board
          </h1>
          <p className="text-muted-foreground">
            Find your next opportunity in the Netherlands with advanced filtering
          </p>
        </header>

        {/* Section title - above both columns */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">All Jobs</h2>
          <div className="text-sm text-muted-foreground">
            {filteredCount.toLocaleString()} {filteredCount === 1 ? 'job' : 'jobs'} found
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar - Advanced Filters */}
          <aside className="w-full lg:w-96 flex-shrink-0">
            <div className="sticky top-4">
              <MetabaseStyleFilters
                filters={filters}
                onFiltersChange={setFilters}
                resultCount={filteredCount}
                totalCount={totalJobs}
                dynamicOptions={dynamicOptions}
              />
            </div>
          </aside>

          {/* Right content - Job listings */}
          <div className="flex-1 min-w-0">
            <JobList filters={filters} hideHeader />
          </div>
        </div>
      </div>
    </main>
  );
}
