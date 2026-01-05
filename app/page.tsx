'use client';

import { useState } from 'react';
import { FilterState } from '@/types/job';
import FilterPanel from '@/components/FilterPanel';
import JobList from '@/components/JobList';

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    title: '',
    organization: '',
    location: '',
    job_type: '',
    experience_level: '',
    remote_allowed: null,
    description: '',
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Netherlands Job Board
          </h1>
          <p className="text-lg text-gray-600">
            Jobs for expats in the Netherlands • Updated daily from verified company career sites
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar - Filters */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <FilterPanel filters={filters} onFilterChange={setFilters} />
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

