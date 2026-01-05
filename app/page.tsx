/**
 * Home Page - Netherlands Job Board
 * Features Metabase-style advanced filtering
 */

'use client';

import { useState, useEffect } from 'react';
import { FilterCondition } from '@/types/filters';
import MetabaseStyleFilters from '@/components/MetabaseStyleFilters';
import JobList from '@/components/JobList';
import { fetchJobs } from '@/lib/supabase';
import { applyFilters } from '@/lib/filterEngine';

export default function Home() {
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  // Load jobs to get counts
  useEffect(() => {
    async function loadJobCounts() {
      try {
        const jobs = await fetchJobs();
        setTotalJobs(jobs.length);
        const filtered = applyFilters(jobs, filters);
        setFilteredCount(filtered.length);
      } catch (error) {
        console.error('Error loading job counts:', error);
      }
    }

    loadJobCounts();
  }, [filters]);

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
                resultCount={filteredCount}
                totalCount={totalJobs}
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
