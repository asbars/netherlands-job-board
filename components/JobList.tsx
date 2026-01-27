/**
 * Job List Component
 * Displays filtered job listings with pagination
 */

'use client';

import { useEffect, useState } from 'react';
import { Job } from '@/types/job';
import { FilterCondition } from '@/types/filters';
import { fetchJobs } from '@/lib/supabase';
import { applyFilters } from '@/lib/filterEngine';
import JobCard from './JobCard';

const DEFAULT_PAGE_SIZE = 20;

interface JobListProps {
  filters: FilterCondition[];
}

export default function JobList({ filters }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchJobs();
        setJobs(data);
      } catch (err) {
        setError('Failed to load jobs. Please check your connection and try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Apply filters using the filter engine
  const filteredJobs = applyFilters(jobs, filters);

  // Pagination calculations
  const totalPages = Math.ceil(filteredJobs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-800 font-medium mb-2">Error Loading Jobs</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (filteredJobs.length === 0 && jobs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-700 text-lg font-medium mb-2">No jobs yet</p>
        <p className="text-gray-500 text-sm">
          The database is empty. Run the populate script to add jobs.
        </p>
      </div>
    );
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-12 text-center">
        <svg className="w-16 h-16 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <p className="text-amber-900 text-lg font-medium mb-2">No matching jobs</p>
        <p className="text-amber-700 text-sm mb-4">
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} available, but none match your filters.
        </p>
        <p className="text-amber-600 text-xs">
          Try removing or adjusting some filters
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredJobs.length === jobs.length ? 'All Jobs' : 'Filtered Results'}
          </h2>
          <div className="text-sm text-gray-500">
            {filteredJobs.length.toLocaleString()} {filteredJobs.length === 1 ? 'job' : 'jobs'}
          </div>
        </div>

        {filteredJobs.length < jobs.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
            <span className="font-medium">{filteredJobs.length}</span> of{' '}
            <span className="font-medium">{jobs.length}</span> jobs match your filters
          </div>
        )}
      </div>

      <div className="space-y-4">
        {paginatedJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
