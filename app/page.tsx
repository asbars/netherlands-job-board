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

  // Load total count and dynamic filter options on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Fetch total job count
        const count = await fetchJobsCount();
        setTotalJobs(count);

        // Fetch sample of jobs to generate filter dropdown options
        const sampleJobs = await fetchJobsSample();
        const options = generateDynamicOptions(sampleJobs);
        setDynamicOptions(options);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    }

    loadInitialData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Netherlands Job Board
          </h1>
          <p className="text-gray-600">
            Find your next opportunity in the Netherlands with advanced filtering
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar - Advanced Filters */}
          <aside className="w-full lg:w-96 flex-shrink-0">
            <div className="sticky top-4">
              <MetabaseStyleFilters
                filters={filters}
                onFiltersChange={setFilters}
                resultCount={totalJobs}
                totalCount={totalJobs}
                dynamicOptions={dynamicOptions}
              />
            </div>
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
